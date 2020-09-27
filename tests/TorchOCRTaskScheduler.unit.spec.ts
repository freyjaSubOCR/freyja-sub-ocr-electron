import TorchOCRTaskScheduler from '@/backends/TorchOCRTaskScheduler'
import Config from '@/config'

describe('TorchOCRTaskScheduler.ts', () => {
    it('task test', async () => {
        Config.rcnnModulePath = 'D:\\Projects\\freyja-sub-ocr\\models\\object_detection.torchscript'
        Config.ocrModulePath_ = 'D:\\Projects\\freyja-sub-ocr\\models\\ocr_SC3500Chars_yuan.torchscript'
        Config.ocrCharsPath_ = 'D:\\Projects\\freyja-sub-ocr\\models\\ocr_SC3500Chars.txt'

        const task = new TorchOCRTaskScheduler()
        await task.init('tests/files/sample.mp4')
        let result = await task.start()
        expect(result.length).toBeGreaterThan(0)
        result = task.cleanUpSubtitleInfos()
        expect(result.length).toBeGreaterThan(0)
    }, 100000)
})
