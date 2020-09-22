import { Worker } from 'worker_threads'
import path from 'path'
import { ipcMain } from 'electron'
import logger from '@/logger'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import TorchOCRTaskScheduler from '@/backends/TorchOCRTaskScheduler'

class TorchOCRTaskSchedulerWorker {
    worker: Worker

    constructor() {
        this.worker = new Worker(path.join(__dirname, 'TorchOCRTaskSchedulerWorkerStarter.js'))
    }

    registerIPCListener(): void {
        ipcMain.handle('TorchOCRTaskScheduler:Init', async (e, ...args) => {
            try {
                const worker = this.worker
                this.worker.postMessage(['Init', args[0]])
                return await new Promise((resolve) => {
                    this.worker.on('message', function handler(rargs: Array<unknown>) {
                        if (rargs[0] as string === 'Init') {
                            worker.off('message', handler)
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
                const worker = this.worker
                this.worker.postMessage(['Start'])
                return await new Promise((resolve) => {
                    this.worker.on('message', function handler(rargs: Array<unknown>) {
                        if (rargs[0] as string === 'Start') {
                            worker.off('message', handler)
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
                const worker = this.worker
                this.worker.postMessage(['CleanUpSubtitleInfos'])
                return await new Promise((resolve) => {
                    this.worker.on('message', function handler(rargs: Array<unknown>) {
                        if (rargs[0] as string === 'CleanUpSubtitleInfos') {
                            worker.off('message', handler)
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
                const worker = this.worker
                this.worker.postMessage(['currentProcessingFrame'])
                return await new Promise((resolve) => {
                    this.worker.on('message', function handler(rargs: Array<unknown>) {
                        if (rargs[0] as string === 'currentProcessingFrame') {
                            worker.off('message', handler)
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
                const worker = this.worker
                this.worker.postMessage(['totalFrame'])
                return await new Promise((resolve) => {
                    this.worker.on('message', function handler(rargs: Array<unknown>) {
                        if (rargs[0] as string === 'totalFrame') {
                            worker.off('message', handler)
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
                const worker = this.worker
                this.worker.postMessage(['subtitleInfos'])
                return await new Promise((resolve) => {
                    this.worker.on('message', function handler(rargs: Array<unknown>) {
                        if (rargs[0] as string === 'subtitleInfos') {
                            worker.off('message', handler)
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
