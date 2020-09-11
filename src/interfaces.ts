import { isNumber } from 'lodash'
import { v4 as uuidv4 } from 'uuid'

interface RectPos {
    top: number;
    left: number;
    bottom: number;
    right: number;
}

interface RenderedVideo {
    timestamp: number;
    data: Buffer | Buffer[];
}

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
interface IVideoProperties {
    duration: number;
    timeBase: number[];
    fps: number[];
    width: number;
    height: number;
}

class VideoProperties implements IVideoProperties {
    duration: number
    timeBase: number[]
    fps: number[]
    width: number
    height: number

    constructor(videoProperties: IVideoProperties)

    constructor(duration: number, timeBase?: number[], fps?: number[], width?: number, height?: number)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(duration: any, timeBase?: number[], fps?: number[], width?: number, height?: number) {
        if (isNumber(duration)) {
            if (duration === undefined || timeBase === undefined || fps === undefined || width === undefined || height === undefined) {
                throw new Error('Cannot init class from the provided parameters')
            }
            this.duration = duration
            this.timeBase = timeBase
            this.fps = fps
            this.width = width
            this.height = height
        } else {
            const videoProperties = duration as IVideoProperties
            this.duration = videoProperties.duration
            this.timeBase = videoProperties.timeBase
            this.fps = videoProperties.fps
            this.width = videoProperties.width
            this.height = videoProperties.height
        }
    }

    get unitFrame(): number {
        return this.timeBase[1] *
                this.fps[1] /
                this.timeBase[0] /
                this.fps[0]
    }

    get lastFrame(): number {
        return Math.floor(this.duration / this.unitFrame) - 1
    }
}

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
interface ISubtitleInfo {
    startFrame: number;
    endFrame: number;
    texts?: string[];
    startTime?: string;
    endTime?: string;
    box?: Int32Array;
}

class SubtitleInfo implements ISubtitleInfo {
    startFrame: number
    endFrame: number
    texts: string[] = []
    startTime?: string
    endTime?: string
    box?: Int32Array
    id: string

    constructor(subtitleInfo: ISubtitleInfo)

    constructor(startFrame: number, endFrame?: number)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(startFrame: any, endFrame?: number) {
        this.id = uuidv4()
        if (isNumber(startFrame)) {
            if (startFrame === undefined || endFrame === undefined) {
                throw new Error('Cannot init class from the provided parameters')
            }
            this.startFrame = startFrame
            this.endFrame = endFrame
        } else {
            const subtitleInfo = startFrame as ISubtitleInfo
            this.startFrame = subtitleInfo.startFrame
            this.endFrame = subtitleInfo.endFrame
            this.texts = subtitleInfo.texts === undefined ? [] : subtitleInfo.texts
            this.startTime = subtitleInfo.startTime
            this.endTime = subtitleInfo.endTime
            this.box = subtitleInfo.box
        }
    }

    get text(): string | undefined {
        const freq = {} as Record<string, number>
        let maxFreq = 0
        let maxFreqText = ''
        if (this.texts === undefined || this.texts.length === 0) {
            return undefined
        }
        for (const text of this.texts) {
            freq[text] = text in freq ? freq[text] + 1 : 1
            if (freq[text] > maxFreq) {
                maxFreq = freq[text]
                maxFreqText = text
            }
        }
        return maxFreqText
    }

    set text(value) {
        if (value !== undefined) {
            this.texts = [value]
        }
    }

    GenerateTime(fps: number) {
        let timeInt = Math.floor(this.startFrame * 1000 / fps)
        let timeStruct = new Date(timeInt)
        this.startTime = `${timeStruct.getUTCHours().toString().padStart(2, '0')}:${timeStruct.getUTCMinutes().toString().padStart(2, '0')}:${timeStruct.getUTCSeconds().toString().padStart(2, '0')}.${Math.floor(timeStruct.getUTCMilliseconds() / 10).toString().padStart(2, '0')}`

        timeInt = Math.floor(this.endFrame * 1000 / fps)
        timeStruct = new Date(timeInt)
        this.endTime = `${timeStruct.getUTCHours().toString().padStart(2, '0')}:${timeStruct.getUTCMinutes().toString().padStart(2, '0')}:${timeStruct.getUTCSeconds().toString().padStart(2, '0')}.${Math.floor(timeStruct.getUTCMilliseconds() / 10).toString().padStart(2, '0')}`
    }

    get startTimeValidated() {
        return this.startTime
    }

    set startTimeValidated(value) {
        console.log('hit')
        if (value === undefined) {
            this.startTime = undefined
        } else if (value.match(/^\d{2}:[0-5]\d:[0-5]\d.\d{2}$/)) {
            this.startTime = value
        }
        console.log(this.startTimeValidated)
    }

    get endTimeValidated() {
        return this.endTime
    }

    set endTimeValidated(value) {
        if (value === undefined) {
            this.endTime = undefined
        } else if (value.match(/^\d{2}:[0-5]\d:[0-5]\d.\d{2}$/)) {
            this.endTime = value
        }
    }
}

class ASSStyle {
    Name = 'Default'
    Fontname = '方正准圆_GBK'
    Fontsize = '75'
    PrimaryColour = '&H00FFFFFF'
    SecondaryColour = '&HF0000000'
    OutlineColour = '&H00193768'
    BackColour = '&HF0000000'
    Bold = false
    Italic = false
    Underline = false
    StrikeOut = false
    ScaleX = 100
    ScaleY = 100
    Spacing = 0
    Angle = 0
    BorderStyle = 1
    Outline = 2
    Shadow = 0
    Alignment = 2
    MarginL = 10
    MarginR = 10
    MarginV = 15
    Encoding = 1
}

export { RectPos, RenderedVideo, IVideoProperties, VideoProperties, ISubtitleInfo, SubtitleInfo, ASSStyle }
