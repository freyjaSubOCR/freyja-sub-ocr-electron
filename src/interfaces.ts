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
    duration: number;
    timeBase: number[];
    fps: number[];
    width: number;
    height: number;

    constructor(duration: number, timeBase: number[], fps: number[], width: number, height: number) {
        this.duration = duration
        this.timeBase = timeBase
        this.fps = fps
        this.width = width
        this.height = height
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

interface SubtitleInfo {
    startFrame: number;
    endFrame: number;
    text?: string;
    startTime?: string;
    endTime?: string;
    imageTensor?: Int32Array;
}

export { RectPos, RenderedVideo, VideoProperties, SubtitleInfo }
