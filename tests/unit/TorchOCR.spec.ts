import TorchOCR from '@/backends/TorchOCR'

describe('TorchOCR.ts', () => {
    const torchOCR = new TorchOCR()
    it('Init RCNN Module', () => {
        // torchOCR.InitRCNN()
        expect(torchOCR).toBeDefined()
    })
    it('Init OCR Module', async () => {
        await torchOCR.InitOCR()
        expect(torchOCR).toBeDefined()
    })
    it('Init VideoPlayer', async () => {
        const result = await torchOCR.InitVideoPlayer('tests/files/test.mp4')
        expect(result.timeBase[0]).toBe(1)
        expect(result.timeBase[1]).toBe(24000)
        expect(result.fps[0]).toBe(24000)
        expect(result.fps[1]).toBe(1001)
    })
})
