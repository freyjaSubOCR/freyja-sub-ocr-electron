import TorchOCR from './TorchOCR'
import { ipcMain } from 'electron'
import logger from '@/logger'
import { Tensor } from 'torch-js'
import Config from '@/config'
import { SubtitleInfo } from '@/SubtitleInfo'
import levenshtein from 'js-levenshtein'

class TorchOCRTaskScheduler {
    private torchOCR: TorchOCR = new TorchOCR()
    private currentProcessingFrame = 0
    private subtitleInfos: SubtitleInfo[] = []

    registerIPCListener(): void {
        ipcMain.handle('TorchOCRTaskScheduler:Init', async (e, ...args) => {
            try {
                return await this.Init(args[0])
            } catch (error) {
                logger.error(error.message)
                return null
            }
        })
        ipcMain.handle('TorchOCRTaskScheduler:Start', async () => {
            try {
                return await this.Start()
            } catch (error) {
                logger.error(error.message)
                return null
            }
        })
        ipcMain.handle('TorchOCRTaskScheduler:CleanUpSubtitleInfos', () => {
            try {
                return this.CleanUpSubtitleInfos()
            } catch (error) {
                logger.error(error.message)
                return null
            }
        })
        ipcMain.handle('TorchOCRTaskScheduler:currentProcessingFrame', () => {
            try {
                return this.currentProcessingFrame
            } catch (error) {
                logger.error(error.message)
                return null
            }
        })
    }

    async Init(path: string): Promise<void> {
        this.torchOCR.InitRCNN()
        await this.torchOCR.InitOCR()
        await this.torchOCR.InitVideoPlayer(path)
    }

    async Start(): Promise<SubtitleInfo[]> {
        const step = Config.BatchSize
        let tensorDataPromise = new Promise(resolve => resolve())
        let rcnnPromise = new Promise(resolve => resolve())
        let ocrPromise = new Promise(resolve => resolve())
        const ocrPromiseBuffer = [ocrPromise, ocrPromise, ocrPromise, ocrPromise]
        if (this.torchOCR.videoProperties === undefined) {
            throw new Error('VideoPlayer is not initialized')
        }

        for (let frame = 0; frame <= this.torchOCR.videoProperties.lastFrame; frame += step) {
            const currentFrame = frame
            let localStep = step
            if (this.torchOCR.videoProperties.lastFrame + 1 - frame < step) {
                localStep = this.torchOCR.videoProperties.lastFrame + 1 - frame
            }

            tensorDataPromise = Promise.all([tensorDataPromise, ocrPromiseBuffer[0]]).then(async () => {
                const rawImg: Buffer[] = []
                for (const i of Array(localStep).keys()) {
                    rawImg.push(await this.torchOCR.ReadRawFrame(i + currentFrame))
                }
                this.currentProcessingFrame = currentFrame
                const inputTensor = this.torchOCR.BufferToImgTensor(rawImg, 600)
                return inputTensor
            })

            rcnnPromise = Promise.all([rcnnPromise, tensorDataPromise]).then(async (values) => {
                const inputTensor = values[1] as Tensor
                const rcnnResults = await this.torchOCR.RCNNForward(inputTensor)
                return rcnnResults
            })

            ocrPromise = Promise.all([ocrPromise, tensorDataPromise, rcnnPromise]).then(async (values) => {
                const inputTensor = values[1] as Tensor
                const rcnnResults = values[2] as Record<string, Tensor>[]
                const subtitleInfos = this.torchOCR.RCNNParse(rcnnResults)
                if (subtitleInfos.length !== 0) {
                    const boxesTensor = this.torchOCR.SubtitleInfoToTensor(subtitleInfos)
                    const ocrResults = this.torchOCR.OCRParse(await this.torchOCR.OCRForward(inputTensor, boxesTensor))

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
            ocrPromiseBuffer.shift()
            ocrPromiseBuffer.push(ocrPromise)
        }
        await Promise.all([tensorDataPromise, rcnnPromise, ocrPromise])
        return this.subtitleInfos
    }

    CleanUpSubtitleInfos() {
        if (this.torchOCR.videoProperties === undefined) {
            throw new Error('VideoPlayer is not initialized')
        }

        let subtitleInfo: SubtitleInfo | undefined
        const subtitleInfos: SubtitleInfo[] = []
        for (const i of this.subtitleInfos.keys()) {
            const currentSubtitleInfo = this.subtitleInfos[i]
            if (subtitleInfo === undefined) {
                subtitleInfo = new SubtitleInfo(currentSubtitleInfo.startFrame, currentSubtitleInfo.endFrame)
            }
            if (subtitleInfo.text !== undefined && currentSubtitleInfo.text !== undefined) {
                if (levenshtein(subtitleInfo.text, currentSubtitleInfo.text) > 3) {
                    subtitleInfo.GenerateTime(this.torchOCR.videoProperties.fps[0] / this.torchOCR.videoProperties.fps[1])
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
            subtitleInfo.GenerateTime(this.torchOCR.videoProperties.fps[0] / this.torchOCR.videoProperties.fps[1])
            subtitleInfos.push(subtitleInfo)
        }
        this.subtitleInfos = subtitleInfos
        return this.subtitleInfos
    }
}

export default TorchOCRTaskScheduler
