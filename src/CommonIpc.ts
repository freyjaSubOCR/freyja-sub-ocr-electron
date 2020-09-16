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
