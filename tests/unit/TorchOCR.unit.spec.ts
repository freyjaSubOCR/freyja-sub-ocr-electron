import TorchOCR from '@/backends/TorchOCR'

describe('TorchOCR.ts', () => {
    it('Init RCNN Module', () => {
        const torchOCR = new TorchOCR()
        torchOCR.InitRCNN()
        expect(torchOCR).toBeDefined()
    })
    it('Init OCR Module', async () => {
        const torchOCR = new TorchOCR()
        await torchOCR.InitOCR()
        expect(torchOCR).toBeDefined()
    })
    it('Init VideoPlayer', async () => {
        const torchOCR = new TorchOCR()
        const result = await torchOCR.InitVideoPlayer('tests/files/sample.mp4')
        expect(result).toMatchSnapshot()
    })
    it('Render raw frame', async () => {
        const torchOCR = new TorchOCR()
        await torchOCR.InitVideoPlayer('tests/files/sample.mp4')
        const result = await torchOCR.ReadRawFrame(10)
        expect(result.length).toMatchSnapshot()
        // Total samples are too large, only record first 20 value
        expect(result.slice(0, 20)).toMatchSnapshot()
    }, 100000)
})
