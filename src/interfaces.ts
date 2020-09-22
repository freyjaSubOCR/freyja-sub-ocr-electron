interface RectPos {
    top: number
    left: number
    bottom: number
    right: number
}

interface RenderedVideo {
    timestamp: number
    keyFrame: boolean
    data: Buffer | Array<Buffer>
}

class ASSStyle {
    name = 'Default'
    fontname = '方正准圆_GBK'
    fontsize = '75'
    primaryColour = '&H00FFFFFF'
    secondaryColour = '&HF0000000'
    outlineColour = '&H00193768'
    backColour = '&HF0000000'
    bold = false
    italic = false
    underline = false
    strikeOut = false
    scaleX = 100
    scaleY = 100
    spacing = 0
    angle = 0
    borderStyle = 1
    outline = 2
    shadow = 0
    alignment = 2
    marginL = 10
    marginR = 10
    marginV = 15
    encoding = 1
}

export { RectPos, RenderedVideo, ASSStyle }
