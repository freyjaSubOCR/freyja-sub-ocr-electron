class Config {
    static cachedFrames = 500
    static RCNNModulePath = 'D:\\Projects\\freyja-sub-ocr\\models\\object_detection.torchscript'
    static OCRModulePath = 'D:\\Projects\\freyja-sub-ocr\\models\\ocr_SC3500Chars_yuan.torchscript'
    static OCRCharsPath = 'D:\\Projects\\freyja-sub-ocr\\models\\ocr_SC3500Chars.txt'
    static EnableCuda = true
    static BatchSize = 20
}

export default Config
