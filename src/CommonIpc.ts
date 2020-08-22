import { dialog, BrowserWindow, ipcMain } from 'electron'
import logger from '@/logger'

class CommonIpc {
    registerIPCListener() {
        ipcMain.handle('CommonIpc:OpenMovieDialog', async () => {
            try {
                return await this.openMovieDialog()
            } catch (error) {
                logger.error(error.message)
                return null
            }
        })
    }

    async openMovieDialog() {
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
}

export default CommonIpc
