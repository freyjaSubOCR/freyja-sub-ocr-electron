class Config {
    static cachedFrames = 1000
    static rcnnModulePath = 'D:\\Projects\\freyja-sub-ocr\\models\\object_detection.torchscript'
    static ocrModulePath = 'D:\\Projects\\freyja-sub-ocr\\models\\ocr_TC3600Chars_hei.torchscript'
    static ocrCharsPath = 'D:\\Projects\\freyja-sub-ocr\\models\\ocr_TC3600Chars.txt'
    static enableCuda = true
    static batchSize = 20
    static cropTop = 20
    static cropBottom = 20
}

export default Config
