import TorchOCR from './TorchOCR'
import { ipcMain } from 'electron'
import logger from '@/logger'
import { Tensor } from 'torch-js'
import Config from '@/config'
import { SubtitleInfo, VideoProperties } from '@/interfaces'

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
    }

    async Init(path: string): Promise<void> {
        this.torchOCR.InitRCNN()
        await this.torchOCR.InitOCR()
        await this.torchOCR.InitVideoPlayer(path)
    }

    async Start(): Promise<SubtitleInfo[]> {
        let step = Config.BatchSize
        let tensorDataPromise = new Promise(resolve => resolve())
        let rcnnPromise = new Promise(resolve => resolve())
        let ocrPromise = new Promise(resolve => resolve())
        const ocrPromiseBuffer = [ocrPromise, ocrPromise, ocrPromise, ocrPromise]
        if (this.torchOCR.videoProperties === undefined) {
            throw new Error('VideoPlayer is not initialized')
        }

        for (let frame = 0; frame <= this.torchOCR.videoProperties.lastFrame; frame += step) {
            if (this.torchOCR.videoProperties.lastFrame + 1 - frame < step) {
                step = this.torchOCR.videoProperties.lastFrame + 1 - frame
            }

            tensorDataPromise = Promise.all([tensorDataPromise, ocrPromiseBuffer[0]]).then(async () => {
                const rawImg: Buffer[] = []
                for (const i of Array(step).keys()) {
                    console.log(`read frame ${i + frame}`)
                    console.log(`last frame ${(this.torchOCR.videoProperties as VideoProperties).lastFrame}`)
                    rawImg.push(await this.torchOCR.ReadRawFrame(i + frame))
                }
                this.currentProcessingFrame = frame
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
                        subtitleInfos[i].text = ocrResults[i]
                        subtitleInfos[i].startFrame = subtitleInfos[i].startFrame + frame
                        subtitleInfos[i].endFrame = subtitleInfos[i].endFrame + frame
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
}

export default TorchOCRTaskScheduler
