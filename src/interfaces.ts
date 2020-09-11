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

export { RectPos, RenderedVideo, ASSStyle }
