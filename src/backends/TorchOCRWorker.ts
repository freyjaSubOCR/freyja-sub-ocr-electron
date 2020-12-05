import TorchOCR from './TorchOCR'
import logger from '@/logger'
import { Tensor } from 'torch-js'
import { IConfig, Config } from '@/config'
import { SubtitleInfo } from '@/SubtitleInfo'
import levenshtein from 'js-levenshtein'
import { expose } from 'threads/worker'

class TorchOCRWorker {
    private _torchOCR: TorchOCR = new TorchOCR()
    currentProcessingFrame = 0
    subtitleInfos: Array<SubtitleInfo> = []

    async init(path: string): Promise<void> {
        this._torchOCR.initRCNN()
        await this._torchOCR.initOCR()
        await this._torchOCR.initVideoPlayer(path)
    }

    close(): void {
        this._torchOCR.closeVideoPlayer()
        this._torchOCR = new TorchOCR()
    }

    async start(): Promise<Array<SubtitleInfo>> {
        this.currentProcessingFrame = 0
        this.subtitleInfos = []
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
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                for (const i of Array(localStep).keys()) {
                    const frame = await this._torchOCR.readRawFrame(undefined)
                    if (frame === null) {
                        continue
                    }
                    rawImg.push(frame)
                }
                this.currentProcessingFrame = currentFrame
                if (rawImg.length === 0) return null
                const inputTensor = this._torchOCR.bufferToImgTensor(rawImg, Config.cropTop, Config.cropBottom)
                return inputTensor
            })

            rcnnPromise = Promise.all([rcnnPromise, tensorDataPromise]).then(async (values) => {
                logger.debug(`rcnn on frame ${currentFrame}...`)
                const inputTensor = values[1] as Tensor | null
                if (inputTensor === null) return null
                const rcnnResults = await this._torchOCR.rcnnForward(inputTensor)
                return rcnnResults
            })

            ocrPromise = Promise.all([ocrPromise, tensorDataPromise, rcnnPromise]).then(async (values) => {
                logger.debug(`ocr on frame ${currentFrame}...`)
                const inputTensor = values[1] as Tensor | null
                if (inputTensor === null) return null
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
        logger.debug(this.subtitleInfos)
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
        logger.debug(this.subtitleInfos)
        return this.subtitleInfos
    }
}

const torchOCRWorker = new TorchOCRWorker()

const torchOCRWorkerThreadInterface = {
    importConfig(config: IConfig): void {
        Config.import(config)
        if (/\.asar[/\\]/.exec(Config.rcnnModulePath)) {
            Config.rcnnModulePath = Config.rcnnModulePath.replace(/\.asar([/\\])/, '.asar.unpacked$1')
        }
        if (/\.asar[/\\]/.exec(Config.ocrModulePath)) {
            Config.ocrModulePath = Config.ocrModulePath.replace(/\.asar([/\\])/, '.asar.unpacked$1')
        }
        if (/\.asar[/\\]/.exec(Config.ocrCharsPath)) {
            Config.ocrCharsPath = Config.ocrCharsPath.replace(/\.asar([/\\])/, '.asar.unpacked$1')
        }
        logger.debug(Config.export())
    },
    init(path: string): Promise<void> { return torchOCRWorker.init(path) },
    start(): Promise<Array<SubtitleInfo>> { return torchOCRWorker.start() },
    close(): void { return torchOCRWorker.close() },
    cleanUpSubtitleInfos(): Array<SubtitleInfo> { return torchOCRWorker.cleanUpSubtitleInfos() },
    currentProcessingFrame(): number { return torchOCRWorker.currentProcessingFrame }
}

export type TorchOCRWorkerThreadInterface = typeof torchOCRWorkerThreadInterface

expose(torchOCRWorkerThreadInterface)

export default TorchOCRWorker
