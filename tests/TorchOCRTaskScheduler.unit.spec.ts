import TorchOCRWorker from '@/backends/TorchOCRWorker'
import Config from '@/config'

describe('TorchOCRTaskScheduler.ts', () => {
    it('task test', async () => {
        Config.cropTop = 970
        Config.cropBottom = 30

        const worker = new TorchOCRWorker()
        await worker.init('tests/files/sample.mp4')
        let result = await worker.start()
        expect(result.length).toBeGreaterThan(0)
        result = worker.cleanUpSubtitleInfos()
        expect(result.length).toBeGreaterThan(0)
        const noIdResult = result.map(t => {
            return {
                text: t.text,
                startFrame: t.startFrame,
                endFrame: t.endFrame
            }
        })
        expect(noIdResult).toMatchSnapshot()
    }, 100000)
})
