import { ipcMain } from 'electron'
import logger from '@/logger'
import { SubtitleInfo } from '@/SubtitleInfo'

class CommonStorage {
    subtitleInfos: Array<SubtitleInfo> = []

    registerIPCListener(): void {
        ipcMain.handle('CommonStorage:subtitleInfos', (e, ...args) => {
            try {
                if (args.length === 1) {
                    this.subtitleInfos = args[0] as Array<SubtitleInfo>
                }
                return this.subtitleInfos
            } catch (error) {
                logger.error((error as Error).message)
                return null
            }
        })
    }
}

export default CommonStorage
