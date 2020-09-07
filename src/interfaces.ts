import { Tensor } from 'torch-js'

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

interface VideoProperties {
    duration: number;
    timeBase: number[];
    fps: number[];
    width: number;
    height: number;
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
