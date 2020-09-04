import { ScriptModule, ObjectTensor, Tensor } from 'torch-js'
import Config from '@/config'
import { ipcMain } from 'electron'
import logger from '@/logger'
import fs_ from 'fs'
import RawVideoPlayer from './RawVideoPlayer'
import { VideoProperties } from '@/interfaces'
import lodash from 'lodash'

const fs = fs_.promises

class TorchOCR {
    private RCNNModule: ScriptModule | undefined
    private OCRModule: ScriptModule | undefined
    private OCRChars: string | undefined
    private VideoPlayer: RawVideoPlayer | undefined
    private VideoProperties: VideoProperties | undefined

    registerIPCListener(): void {
        ipcMain.handle('TorchOCR:InitRCNN', () => {
            try {
                return this.InitRCNN()
            } catch (error) {
                logger.error(error.message)
                return null
            }
        })
        ipcMain.handle('TorchOCR:InitOCR', async () => {
            try {
                return await this.InitOCR()
            } catch (error) {
                logger.error(error.message)
                return null
            }
        })
    }

    InitRCNN(path: string | null = null): void {
        if (path == null) { path = Config.RCNNModulePath }
        this.RCNNModule = new ScriptModule(path)
        if (Config.EnableCuda && ScriptModule.isCudaAvailable()) { this.RCNNModule = this.RCNNModule.cuda() }
    }

    async InitOCR(modulePath: string | null = null, charsPath: string | null = null): Promise<void> {
        if (modulePath == null) { modulePath = Config.OCRModulePath }
        if (charsPath == null) { charsPath = Config.OCRCharsPath }
        this.OCRModule = new ScriptModule(modulePath)
        this.OCRChars = await fs.readFile(charsPath, { encoding: 'utf-8' })
        if (Config.EnableCuda && ScriptModule.isCudaAvailable()) { this.OCRModule = this.OCRModule.cuda() }
    }

    async InitVideoPlayer(path: string): Promise<VideoProperties> {
        this.VideoPlayer = new RawVideoPlayer()
        this.VideoProperties = await this.VideoPlayer.OpenVideo(path)
        return this.VideoProperties
    }

    async ReadRawFrame(frame: number): Promise<Buffer> {
        if (this.VideoPlayer === undefined || this.VideoProperties === undefined) {
            throw new Error('VideoPlayer is not initialized')
        }
        const unitFrame = this.VideoProperties.timeBase[1] *
                this.VideoProperties.fps[1] /
                this.VideoProperties.timeBase[0] /
                this.VideoProperties.fps[0]
        const timestamp = lodash.toInteger(frame * unitFrame)
        const rawFrame = await this.VideoPlayer.RenderImage(timestamp)
        let rawData = rawFrame.data[0] as Buffer
        rawData = rawData.slice(0, 3 * this.VideoProperties.height * this.VideoProperties.width)
        return rawData
    }

    BufferToImgTensor(buffers: Buffer[], cropTop = 0): Tensor {
        if (this.VideoProperties === undefined) {
            throw new Error('VideoPlayer is not initialized')
        }

        const oneImgLength = 3 * (this.VideoProperties.height - cropTop) * this.VideoProperties.width
        const imgObjTensor = {
            data: new Float32Array(buffers.length * oneImgLength),
            shape: [buffers.length, this.VideoProperties.height - cropTop, this.VideoProperties.width, 3]
        } as ObjectTensor

        for (let j = 0; j < buffers.length; j++) {
            const buffer = buffers[j]
            if (this.VideoProperties === undefined) {
                throw new Error('VideoPlayer is not initialized')
            }
            if (buffer.length !== 3 * this.VideoProperties.height * this.VideoProperties.width) {
                throw new Error(`Buffer length mismatch. Should be ${3 * this.VideoProperties.height * this.VideoProperties.width}, got ${buffer.length}`)
            }
            if (cropTop < 0) cropTop = 0
            cropTop = lodash.toInteger(cropTop)
            imgObjTensor.data.set(buffer.slice(cropTop * this.VideoProperties.width * 3), j * oneImgLength)
        }
        return Tensor.fromObject(imgObjTensor)
    }

    RCNNForward(input: Tensor): Array<Record<string, Tensor>> {
        if (this.RCNNModule === undefined) {
            throw new Error('RCNN Module is not initialized')
        }
        if (ScriptModule.isCudaAvailable()) {
            const inputCUDA = input.cuda()
            const result = this.RCNNModule.forward(inputCUDA) as Array<Record<string, Tensor>>
            inputCUDA.free()
            return result
        } else {
            return this.RCNNModule.forward(input) as Array<Record<string, Tensor>>
        }
    }
}

export default TorchOCR
