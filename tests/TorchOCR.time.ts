import TorchOCR from '@/backends/TorchOCR'
import { performance } from 'perf_hooks'
import { Tensor } from 'torch-js'

void (async () => {
    try {
        let tStart = performance.now()
        const torchOCR = new TorchOCR()
        await torchOCR.initOCR()
        await torchOCR.initVideoPlayer('D:/Projects/freyja-sub-ocr-electron/tests/files/sample.mp4')
        console.log(`Init torchOCR: ${(performance.now() - tStart)}ms`)

        const step = 20
        let tensorDataPromise = new Promise<Tensor | null>(resolve => resolve(null))
        let ocrPromise = new Promise<void | null>(resolve => resolve(null))
        const ocrPromiseBuffer = [ocrPromise, ocrPromise, ocrPromise, ocrPromise]
        const tLoop = performance.now()
        for (let frame = 0; frame < 800; frame += step) {
            tensorDataPromise = Promise.all([tensorDataPromise, ocrPromiseBuffer[0]]).then(async () => {
                tStart = performance.now()
                const rawImg: Array<Buffer> = []
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                for (const i of Array(step).keys()) {
                    const frame = await torchOCR.readRawFrame(undefined)
                    if (frame === null) {
                        continue
                    }
                    rawImg.push(frame)
                }
                const inputTensor = torchOCR.bufferToImgTensor(rawImg, 600)
                console.log(`Copy Tensor data (img) ${frame}: ${(performance.now() - tStart)}ms`)
                return inputTensor
            })

            ocrPromise = Promise.all([ocrPromise, tensorDataPromise]).then(async (values) => {
                const inputTensor = values[1]
                if (inputTensor === null) return null

                tStart = performance.now()
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const ocrResults = torchOCR.ocrParse(await torchOCR.ocrV3Forward(inputTensor))
                console.log(`Inferance OCR ${frame}: ${(performance.now() - tStart)}ms`)
                inputTensor.free()
            })
            void ocrPromiseBuffer.shift()
            ocrPromiseBuffer.push(ocrPromise)
        }
        await Promise.all([tensorDataPromise, ocrPromise])
        console.log(`\nTotal loop: ${(performance.now() - tLoop)}ms`)
    } catch (e) {
        console.log(e)
    }
})()
