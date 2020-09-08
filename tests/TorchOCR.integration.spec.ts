import TorchOCR from '@/backends/TorchOCR'
import { Tensor } from 'torch-js'

describe('TorchOCR.ts', () => {
    it('Intergration test', async () => {
        const torchOCR = new TorchOCR()
        torchOCR.InitRCNN()
        await torchOCR.InitOCR()
        await torchOCR.InitVideoPlayer('tests/files/sample.mp4')
        const rawImg = await torchOCR.ReadRawFrame(10)
        const inputTensor = torchOCR.BufferToImgTensor([rawImg])
        const rcnnResult = await torchOCR.RCNNForward(inputTensor)
        const resultTensor = (rcnnResult[0].boxes as Tensor).cpu()
        const resultObjectTensor = resultTensor.toObject()
        expect(resultObjectTensor).toMatchSnapshot()

        const subtitleInfos = torchOCR.RCNNParse(rcnnResult)
        const boxesTensor = torchOCR.SubtitleInfoToTensor(subtitleInfos)
        const result = torchOCR.OCRParse(await torchOCR.OCRForward(inputTensor, boxesTensor))
        expect(result).toMatchSnapshot()
        inputTensor.free()
        boxesTensor.free()
    }, 100000)
})
