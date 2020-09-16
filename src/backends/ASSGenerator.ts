import { ipcMain } from 'electron'
import { ASSStyle } from '@/interfaces'
import { ISubtitleInfo, SubtitleInfo } from '@/SubtitleInfo'
import { VideoProperties } from '@/VideoProperties'
import logger from '@/logger'
import fs_ from 'fs'
const fs = fs_.promises

class ASSGenerator {
    private style = new ASSStyle()

    registerIPCListener(): void {
        ipcMain.handle('ASSGenerator:Generate', async (e, ...args) => {
            try {
                const subtitleInfos = (args[0] as ISubtitleInfo[]).map(t => new SubtitleInfo(t))
                return this.Generate(subtitleInfos, args[1])
            } catch (error) {
                logger.error(error.message)
                return null
            }
        })
        ipcMain.handle('ASSGenerator:GenerateAndSave', async (e, ...args) => {
            try {
                const subtitleInfos = (args[0] as ISubtitleInfo[]).map(t => new SubtitleInfo(t))
                return await this.GenerateAndSave(subtitleInfos, args[1], args[2])
            } catch (error) {
                logger.error(error.message)
                return null
            }
        })
    }

    Generate(subtitleInfos: SubtitleInfo[], videoProperties: VideoProperties): string {
        const strings: string[] = []
        strings.push('[Script Info]')
        strings.push('ScriptType: v4.00+')
        strings.push(`PlayResX: ${videoProperties.width}`)
        strings.push(`PlayResY: ${videoProperties.height}`)
        strings.push('[V4+ Styles]')
        strings.push('Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding')
        strings.push(`Style: ${this.style.Name},${this.style.Fontname},${this.style.Fontsize},${this.style.PrimaryColour},${this.style.SecondaryColour},${this.style.OutlineColour},${this.style.BackColour},${this.style.Bold ? -1 : 0},${this.style.Italic ? -1 : 0},${this.style.Underline ? -1 : 0},${this.style.StrikeOut ? -1 : 0},${this.style.ScaleX},${this.style.ScaleY},${this.style.Spacing},${this.style.Angle},${this.style.BorderStyle},${this.style.Outline},${this.style.Shadow},${this.style.Alignment},${this.style.MarginL},${this.style.MarginR},${this.style.MarginV},${this.style.Encoding}`)

        strings.push('[Events]')
        strings.push('Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text')
        for (const subtitleInfo of subtitleInfos) {
            strings.push(`Dialogue: 0,${subtitleInfo.startTime},${subtitleInfo.endTime},Default,,0,0,0,,${subtitleInfo.text}`)
        }
        return strings.join('\n')
    }

    async GenerateAndSave(subtitleInfos: SubtitleInfo[], videoProperties: VideoProperties, path: string) {
        const ass = this.Generate(subtitleInfos, videoProperties)
        await fs.writeFile(path, ass, { encoding: 'utf-8' })
    }

    ApplyStyle(style: ASSStyle) {
        this.style = style
    }
}

export default ASSGenerator
