import { ipcMain } from 'electron'
import logger from '@/logger'
import Config from '@/config'
import { TorchOCRWorkerThreadInterface } from '@/backends/TorchOCRWorker'
import { spawn, Thread, Worker } from 'threads'

const wrapperSpawn = () => spawn<TorchOCRWorkerThreadInterface>(new Worker('@/backends/TorchOCRWorker'))
type ThenArg<T> = T extends PromiseLike<infer U> ? U : T
type WorkerType = ThenArg<ReturnType<typeof wrapperSpawn>>

class TorchOCRTaskSchedulerWorker {
    worker: WorkerType | undefined

    async initWorker(): Promise<void> {
        if (this.worker !== undefined) return
        let workerPath = '@/backends/TorchOCRWorker'
        if (process.env.NODE_ENV !== 'production') {
            workerPath = '0.worker.js'
        }
        this.worker = await spawn<TorchOCRWorkerThreadInterface>(new Worker(workerPath))
    }

    async terminateWorker(): Promise<void> {
        if (this.worker === undefined) return
        await Thread.terminate(this.worker)
        this.worker = undefined
    }

    registerIPCListener(): void {
        ipcMain.handle('TorchOCRWorker:Init', async (e, ...args) => {
            try {
                if (this.worker === undefined) await this.initWorker()
                await this.worker?.importConfig(Config.export())
                return await this.worker?.init(args[0])
            } catch (error) {
                logger.error((error as Error).message)
                return null
            }
        })
        ipcMain.handle('TorchOCRWorker:Start', async () => {
            try {
                if (this.worker === undefined) await this.initWorker()
                return await this.worker?.start()
            } catch (error) {
                logger.error((error as Error).message)
                return null
            }
        })
        ipcMain.handle('TorchOCRWorker:CleanUpSubtitleInfos', async () => {
            try {
                if (this.worker === undefined) await this.initWorker()
                return await this.worker?.cleanUpSubtitleInfos()
            } catch (error) {
                logger.error((error as Error).message)
                return null
            }
        })
        ipcMain.handle('TorchOCRWorker:currentProcessingFrame', async () => {
            try {
                if (this.worker === undefined) await this.initWorker()
                return await this.worker?.currentProcessingFrame()
            } catch (error) {
                logger.error((error as Error).message)
                return null
            }
        })
        ipcMain.handle('TorchOCRWorker:Close', async () => {
            try {
                if (this.worker === undefined) await this.initWorker()
                return await this.worker?.close()
            } catch (error) {
                logger.error((error as Error).message)
                return null
            }
        })
    }
}

export default TorchOCRTaskSchedulerWorker
