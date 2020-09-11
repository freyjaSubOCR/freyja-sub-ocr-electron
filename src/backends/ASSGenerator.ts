import { ipcMain } from 'electron'
import { ASSStyle } from '@/interfaces'
import { SubtitleInfo } from '@/SubtitleInfo'
import { VideoProperties } from '@/VideoProperties'
import logger from '@/logger'

class ASSGenerator {
    private style = new ASSStyle()

    registerIPCListener(): void {
        ipcMain.handle('ASSGenerator:Generate', async (e, ...args) => {
            try {
                return this.Generate(args[0], args[1])
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

    ApplyStyle(style: ASSStyle) {
        this.style = style
    }
}

export default ASSGenerator
