import TorchOCR from '@/backends/TorchOCR'

describe('TorchOCR.ts', () => {
    it('Intergration test', async () => {
        const torchOCR = new TorchOCR()
        torchOCR.initRCNN()
        await torchOCR.initOCR()
        await torchOCR.initVideoPlayer('tests/files/sample.mp4')
        const rawImg = await torchOCR.readRawFrame(10)
        expect(rawImg).not.toBeNull()
        const inputTensor = torchOCR.bufferToImgTensor([rawImg as Buffer])
        const rcnnResult = await torchOCR.rcnnForward(inputTensor)
        const resultTensor = (rcnnResult[0].boxes).cpu()
        const resultObjectTensor = resultTensor.toObject()
        expect(resultObjectTensor).toMatchSnapshot()

        const subtitleInfos = torchOCR.rcnnParse(rcnnResult)
        expect(subtitleInfos).toMatchSnapshot()

        const boxesTensor = torchOCR.subtitleInfoToTensor(subtitleInfos)
        const result = torchOCR.ocrParse(await torchOCR.ocrForward(inputTensor, boxesTensor))
        expect(result).toMatchSnapshot()
        inputTensor.free()
        boxesTensor.free()
    }, 100000)
})
