import TorchOCR from './TorchOCR'
import { ipcMain } from 'electron'
import { parentPort as parentPortNull } from 'worker_threads'
import logger from '@/logger'
import { Tensor } from 'torch-js'
import Config from '@/config'
import { SubtitleInfo } from '@/SubtitleInfo'
import levenshtein from 'js-levenshtein'
import lodash from 'lodash'

class TorchOCRTaskScheduler {
    private _torchOCR: TorchOCR = new TorchOCR()
    currentProcessingFrame = 0
    subtitleInfos: Array<SubtitleInfo> = []

    registerWorkerListener(): void {
        if (parentPortNull === null) {
            throw new Error('Not in a worker thread')
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const parentPort = parentPortNull
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        parentPort.on('message', async (args: [string, string]) => {
            if (args[0] === 'Init') {
                try {
                    const result = await this.init(args[1])
                    parentPort.postMessage(['Init', result])
                } catch (error) {
                    logger.error((error as Error).message)
                    parentPort.postMessage(['Init', null])
                }
            }
        })
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        parentPort.on('message', async (args: [string]) => {
            if (args[0] === 'Start') {
                try {
                    const result = await this.start()
                    parentPort.postMessage(['Start', result])
                } catch (error) {
                    logger.error((error as Error).message)
                    parentPort.postMessage(['Start', null])
                }
            }
        })
        parentPort.on('message', (args: [string]) => {
            if (args[0] === 'CleanUpSubtitleInfos') {
                try {
                    const result = this.cleanUpSubtitleInfos()
                    parentPort.postMessage(['CleanUpSubtitleInfos', result])
                } catch (error) {
                    logger.error((error as Error).message)
                    parentPort.postMessage(['CleanUpSubtitleInfos', null])
                }
            }
        })
        parentPort.on('message', (args: [string]) => {
            if (args[0] === 'currentProcessingFrame') {
                try {
                    parentPort.postMessage(['currentProcessingFrame', this.currentProcessingFrame])
                } catch (error) {
                    logger.error((error as Error).message)
                    parentPort.postMessage(['currentProcessingFrame', null])
                }
            }
        })
        parentPort.on('message', (args: [string]) => {
            if (args[0] === 'totalFrame') {
                try {
                    if (this._torchOCR.videoProperties === undefined) {
                        throw new Error('VideoPlayer is not initialized')
                    }
                    parentPort.postMessage(['totalFrame', this._torchOCR.videoProperties.lastFrame])
                } catch (error) {
                    logger.error((error as Error).message)
                    parentPort.postMessage(['totalFrame', null])
                }
            }
        })
        parentPort.on('message', (args: [string]) => {
            if (args[0] === 'subtitleInfos') {
                try {
                    parentPort.postMessage(['subtitleInfos', this.subtitleInfos])
                } catch (error) {
                    logger.error((error as Error).message)
                    parentPort.postMessage(['subtitleInfos', null])
                }
            }
        })
    }

    registerIPCListener(): void {
        ipcMain.handle('TorchOCRTaskScheduler:Init', async (e, ...args) => {
            try {
                return await this.init(args[0])
            } catch (error) {
                logger.error((error as Error).message)
                return null
            }
        })
        ipcMain.handle('TorchOCRTaskScheduler:Start', async () => {
            try {
                return await this.start()
            } catch (error) {
                logger.error((error as Error).message)
                return null
            }
        })
        ipcMain.handle('TorchOCRTaskScheduler:CleanUpSubtitleInfos', () => {
            try {
                return this.cleanUpSubtitleInfos()
            } catch (error) {
                logger.error((error as Error).message)
                return null
            }
        })
        ipcMain.handle('TorchOCRTaskScheduler:currentProcessingFrame', () => {
            try {
                return this.currentProcessingFrame
            } catch (error) {
                logger.error((error as Error).message)
                return null
            }
        })
        ipcMain.handle('TorchOCRTaskScheduler:totalFrame', () => {
            try {
                if (this._torchOCR.videoProperties === undefined) {
                    throw new Error('VideoPlayer is not initialized')
                }
                return this._torchOCR.videoProperties.lastFrame
            } catch (error) {
                logger.error((error as Error).message)
                return null
            }
        })
        ipcMain.handle('TorchOCRTaskScheduler:subtitleInfos', () => {
            try {
                return this.subtitleInfos
            } catch (error) {
                logger.error((error as Error).message)
                return null
            }
        })
    }

    async init(path: string): Promise<void> {
        this._torchOCR.initRCNN()
        await this._torchOCR.initOCR()
        await this._torchOCR.initVideoPlayer(path)
    }

    async start(): Promise<Array<SubtitleInfo>> {
        const step = Config.batchSize
        let tensorDataPromise = new Promise(resolve => resolve())
        let rcnnPromise = new Promise(resolve => resolve())
        let ocrPromise = new Promise(resolve => resolve())
        const ocrPromiseBuffer = [ocrPromise, ocrPromise, ocrPromise, ocrPromise]
        if (this._torchOCR.videoProperties === undefined) {
            throw new Error('VideoPlayer is not initialized')
        }

        for (let frame = 0; frame <= this._torchOCR.videoProperties.lastFrame; frame += step) {
            const currentFrame = frame
            let localStep = step
            if (this._torchOCR.videoProperties.lastFrame + 1 - frame < step) {
                localStep = this._torchOCR.videoProperties.lastFrame + 1 - frame
            }

            tensorDataPromise = Promise.all([tensorDataPromise, ocrPromiseBuffer[0]]).then(async () => {
                logger.debug(`loading tensor data on frame ${currentFrame}...`)
                const rawImg: Array<Buffer> = []
                for (const i of Array(localStep).keys()) {
                    rawImg.push(await this._torchOCR.readRawFrame(i + currentFrame))
                }
                this.currentProcessingFrame = currentFrame
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const cropTop = lodash.toInteger(this._torchOCR.videoProperties!.height * 0.7)
                const inputTensor = this._torchOCR.bufferToImgTensor(rawImg, cropTop)
                return inputTensor
            })

            rcnnPromise = Promise.all([rcnnPromise, tensorDataPromise]).then(async (values) => {
                logger.debug(`rcnn on frame ${currentFrame}...`)
                const inputTensor = values[1] as Tensor
                const rcnnResults = await this._torchOCR.rcnnForward(inputTensor)
                return rcnnResults
            })

            ocrPromise = Promise.all([ocrPromise, tensorDataPromise, rcnnPromise]).then(async (values) => {
                logger.debug(`ocr on frame ${currentFrame}...`)
                const inputTensor = values[1] as Tensor
                const rcnnResults = values[2] as Array<Record<string, Tensor>>
                const subtitleInfos = this._torchOCR.rcnnParse(rcnnResults)
                if (subtitleInfos.length !== 0) {
                    const boxesTensor = this._torchOCR.subtitleInfoToTensor(subtitleInfos)
                    const ocrResults = this._torchOCR.ocrParse(await this._torchOCR.ocrForward(inputTensor, boxesTensor))

                    for (const i of subtitleInfos.keys()) {
                        subtitleInfos[i].texts = [ocrResults[i]]
                        subtitleInfos[i].startFrame = subtitleInfos[i].startFrame + currentFrame
                        subtitleInfos[i].endFrame = subtitleInfos[i].endFrame + currentFrame
                        this.subtitleInfos.push(subtitleInfos[i])
                    }
                    boxesTensor.free()
                }
                inputTensor.free()
            })
            void ocrPromiseBuffer.shift()
            ocrPromiseBuffer.push(ocrPromise)
        }
        await Promise.all([tensorDataPromise, rcnnPromise, ocrPromise])
        return this.subtitleInfos
    }

    cleanUpSubtitleInfos(): Array<SubtitleInfo> {
        if (this._torchOCR.videoProperties === undefined) {
            throw new Error('VideoPlayer is not initialized')
        }

        let subtitleInfo: SubtitleInfo | undefined
        const subtitleInfos: Array<SubtitleInfo> = []
        for (const i of this.subtitleInfos.keys()) {
            const currentSubtitleInfo = this.subtitleInfos[i]
            if (subtitleInfo === undefined) {
                subtitleInfo = new SubtitleInfo(currentSubtitleInfo.startFrame, currentSubtitleInfo.endFrame)
            }
            if (subtitleInfo.text !== undefined && currentSubtitleInfo.text !== undefined) {
                if (levenshtein(subtitleInfo.text, currentSubtitleInfo.text) > 3) {
                    subtitleInfo.generateTime(this._torchOCR.videoProperties.fps[0] / this._torchOCR.videoProperties.fps[1])
                    subtitleInfos.push(subtitleInfo)
                    subtitleInfo = new SubtitleInfo(currentSubtitleInfo.startFrame, currentSubtitleInfo.endFrame)
                } else {
                    subtitleInfo.endFrame = currentSubtitleInfo.endFrame
                }
            }
            if (currentSubtitleInfo.text !== undefined) {
                subtitleInfo.texts.push(currentSubtitleInfo.text)
            }
        }
        if (subtitleInfo !== undefined) {
            subtitleInfo.endFrame = this.subtitleInfos[this.subtitleInfos.length - 1].endFrame
            subtitleInfo.generateTime(this._torchOCR.videoProperties.fps[0] / this._torchOCR.videoProperties.fps[1])
            subtitleInfos.push(subtitleInfo)
        }
        this.subtitleInfos = subtitleInfos
        return this.subtitleInfos
    }
}

export default TorchOCRTaskScheduler
