import TorchOCR from '@/backends/TorchOCR'
import { Tensor, ObjectTensor } from 'torch-js'
import lodash from 'lodash'

describe('TorchOCR.ts', () => {
    it('Intergration test', async () => {
        const torchOCR = new TorchOCR()
        torchOCR.InitRCNN()
        await torchOCR.InitOCR()
        await torchOCR.InitVideoPlayer('tests/files/sample.mp4')
        const rawImg = await torchOCR.ReadRawFrame(10)
        const inputTensor = torchOCR.BufferToImgTensor([rawImg])
        const rcnnResult = torchOCR.RCNNForward(inputTensor)
        const resultTensor = ((await rcnnResult)[0].boxes as Tensor).cpu()
        const resultObjectTensor = resultTensor.toObject()
        expect(resultObjectTensor).toMatchSnapshot()

        const boxesObjectTensor = { data: new Int32Array(4), shape: [1, 4] } as ObjectTensor
        boxesObjectTensor.data[0] = lodash.toInteger(resultObjectTensor.data[0]) - 10
        boxesObjectTensor.data[1] = lodash.toInteger(resultObjectTensor.data[1]) - 10
        boxesObjectTensor.data[2] = lodash.toInteger(resultObjectTensor.data[2]) + 10
        boxesObjectTensor.data[3] = lodash.toInteger(resultObjectTensor.data[3]) + 10
        const boxesTensor = Tensor.fromObject(boxesObjectTensor)
        const result = torchOCR.OCRParse(await torchOCR.OCRForward(inputTensor, boxesTensor))
        expect(result).toMatchSnapshot()
    }, 100000)
})
