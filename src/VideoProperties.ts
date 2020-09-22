import { isNumber } from 'lodash'

interface IVideoProperties {
    duration: number
    timeBase: Array<number>
    fps: Array<number>
    width: number
    height: number
}

class VideoProperties implements IVideoProperties {
    duration: number
    timeBase: Array<number>
    fps: Array<number>
    width: number
    height: number

    constructor(videoProperties: IVideoProperties)

    constructor(duration: number, timeBase?: Array<number>, fps?: Array<number>, width?: number, height?: number)

    constructor(duration: number | IVideoProperties, timeBase?: Array<number>, fps?: Array<number>, width?: number, height?: number) {
        if (isNumber(duration)) {
            if (timeBase === undefined || fps === undefined || width === undefined || height === undefined) {
                throw new Error('Cannot init class from the provided parameters')
            }
            this.duration = duration
            this.timeBase = timeBase
            this.fps = fps
            this.width = width
            this.height = height
        } else {
            const videoProperties = duration
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
        return Math.floor(this.duration / this.unitFrame)
    }
}

export { IVideoProperties, VideoProperties }
