import path from 'path'
import logger from '@/logger'
import { ipcMain } from 'electron'

class Config {
    static registerIPCListener(): void {
        ipcMain.handle('Config:cachedFrames', (e, ...args) => {
            try {
                if (args.length === 1) {
                    Config.cachedFrames = args[0] as number
                }
                return Config.cachedFrames
            } catch (error) {
                logger.error((error as Error).message)
                return null
            }
        })
        ipcMain.handle('Config:enableCuda', (e, ...args) => {
            try {
                if (args.length === 1) {
                    Config.enableCuda = args[0] as boolean
                }
                return Config.enableCuda
            } catch (error) {
                logger.error((error as Error).message)
                return null
            }
        })
        ipcMain.handle('Config:batchSize', (e, ...args) => {
            try {
                if (args.length === 1) {
                    Config.batchSize = args[0] as number
                }
                return Config.batchSize
            } catch (error) {
                logger.error((error as Error).message)
                return null
            }
        })
        ipcMain.handle('Config:cropTop', (e, ...args) => {
            try {
                if (args.length === 1) {
                    Config.cropTop = args[0] as number
                }
                return Config.cropTop
            } catch (error) {
                logger.error((error as Error).message)
                return null
            }
        })
        ipcMain.handle('Config:cropBottom', (e, ...args) => {
            try {
                if (args.length === 1) {
                    Config.cropTop = args[0] as number
                }
                return Config.cropBottom
            } catch (error) {
                logger.error((error as Error).message)
                return null
            }
        })
        ipcMain.handle('Config:language', (e, ...args) => {
            try {
                if (args.length === 1) {
                    Config.language = args[0] as string
                }
                return Config.language
            } catch (error) {
                logger.error((error as Error).message)
                return null
            }
        })
        ipcMain.handle('Config:font', (e, ...args) => {
            try {
                if (args.length === 1) {
                    Config.font = args[0] as string
                }
                return Config.font
            } catch (error) {
                logger.error((error as Error).message)
                return null
            }
        })
        ipcMain.handle('Config:languages', (e, ...args) => {
            try {
                if (args.length === 1) {
                    Config.languages = args[0] as Record<string, string>
                }
                return Config.languages
            } catch (error) {
                logger.error((error as Error).message)
                return null
            }
        })
        ipcMain.handle('Config:fonts', (e, ...args) => {
            try {
                if (args.length === 1) {
                    Config.fonts = args[0] as Record<string, string>
                }
                return Config.fonts
            } catch (error) {
                logger.error((error as Error).message)
                return null
            }
        })
    }

    static cachedFrames = 200
    static rcnnModulePath = path.resolve(__dirname, 'models', 'object_detection.torchscript')
    static ocrModulePath_ = ''
    static ocrCharsPath_ = ''
    static get ocrModulePath(): string {
        return this.ocrModulePath_ === '' ? path.resolve(__dirname, 'models', `ocr_${this.language}_${this.font}.torchscript`) : this.ocrModulePath_
    }
    static get ocrCharsPath(): string {
        return this.ocrCharsPath_ === '' ? path.resolve(__dirname, 'models', `ocr_${this.language}.txt`) : this.ocrCharsPath_
    }
    static enableCuda = true
    static batchSize = 24
    static cropTop = 0
    static cropBottom = 0
    // eslint-disable-next-line @typescript-eslint/naming-convention
    static languages: Record<string, string> = { 'Simplified Chinese': 'SC3500Chars', 'Traditional Chinese': 'TC3600Chars', 'All CJK Chars': 'CJKChars' }
    // eslint-disable-next-line @typescript-eslint/naming-convention
    static fonts: Record<string, string> = { '圆体': 'yuan', '黑体': 'hei' }
    static language = 'SC3500Chars'
    static font = 'yuan'
}

export default Config
