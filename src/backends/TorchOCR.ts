import { ScriptModule } from 'torch-js'
import Config from '@/config'
import { ipcMain } from 'electron'
import logger from '@/logger'
import fs_ from 'fs'
import RawVideoPlayer from './RawVideoPlayer'
import { VideoProperties } from '@/interfaces'

const fs = fs_.promises

class TorchOCR {
    private RCNNModule: ScriptModule | undefined
    private OCRModule: ScriptModule | undefined
    OCRChars: string | undefined
    private VideoPlayer: RawVideoPlayer | undefined
    private VideoProperties: VideoProperties | undefined

    registerIPCListener(): void {
        ipcMain.handle('TorchOCR:InitRCNN', () => {
            try {
                return this.InitRCNN()
            } catch (error) {
                logger.error(error.message)
                return null
            }
        })
        ipcMain.handle('TorchOCR:InitOCR', async () => {
            try {
                return await this.InitOCR()
            } catch (error) {
                logger.error(error.message)
                return null
            }
        })
    }

    InitRCNN(path: string | null = null): void {
        if (path == null) { path = Config.RCNNModulePath }
        this.RCNNModule = new ScriptModule(path)
        if (Config.EnableCuda && ScriptModule.isCudaAvailable()) { this.RCNNModule = this.RCNNModule.cuda() }
    }

    async InitOCR(modulePath: string | null = null, charsPath: string | null = null): Promise<void> {
        if (modulePath == null) { modulePath = Config.OCRModulePath }
        if (charsPath == null) { charsPath = Config.OCRCharsPath }
        this.OCRModule = new ScriptModule(modulePath)
        this.OCRChars = await fs.readFile(charsPath, { encoding: 'utf-8' })
        if (Config.EnableCuda && ScriptModule.isCudaAvailable()) { this.OCRModule = this.OCRModule.cuda() }
    }

    async InitVideoPlayer(path: string): Promise<VideoProperties> {
        this.VideoPlayer = new RawVideoPlayer()
        this.VideoProperties = await this.VideoPlayer.OpenVideo(path)
        return this.VideoProperties
    }
}

export default TorchOCR
