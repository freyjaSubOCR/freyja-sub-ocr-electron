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
                console.log(`Copy Tensor data (box) ${frame}: ` + (performance.now() - tStart) + 'ms')

                tStart = performance.now()
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const ocrResults = torchOCR.OCRParse(await torchOCR.OCRForward(inputTensor, boxesTensor))
                console.log(`Inferance OCR ${frame}: ` + (performance.now() - tStart) + 'ms')
                inputTensor.free()
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

/*
(async () => {
    function sleep(time: number) {
        return new Promise((resolve) => setTimeout(resolve, time))
    }
    async function a(loopCount: number) {
        await sleep(2000)
        console.log(`function a: ${loopCount}`)
    }
    async function b(loopCount: number) {
        await sleep(3000)
        console.log(`function b: ${loopCount}`)
    }

    let aPromise = a(0)
    let bPromise = new Promise((resolve) => resolve())
    for (const i of Array(10).keys()) {
        const bPromiseTemp = bPromise
        bPromise = Promise.all([aPromise, bPromise]).then(() => b(i))
        aPromise = Promise.all([aPromise, bPromiseTemp]).then(() => a(i + 1))
    }
    await Promise.all([aPromise, bPromise])
})()

*/
