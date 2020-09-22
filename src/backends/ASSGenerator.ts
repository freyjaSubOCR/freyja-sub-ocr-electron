import { ipcMain } from 'electron'
import { ASSStyle } from '@/interfaces'
import { ISubtitleInfo, SubtitleInfo } from '@/SubtitleInfo'
import { VideoProperties } from '@/VideoProperties'
import logger from '@/logger'
import fs_ from 'fs'
const fs = fs_.promises

class ASSGenerator {
    private _style = new ASSStyle()

    registerIPCListener(): void {
        ipcMain.handle('ASSGenerator:Generate', (e, ...args) => {
            try {
                const subtitleInfos = (args[0] as Array<ISubtitleInfo>).map(t => new SubtitleInfo(t))
                return this.generate(subtitleInfos, args[1])
            } catch (error) {
                logger.error((error as Error).message)
                return null
            }
        })
        ipcMain.handle('ASSGenerator:GenerateAndSave', async (e, ...args) => {
            try {
                const subtitleInfos = (args[0] as Array<ISubtitleInfo>).map(t => new SubtitleInfo(t))
                return await this.generateAndSave(subtitleInfos, args[1], args[2])
            } catch (error) {
                logger.error((error as Error).message)
                return null
            }
        })
    }

    generate(subtitleInfos: Array<SubtitleInfo>, videoProperties: VideoProperties): string {
        const strings: Array<string> = []
        strings.push('[Script Info]')
        strings.push('ScriptType: v4.00+')
        strings.push(`PlayResX: ${videoProperties.width}`)
        strings.push(`PlayResY: ${videoProperties.height}`)
        strings.push('[V4+ Styles]')
        strings.push('Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding')
        strings.push(`Style: ${this._style.name},${this._style.fontname},${this._style.fontsize},${this._style.primaryColour},${this._style.secondaryColour},${this._style.outlineColour},${this._style.backColour},${this._style.bold ? -1 : 0},${this._style.italic ? -1 : 0},${this._style.underline ? -1 : 0},${this._style.strikeOut ? -1 : 0},${this._style.scaleX},${this._style.scaleY},${this._style.spacing},${this._style.angle},${this._style.borderStyle},${this._style.outline},${this._style.shadow},${this._style.alignment},${this._style.marginL},${this._style.marginR},${this._style.marginV},${this._style.encoding}`)

        strings.push('[Events]')
        strings.push('Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text')
        for (const subtitleInfo of subtitleInfos) {
            strings.push(`Dialogue: 0,${subtitleInfo.startTime ?? ''},${subtitleInfo.endTime ?? ''},Default,,0,0,0,,${subtitleInfo.text ?? ''}`)
        }
        return strings.join('\n')
    }

    async generateAndSave(subtitleInfos: Array<SubtitleInfo>, videoProperties: VideoProperties, path: string): Promise<void> {
        const ass = this.generate(subtitleInfos, videoProperties)
        await fs.writeFile(path, ass, { encoding: 'utf-8' })
    }

    applyStyle(style: ASSStyle): void {
        this._style = style
    }
}

export default ASSGenerator
