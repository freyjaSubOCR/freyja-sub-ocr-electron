import TorchOCRTaskScheduler from '@/backends/TorchOCRWorker'

describe('TorchOCRTaskScheduler.ts', () => {
    it('task test', async () => {
        const task = new TorchOCRTaskScheduler()
        await task.init('tests/files/sample.mp4')
        let result = await task.start()
        expect(result.length).toBeGreaterThan(0)
        result = task.cleanUpSubtitleInfos()
        expect(result.length).toBeGreaterThan(0)
    }, 100000)
})
