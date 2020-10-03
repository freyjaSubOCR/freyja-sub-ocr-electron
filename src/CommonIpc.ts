import { dialog, BrowserWindow, ipcMain } from 'electron'
import logger from '@/logger'
import { ScriptModule } from 'torch-js'

class CommonIpc {
    registerIPCListener(): void {
        ipcMain.handle('CommonIpc:OpenMovieDialog', async () => {
            try {
                return await this.openMovieDialog()
            } catch (error) {
                logger.error((error as Error).message)
                return null
            }
        })
        ipcMain.handle('CommonIpc:SaveASSDialog', async () => {
            try {
                return await this.saveASSDialog()
            } catch (error) {
                logger.error((error as Error).message)
                return null
            }
        })
        ipcMain.handle('CommonIpc:Minimize', () => {
            try {
                return this.minimize()
            } catch (error) {
                logger.error((error as Error).message)
                return null
            }
        })
        ipcMain.handle('CommonIpc:Unmaximize', () => {
            try {
                return this.unmaximize()
            } catch (error) {
                logger.error((error as Error).message)
                return null
            }
        })
        ipcMain.handle('CommonIpc:Maximize', () => {
            try {
                return this.maximize()
            } catch (error) {
                logger.error((error as Error).message)
                return null
            }
        })
        ipcMain.handle('CommonIpc:IsMaximized', () => {
            try {
                return this.isMaximized()
            } catch (error) {
                logger.error((error as Error).message)
                return null
            }
        })
        ipcMain.handle('CommonIpc:Close', () => {
            try {
                return this.close()
            } catch (error) {
                logger.error((error as Error).message)
                return null
            }
        })
        ipcMain.handle('CommonIpc:ErrorBox', async (e, ...args) => {
            try {
                if (args.length === 1) {
                    const window = BrowserWindow.getFocusedWindow()
                    if (window !== null) {
                        await dialog.showMessageBox(window, { type: 'info', title: 'Freyja', message: args[0] as string })
                    } else {
                        await dialog.showMessageBox({ type: 'info', title: 'Freyja', message: args[0] as string })
                    }
                }
            } catch (error) {
                logger.error((error as Error).message)
                return null
            }
        })
        ipcMain.handle('CommonIpc:CudaAvailable', () => {
            try {
                return ScriptModule.isCudaAvailable()
            } catch (error) {
                logger.error((error as Error).message)
                return null
            }
        })
    }

    minimize(): void {
        const browserWindow = BrowserWindow.getFocusedWindow()
        if (browserWindow !== null) {
            browserWindow.minimize()
        }
    }

    unmaximize(): void {
        const browserWindow = BrowserWindow.getFocusedWindow()
        if (browserWindow !== null) {
            browserWindow.unmaximize()
        }
    }

    maximize(): void {
        const browserWindow = BrowserWindow.getFocusedWindow()
        if (browserWindow !== null) {
            browserWindow.maximize()
        }
    }

    isMaximized(): boolean {
        const browserWindow = BrowserWindow.getFocusedWindow()
        if (browserWindow !== null) {
            return browserWindow.isMaximized()
        }
        return false
    }

    close(): void {
        const browserWindow = BrowserWindow.getFocusedWindow()
        if (browserWindow !== null) {
            browserWindow.close()
        }
    }

    async openMovieDialog(): Promise<string | null> {
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

    async saveASSDialog(): Promise<string | null> {
        const dialogResult = await dialog.showSaveDialog(BrowserWindow.getFocusedWindow() as BrowserWindow, {
            filters: [
                { name: 'Subtitles', extensions: ['ass'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        })
        if (dialogResult.canceled) return null
        return dialogResult.filePath ?? null
    }
}

export default CommonIpc
