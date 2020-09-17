import { dialog, BrowserWindow, ipcMain } from 'electron'
import logger from '@/logger'

class CommonIpc {
    registerIPCListener() {
        ipcMain.handle('CommonIpc:OpenMovieDialog', async () => {
            try {
                return await this.OpenMovieDialog()
            } catch (error) {
                logger.error(error.message)
                return null
            }
        })
        ipcMain.handle('CommonIpc:SaveASSDialog', async () => {
            try {
                return await this.SaveASSDialog()
            } catch (error) {
                logger.error(error.message)
                return null
            }
        })
        ipcMain.handle('CommonIpc:Minimize', () => {
            try {
                return this.Minimize()
            } catch (error) {
                logger.error(error.message)
                return null
            }
        })
        ipcMain.handle('CommonIpc:Unmaximize', () => {
            try {
                return this.Unmaximize()
            } catch (error) {
                logger.error(error.message)
                return null
            }
        })
        ipcMain.handle('CommonIpc:Maximize', () => {
            try {
                return this.Maximize()
            } catch (error) {
                logger.error(error.message)
                return null
            }
        })
        ipcMain.handle('CommonIpc:IsMaximized', () => {
            try {
                return this.IsMaximized()
            } catch (error) {
                logger.error(error.message)
                return null
            }
        })
        ipcMain.handle('CommonIpc:Close', () => {
            try {
                return this.Close()
            } catch (error) {
                logger.error(error.message)
                return null
            }
        })
    }

    async Minimize() {
        const browserWindow = BrowserWindow.getFocusedWindow()
        if (browserWindow !== null) {
            browserWindow.minimize()
        }
    }

    async Unmaximize() {
        const browserWindow = BrowserWindow.getFocusedWindow()
        if (browserWindow !== null) {
            browserWindow.unmaximize()
        }
    }

    async Maximize() {
        const browserWindow = BrowserWindow.getFocusedWindow()
        if (browserWindow !== null) {
            browserWindow.maximize()
        }
    }

    async IsMaximized() {
        const browserWindow = BrowserWindow.getFocusedWindow()
        if (browserWindow !== null) {
            return browserWindow.isMaximized()
        }
    }

    async Close() {
        const browserWindow = BrowserWindow.getFocusedWindow()
        if (browserWindow !== null) {
            browserWindow.close()
        }
    }

    async OpenMovieDialog() {
        const dialogResult = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow() as BrowserWindow, {
            filters: [
                { name: 'Movies', extensions: ['mkv', 'mp4', 'avi', 'flv', 'm2ts'] },
                { name: 'All Files', extensions: ['*'] }
            ],
            properties: ['openFile']
        })
        if (dialogResult.canceled) return null
        return dialogResult.filePaths[0]
    }

    async SaveASSDialog() {
        const dialogResult = await dialog.showSaveDialog(BrowserWindow.getFocusedWindow() as BrowserWindow, {
            filters: [
                { name: 'Subtitles', extensions: ['ass'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        })
        if (dialogResult.canceled) return null
        return dialogResult.filePath
    }
}

export default CommonIpc
