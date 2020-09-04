import TorchOCR from '@/backends/TorchOCR'
import { performance } from 'perf_hooks'
import { Tensor } from 'torch-js'
import lodash from 'lodash'

(async () => {
    try {
        let tStart = performance.now()
        const torchOCR = new TorchOCR()
        torchOCR.InitRCNN()
        await torchOCR.InitOCR()
        await torchOCR.InitVideoPlayer('D:/Projects/freyja-sub-ocr-electron/tests/files/sample.mp4')
        console.log('Init torchOCR: ' + (performance.now() - tStart) + 'ms')

        const tLoop = performance.now()
        const step = 20
        for (let frame = 0; frame < 800; frame += step) {
            tStart = performance.now()
            const rawImg: Buffer[] = []
            for (const i of Array(step).keys()) {
                rawImg.push(await torchOCR.ReadRawFrame(i + frame))
            }
            const inputTensor = torchOCR.BufferToImgTensor(rawImg, 600)
            console.log('Copy Tensor data: ' + (performance.now() - tStart) + 'ms')

            tStart = performance.now()
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const rcnnResults = torchOCR.RCNNForward(inputTensor)
            console.log('Inferance RCNN: ' + (performance.now() - tStart) + 'ms')

            tStart = performance.now()
            const resultTensor = rcnnResults.map(rcnnResult => (rcnnResult.boxes as Tensor).cpu().toObject())
                .filter(t => t.shape.length === 2 && t.shape[0] > 0)
            const boxesObjectTensor = { data: new Int32Array(resultTensor.length * 4), shape: [resultTensor.length, 4] }
            for (const i of resultTensor.keys()) {
                boxesObjectTensor.data[i * 4 + 0] = lodash.toInteger(resultTensor[i].data[0]) - 10
                boxesObjectTensor.data[i * 4 + 1] = lodash.toInteger(resultTensor[i].data[1]) - 10
                boxesObjectTensor.data[i * 4 + 2] = lodash.toInteger(resultTensor[i].data[2]) + 10
                boxesObjectTensor.data[i * 4 + 3] = lodash.toInteger(resultTensor[i].data[3]) + 10
            }
            const boxesTensor = Tensor.fromObject(boxesObjectTensor)
            console.log('Copy Tensor data: ' + (performance.now() - tStart) + 'ms')

            tStart = performance.now()
            console.log(torchOCR.OCRParse(torchOCR.OCRForward(inputTensor, boxesTensor)))
            console.log('Inferance OCR: ' + (performance.now() - tStart) + 'ms')
        }

        console.log('\nTotal loop: ' + (performance.now() - tLoop) + 'ms')
    } catch (e) {
        console.log(e)
    }
})()
