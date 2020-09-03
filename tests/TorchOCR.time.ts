import TorchOCR from '@/backends/TorchOCR'
import { performance } from 'perf_hooks'

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
            console.log('Init Tensor data: ' + (performance.now() - tStart) + 'ms')

            tStart = performance.now()
            const inputTensor = torchOCR.BufferToImgTensor(rawImg, 600)
            console.log('Copy Tensor data: ' + (performance.now() - tStart) + 'ms')

            tStart = performance.now()
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const rcnnResults = torchOCR.RCNNForward(inputTensor)
            console.log('Inferance: ' + (performance.now() - tStart) + 'ms')
            inputTensor.free()
        }

        console.log('\nTotal loop: ' + (performance.now() - tLoop) + 'ms')
    } catch (e) {
        console.log(e)
    }
})()
