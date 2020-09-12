import ASSGenerator from '@/backends/ASSGenerator'
import { ASSStyle } from '@/interfaces'
import { ISubtitleInfo, SubtitleInfo } from '@/SubtitleInfo'
import { VideoProperties } from '@/VideoProperties'
import fs_ from 'fs'
const fs = fs_.promises

describe('ASSGenerator.ts', () => {
    it('generate test', async () => {
        const ass = new ASSGenerator()
        ass.ApplyStyle(new ASSStyle())
        const subtitleInfos: SubtitleInfo[] = JSON.parse(await fs.readFile('tests/files/subtitleInfos.json', { encoding: 'utf-8' }))
            .map((element: ISubtitleInfo) => new SubtitleInfo(element))
        const assContent = ass.Generate(subtitleInfos, new VideoProperties(0, [], [], 1920, 1080))
        expect(assContent).toMatchSnapshot()
    }, 100000)
})
