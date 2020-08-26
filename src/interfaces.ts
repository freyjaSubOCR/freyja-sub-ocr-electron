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
}

export { RectPos, RenderedVideo, VideoProperties }
