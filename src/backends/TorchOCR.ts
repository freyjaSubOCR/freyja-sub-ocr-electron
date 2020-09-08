import { ScriptModule, ObjectTensor, Tensor } from 'torch-js'
import Config from '@/config'
import fs_ from 'fs'
import RawVideoPlayer from './RawVideoPlayer'
import { VideoProperties, SubtitleInfo } from '@/interfaces'
import lodash from 'lodash'

const fs = fs_.promises

class TorchOCR {
    private rcnnModule: ScriptModule | undefined
    private ocrModule: ScriptModule | undefined
    private ocrChars: string | undefined
    private _videoPlayer: RawVideoPlayer | undefined
    private _videoProperties: VideoProperties | undefined

    public get videoProperties() {
        return this._videoProperties
    }

    public get videoPlayer() {
        return this._videoPlayer
    }

    InitRCNN(path: string | null = null): void {
        if (path == null) { path = Config.RCNNModulePath }
        this.rcnnModule = new ScriptModule(path)
        if (Config.EnableCuda && ScriptModule.isCudaAvailable()) { this.rcnnModule = this.rcnnModule.cuda() }
    }

    async InitOCR(modulePath: string | null = null, charsPath: string | null = null): Promise<void> {
        if (modulePath == null) { modulePath = Config.OCRModulePath }
        if (charsPath == null) { charsPath = Config.OCRCharsPath }
        this.ocrModule = new ScriptModule(modulePath)
        this.ocrChars = await fs.readFile(charsPath, { encoding: 'utf-8' })
        if (Config.EnableCuda && ScriptModule.isCudaAvailable()) { this.ocrModule = this.ocrModule.cuda() }
    }

    async InitVideoPlayer(path: string): Promise<VideoProperties> {
        this._videoPlayer = new RawVideoPlayer()
        this._videoProperties = await this._videoPlayer.OpenVideo(path)
        return this.videoProperties as VideoProperties
    }

    async ReadRawFrame(frame: number): Promise<Buffer> {
        if (this.videoPlayer === undefined || this.videoProperties === undefined) {
            throw new Error('VideoPlayer is not initialized')
        }
        const unitFrame = this.videoProperties.timeBase[1] *
                this.videoProperties.fps[1] /
                this.videoProperties.timeBase[0] /
                this.videoProperties.fps[0]
        const timestamp = lodash.toInteger(frame * unitFrame)
        const rawFrame = await this.videoPlayer.RenderImage(timestamp)
        let rawData = rawFrame.data[0] as Buffer
        rawData = rawData.slice(0, 3 * this.videoProperties.height * this.videoProperties.width)
        return rawData
    }

    BufferToImgTensor(buffers: Buffer[], cropTop = 0): Tensor {
        if (this.videoProperties === undefined) {
            throw new Error('VideoPlayer is not initialized')
        }

        const oneImgLength = 3 * (this.videoProperties.height - cropTop) * this.videoProperties.width
        const imgObjTensor = {
            data: new Float32Array(buffers.length * oneImgLength),
            shape: [buffers.length, this.videoProperties.height - cropTop, this.videoProperties.width, 3]
        } as ObjectTensor

        for (let j = 0; j < buffers.length; j++) {
            const buffer = buffers[j]
            if (this.videoProperties === undefined) {
                throw new Error('VideoPlayer is not initialized')
            }
            if (buffer.length !== 3 * this.videoProperties.height * this.videoProperties.width) {
                throw new Error(`Buffer length mismatch. Should be ${3 * this.videoProperties.height * this.videoProperties.width}, got ${buffer.length}`)
            }
            if (cropTop < 0) cropTop = 0
            cropTop = lodash.toInteger(cropTop)
            imgObjTensor.data.set(buffer.slice(cropTop * this.videoProperties.width * 3), j * oneImgLength)
        }
        return Tensor.fromObject(imgObjTensor)
    }

    async RCNNForward(input: Tensor): Promise<Array<Record<string, Tensor>>> {
        if (this.rcnnModule === undefined) {
            throw new Error('RCNN Module is not initialized')
        }
        if (ScriptModule.isCudaAvailable()) {
            const inputCUDA = input.cuda()
            const result = await this.rcnnModule.forward(inputCUDA) as Array<Record<string, Tensor>>
            inputCUDA.free()
            return result
        } else {
            return await this.rcnnModule.forward(input) as Array<Record<string, Tensor>>
        }
    }

    RCNNParse(rcnnResults: Array<Record<string, Tensor>>): SubtitleInfo[] {
        let subtitleInfo: SubtitleInfo | undefined
        const subtitleInfos: SubtitleInfo[] = []
        for (const i of rcnnResults.keys()) {
            if (rcnnResults[i].boxes.cpu().toObject().shape[0] !== 0) {
                const boxObjectTensor = rcnnResults[i].boxes.cpu().toObject()
                subtitleInfo = new SubtitleInfo(i, i + 1)
                subtitleInfo.box = new Int32Array(4)
                subtitleInfo.box[0] = lodash.toInteger(boxObjectTensor.data[0]) - 10
                subtitleInfo.box[1] = lodash.toInteger(boxObjectTensor.data[1]) - 10
                subtitleInfo.box[2] = lodash.toInteger(boxObjectTensor.data[2]) + 10
                subtitleInfo.box[3] = lodash.toInteger(boxObjectTensor.data[3]) + 10
                subtitleInfos.push(subtitleInfo)
            }
        }

        return subtitleInfos
    }

    SubtitleInfoToTensor(subtitleInfos: SubtitleInfo[]): Tensor {
        const boxesObjectTensor = { data: new Int32Array(subtitleInfos.length * 5), shape: [subtitleInfos.length, 5] }
        for (const i of subtitleInfos.keys()) {
            const box = subtitleInfos[i].box
            if (box !== undefined) {
                boxesObjectTensor.data[i * 5 + 0] = box[0]
                boxesObjectTensor.data[i * 5 + 1] = box[1]
                boxesObjectTensor.data[i * 5 + 2] = box[2]
                boxesObjectTensor.data[i * 5 + 3] = box[3]
                boxesObjectTensor.data[i * 5 + 4] = subtitleInfos[i].startFrame
            }
        }
        return Tensor.fromObject(boxesObjectTensor)
    }

    async OCRForward(input: Tensor, boxes: Tensor): Promise<Array<Array<number>>> {
        if (this.ocrModule === undefined) {
            throw new Error('OCR Module is not initialized')
        }

        if (ScriptModule.isCudaAvailable()) {
            const inputCUDA = input.cuda()
            const result = await this.ocrModule.forward(inputCUDA, boxes) as Array<Array<number>>
            inputCUDA.free()
            return result
        } else {
            return await this.ocrModule.forward(input, boxes) as Array<Array<number>>
        }
    }

    OCRParse(OCRResults: Array<Array<number>>): Array<string> {
        return OCRResults.map(t => t.map(d => {
            if (this.ocrChars === undefined) {
                throw new Error('OCR Module is not initialized')
            }
            return this.ocrChars[d]
        }).join('').trim())
    }
}

export default TorchOCR
