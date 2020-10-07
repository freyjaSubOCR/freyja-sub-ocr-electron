import { ipcMain } from 'electron'
import logger from '@/logger'
import Config from '@/config'

class ConfigIpc {
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
        ipcMain.handle('Config:CheckPath', () => {
            try {
                return Config.checkPath()
            } catch (error) {
                logger.error((error as Error).message)
                return null
            }
        })
    }
}

export default ConfigIpc
