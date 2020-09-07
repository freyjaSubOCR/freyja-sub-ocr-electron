import TorchOCR from '@/backends/TorchOCR'
import { performance } from 'perf_hooks'
import { Tensor } from 'torch-js'

(async () => {
    try {
        let tStart = performance.now()
        const torchOCR = new TorchOCR()
        torchOCR.InitRCNN()
        await torchOCR.InitOCR()
        await torchOCR.InitVideoPlayer('D:/Projects/freyja-sub-ocr-electron/tests/files/sample.mp4')
        console.log('Init torchOCR: ' + (performance.now() - tStart) + 'ms')

        const step = 20
        let tensorDataPromise = new Promise(resolve => resolve())
        let rcnnPromise = new Promise(resolve => resolve())
        let ocrPromise = new Promise(resolve => resolve())
        const ocrPromiseBuffer = [ocrPromise, ocrPromise, ocrPromise, ocrPromise]
        const tLoop = performance.now()
        for (let frame = 0; frame < 800; frame += step) {
            tensorDataPromise = Promise.all([tensorDataPromise, ocrPromiseBuffer[0]]).then(async () => {
                tStart = performance.now()
                const rawImg: Buffer[] = []
                for (const i of Array(step).keys()) {
                    rawImg.push(await torchOCR.ReadRawFrame(i + frame))
                }
                const inputTensor = torchOCR.BufferToImgTensor(rawImg, 600)
                console.log(`Copy Tensor data (img) ${frame}: ` + (performance.now() - tStart) + 'ms')
                return inputTensor
            })

            rcnnPromise = Promise.all([rcnnPromise, tensorDataPromise]).then(async (values) => {
                tStart = performance.now()
                const inputTensor = values[1] as Tensor
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const rcnnResults = await torchOCR.RCNNForward(inputTensor)
                console.log(`Inferance RCNN ${frame}: ` + (performance.now() - tStart) + 'ms')
                return rcnnResults
            })

            ocrPromise = Promise.all([ocrPromise, tensorDataPromise, rcnnPromise]).then(async (values) => {
                tStart = performance.now()
                const inputTensor = values[1] as Tensor
                const rcnnResults = values[2] as Record<string, Tensor>[]
                const subtitleInfos = torchOCR.RCNNParse(rcnnResults)
                const boxesObjectTensor = { data: new Int32Array(subtitleInfos.length * 4), shape: [subtitleInfos.length, 4] }
                for (const i of subtitleInfos.keys()) {
                    const box = subtitleInfos[i].box
                    if (box !== undefined) {
                        boxesObjectTensor.data[i * 4 + 0] = box[0]
                        boxesObjectTensor.data[i * 4 + 1] = box[1]
                        boxesObjectTensor.data[i * 4 + 2] = box[2]
                        boxesObjectTensor.data[i * 4 + 3] = box[3]
                    }
                }
                const boxesTensor = Tensor.fromObject(boxesObjectTensor)
                console.log(`Copy Tensor data (box) ${frame}: ` + (performance.now() - tStart) + 'ms')

                tStart = performance.now()
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const ocrResults = torchOCR.OCRParse(await torchOCR.OCRForward(inputTensor, boxesTensor))
                console.log(`Inferance OCR ${frame}: ` + (performance.now() - tStart) + 'ms')
                inputTensor.free()
                boxesTensor.free()
            })
            ocrPromiseBuffer.shift()
            ocrPromiseBuffer.push(ocrPromise)
        }
        await Promise.all([tensorDataPromise, rcnnPromise, ocrPromise])
        console.log('\nTotal loop: ' + (performance.now() - tLoop) + 'ms')
    } catch (e) {
        console.log(e)
    }
})()
