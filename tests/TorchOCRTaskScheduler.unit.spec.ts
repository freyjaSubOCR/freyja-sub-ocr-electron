import TorchOCRTaskScheduler from '@/backends/TorchOCRTaskScheduler'

describe('TorchOCRTaskScheduler.ts', () => {
    it('task test', async () => {
        const task = new TorchOCRTaskScheduler()
        await task.Init('tests/files/sample.mp4')
        let result = await task.Start()
        expect(result).toMatchSnapshot()
        result = task.CleanUpSubtitleInfos()
        expect(result).toMatchSnapshot()
    }, 100000)
})
