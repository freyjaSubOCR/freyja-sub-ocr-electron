import TorchOCRTaskScheduler from '@/backends/TorchOCRTaskScheduler'

describe('TorchOCRTaskScheduler.ts', () => {
    it('Intergration test', async () => {
        const task = new TorchOCRTaskScheduler()
        await task.Init('tests/files/sample.mp4')
        const result = await task.Start()
        expect(result).toMatchSnapshot()
    }, 100000)
})
