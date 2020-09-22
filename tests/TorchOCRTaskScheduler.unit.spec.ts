import TorchOCRTaskScheduler from '@/backends/TorchOCRTaskScheduler'

describe('TorchOCRTaskScheduler.ts', () => {
    it('task test', async () => {
        const task = new TorchOCRTaskScheduler()
        await task.init('tests/files/sample.mp4')
        let result = await task.start()
        expect(result).toMatchSnapshot()
        result = task.cleanUpSubtitleInfos()
        expect(result).toMatchSnapshot()
    }, 100000)
})
