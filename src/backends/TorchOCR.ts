import { ScriptModule, ObjectTensor, Tensor } from 'torch-js'
import Config from '@/config'
import fs_ from 'fs'
import RawVideoPlayer from './RawVideoPlayer'
import { SubtitleInfo } from '@/SubtitleInfo'
import { VideoProperties } from '@/VideoProperties'
import lodash from 'lodash'
import { RenderedVideo } from '@/interfaces'

const fs = fs_.promises

class TorchOCR {
    private _rcnnModule: ScriptModule | undefined
    private _ocrModule: ScriptModule | undefined
    private _ocrChars: string | undefined
    private _videoPlayer: RawVideoPlayer | undefined
    private _videoProperties: VideoProperties | undefined

    public get videoProperties(): VideoProperties | undefined {
        return this._videoProperties
    }

    public get videoPlayer(): RawVideoPlayer | undefined {
        return this._videoPlayer
    }

    initRCNN(path: string | null = null): void {
        if (path == null) { path = Config.rcnnModulePath }
        this._rcnnModule = new ScriptModule(path)
        if (Config.enableCuda && ScriptModule.isCudaAvailable()) { this._rcnnModule = this._rcnnModule.cuda() }
    }

    async initOCR(modulePath: string | null = null, charsPath: string | null = null): Promise<void> {
        if (modulePath == null) { modulePath = Config.ocrModulePath }
        if (charsPath == null) { charsPath = Config.ocrCharsPath }
        this._ocrModule = new ScriptModule(modulePath)
        this._ocrChars = await fs.readFile(charsPath, { encoding: 'utf-8' })
        if (Config.enableCuda && ScriptModule.isCudaAvailable()) { this._ocrModule = this._ocrModule.cuda() }
    }

    async initVideoPlayer(path: string): Promise<VideoProperties> {
        this._videoPlayer = new RawVideoPlayer()
        this._videoProperties = await this._videoPlayer.openVideo(path)
        return this.videoProperties as VideoProperties
    }

    async readRawFrame(frame: number | undefined): Promise<Buffer | null> {
        if (this.videoPlayer === undefined || this.videoProperties === undefined) {
            throw new Error('VideoPlayer is not initialized')
        }
        const unitFrame = this.videoProperties.timeBase[1] *
                this.videoProperties.fps[1] /
                this.videoProperties.timeBase[0] /
                this.videoProperties.fps[0]
        let rawFrame: RenderedVideo
        if (frame === undefined) {
            const rawFrameNullable = await this.videoPlayer.renderImageSeq()
            if (rawFrameNullable === null) {
                return null
            } else {
                rawFrame = rawFrameNullable
            }
        } else {
            const timestamp = lodash.toInteger(frame * unitFrame)
            rawFrame = await this.videoPlayer.renderImage(timestamp)
        }
        let rawData = rawFrame.data[0] as Buffer
        rawData = rawData.slice(0, 3 * this.videoProperties.height * this.videoProperties.width)
        return rawData
    }

    bufferToImgTensor(buffers: Array<Buffer>, cropTop = 0, cropBottom = 0): Tensor {
        if (this.videoProperties === undefined) {
            throw new Error('VideoPlayer is not initialized')
        }
        if (cropTop < 0) cropTop = 0
        cropTop = lodash.toInteger(cropTop)
        if (cropBottom < 0) cropBottom = 0
        cropBottom = lodash.toInteger(cropBottom)

        const oneImgLength = 3 * (this.videoProperties.height - cropTop - cropBottom) * this.videoProperties.width
        const imgObjTensor = {
            data: new Float32Array(buffers.length * oneImgLength),
            shape: [buffers.length, this.videoProperties.height - cropTop - cropBottom, this.videoProperties.width, 3]
        } as ObjectTensor

        for (let j = 0; j < buffers.length; j++) {
            const buffer = buffers[j]
            if (buffer.length !== 3 * this.videoProperties.height * this.videoProperties.width) {
                throw new Error(`Buffer length mismatch. Should be ${3 * this.videoProperties.height * this.videoProperties.width}, got ${buffer.length}`)
            }
            imgObjTensor.data.set(buffer.slice(cropTop * this.videoProperties.width * 3, buffer.length - cropBottom * this.videoProperties.width * 3), j * oneImgLength)
        }
        return Tensor.fromObject(imgObjTensor)
    }

    async rcnnForward(input: Tensor): Promise<Array<Record<string, Tensor>>> {
        if (this._rcnnModule === undefined) {
            throw new Error('RCNN Module is not initialized')
        }
        if (Config.enableCuda && ScriptModule.isCudaAvailable()) {
            const inputCUDA = input.cuda()
            const result = await this._rcnnModule.forward(inputCUDA) as Array<Record<string, Tensor>>
            inputCUDA.free()
            return result
        } else {
            const result = await this._rcnnModule.forward(input) as Array<Record<string, Tensor>>
            return result
        }
    }

    rcnnParse(rcnnResults: Array<Record<string, Tensor>>): Array<SubtitleInfo> {
        let subtitleInfo: SubtitleInfo | undefined
        const subtitleInfos: Array<SubtitleInfo> = []
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

    subtitleInfoToTensor(subtitleInfos: Array<SubtitleInfo>): Tensor {
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

    async ocrForward(input: Tensor, boxes: Tensor): Promise<Array<Array<number>>> {
        if (this._ocrModule === undefined) {
            throw new Error('OCR Module is not initialized')
        }

        if (Config.enableCuda && ScriptModule.isCudaAvailable()) {
            const inputCUDA = input.cuda()
            const result = await this._ocrModule.forward(inputCUDA, boxes) as Array<Array<number>>
            inputCUDA.free()
            return result
        } else {
            return await this._ocrModule.forward(input, boxes) as Array<Array<number>>
        }
    }

    ocrParse(ocrResults: Array<Array<number>>): Array<string> {
        return ocrResults.map(t => t.map(d => {
            if (this._ocrChars === undefined) {
                throw new Error('OCR Module is not initialized')
            }
            return this._ocrChars[d]
        }).join('').trim())
    }
}

export default TorchOCR
