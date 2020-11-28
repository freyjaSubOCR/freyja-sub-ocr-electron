import { Worker } from 'worker_threads'
import path from 'path'
import { ipcMain } from 'electron'
import logger from '@/logger'
import Config from '@/config'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import TorchOCRTaskScheduler from '@/backends/TorchOCRTaskScheduler'

class TorchOCRTaskSchedulerWorker {
    worker: Worker | undefined

    initWorker(): void {
        if (this.worker !== undefined) return
        let workerPath = path.resolve(__dirname, 'TorchOCRTaskSchedulerWorkerStarter.js')
        if (/\.asar[/\\]/.exec(workerPath)) {
            workerPath = workerPath.replace(/\.asar([/\\])/, '.asar.unpacked$1')
        }
        this.worker = new Worker(workerPath)
    }

    async terminateWorker(): Promise<void> {
        if (this.worker === undefined) return
        await this.worker.terminate()
        this.worker = undefined
    }

    registerIPCListener(): void {
        ipcMain.handle('TorchOCRTaskScheduler:Init', async (e, ...args) => {
            try {
                if (this.worker === undefined) this.initWorker()
                const worker = this.worker
                this.worker?.postMessage(['Init', args[0], Config.export()])
                return await new Promise((resolve) => {
                    this.worker?.on('message', function handler(rargs: Array<unknown>) {
                        if (rargs[0] as string === 'Init') {
                            worker?.off('message', handler)
                            resolve(rargs[1])
                        }
                    })
                })
            } catch (error) {
                logger.error((error as Error).message)
                return null
            }
        })
        ipcMain.handle('TorchOCRTaskScheduler:Start', async () => {
            try {
                if (this.worker === undefined) this.initWorker()
                const worker = this.worker
                this.worker?.postMessage(['Start'])
                return await new Promise((resolve) => {
                    this.worker?.on('message', function handler(rargs: Array<unknown>) {
                        if (rargs[0] as string === 'Start') {
                            worker?.off('message', handler)
                            resolve(rargs[1])
                        }
                    })
                })
            } catch (error) {
                logger.error((error as Error).message)
                return null
            }
        })
        ipcMain.handle('TorchOCRTaskScheduler:CleanUpSubtitleInfos', async () => {
            try {
                if (this.worker === undefined) this.initWorker()
                const worker = this.worker
                this.worker?.postMessage(['CleanUpSubtitleInfos'])
                return await new Promise((resolve) => {
                    this.worker?.on('message', function handler(rargs: Array<unknown>) {
                        if (rargs[0] as string === 'CleanUpSubtitleInfos') {
                            worker?.off('message', handler)
                            resolve(rargs[1])
                        }
                    })
                })
            } catch (error) {
                logger.error((error as Error).message)
                return null
            }
        })
        ipcMain.handle('TorchOCRTaskScheduler:currentProcessingFrame', async () => {
            try {
                if (this.worker === undefined) this.initWorker()
                const worker = this.worker
                this.worker?.postMessage(['currentProcessingFrame'])
                return await new Promise((resolve) => {
                    this.worker?.on('message', function handler(rargs: Array<unknown>) {
                        if (rargs[0] as string === 'currentProcessingFrame') {
                            worker?.off('message', handler)
                            resolve(rargs[1])
                        }
                    })
                })
            } catch (error) {
                logger.error((error as Error).message)
                return null
            }
        })
        ipcMain.handle('TorchOCRTaskScheduler:totalFrame', async () => {
            try {
                if (this.worker === undefined) this.initWorker()
                const worker = this.worker
                this.worker?.postMessage(['totalFrame'])
                return await new Promise((resolve) => {
                    this.worker?.on('message', function handler(rargs: Array<unknown>) {
                        if (rargs[0] as string === 'totalFrame') {
                            worker?.off('message', handler)
                            resolve(rargs[1])
                        }
                    })
                })
            } catch (error) {
                logger.error((error as Error).message)
                return null
            }
        })
        ipcMain.handle('TorchOCRTaskScheduler:subtitleInfos', async () => {
            try {
                if (this.worker === undefined) this.initWorker()
                const worker = this.worker
                this.worker?.postMessage(['subtitleInfos'])
                return await new Promise((resolve) => {
                    this.worker?.on('message', function handler(rargs: Array<unknown>) {
                        if (rargs[0] as string === 'subtitleInfos') {
                            worker?.off('message', handler)
                            resolve(rargs[1])
                        }
                    })
                })
            } catch (error) {
                logger.error((error as Error).message)
                return null
            }
        })
        ipcMain.handle('TorchOCRTaskScheduler:Close', async () => {
            try {
                if (this.worker === undefined) this.initWorker()
                const worker = this.worker
                this.worker?.postMessage(['Close'])
                return await new Promise((resolve) => {
                    this.worker?.on('message', function handler(rargs: Array<unknown>) {
                        if (rargs[0] as string === 'Close') {
                            worker?.off('message', handler)
                            resolve(rargs[1])
                        }
                    })
                })
            } catch (error) {
                logger.error((error as Error).message)
                return null
            }
        })
    }
}

export default TorchOCRTaskSchedulerWorker
