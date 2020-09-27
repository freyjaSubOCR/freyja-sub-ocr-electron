class Config {
    static cachedFrames = 1000
    static rcnnModulePath = 'models/object_detection.torchscript'
    static ocrModulePath_ = ''
    static ocrCharsPath_ = ''
    static get ocrModulePath(): string {
        return this.ocrModulePath_ === '' ? `models/ocr_${this.language}_${this.font}.torchscript` : this.ocrModulePath_
    }
    static get ocrCharsPath(): string {
        return this.ocrCharsPath_ === '' ? `models/ocr_${this.language}.txt` : this.ocrCharsPath_
    }
    static enableCuda = true
    static batchSize = 20
    static cropTop = 20
    static cropBottom = 20
    // eslint-disable-next-line @typescript-eslint/naming-convention
    static languages: Record<string, string> = { 'Simplified Chinese': 'SC3500Chars', 'Traditional Chinese': 'TC3600Chars', 'All CJK Chars': 'CJKChars' }
    // eslint-disable-next-line @typescript-eslint/naming-convention
    static fonts: Record<string, string> = { '圆体': 'yuan', '黑体': 'hei' }
    static language = 'SC3500Chars'
    static font = 'yuan'
}

export default Config
