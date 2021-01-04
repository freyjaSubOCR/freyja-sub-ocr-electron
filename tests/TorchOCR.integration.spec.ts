import TorchOCR from '@/backends/TorchOCR'

describe('TorchOCR.ts', () => {
    it('Intergration test', async () => {
        const torchOCR = new TorchOCR()
        await torchOCR.initOCR()
        await torchOCR.initVideoPlayer('tests/files/sample.mp4')
        const rawImg = await torchOCR.readRawFrame(10)
        expect(rawImg).not.toBeNull()
        const inputTensor = torchOCR.bufferToImgTensor([rawImg as Buffer], 970, 30)

        const result = torchOCR.ocrParse(await torchOCR.ocrV3Forward(inputTensor))
        expect(result).toMatchSnapshot()
        inputTensor.free()
    }, 100000)
})
