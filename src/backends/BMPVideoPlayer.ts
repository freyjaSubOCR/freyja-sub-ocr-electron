import { ipcMain } from 'electron'
import beamcoder from 'beamcoder'
import { RectPos, RenderedVideo } from '@/interfaces'
import logger from '@/logger'
import Config from '@/config'
import VideoPlayer from './VideoPlayer'

class BMPVideoPlayer extends VideoPlayer {
    private renderedCache: Array<RenderedVideo> = []
    private rectPositons: Array<RectPos> | null = null

    registerIPCListener(): void {
        ipcMain.handle('VideoPlayer:OpenVideo', async (e, ...args) => {
            try {
                return await this.OpenVideo(args[0])
            } catch (error) {
                logger.error(error.message)
                return null
            }
        })
        ipcMain.handle('VideoPlayer:RenderImage', async (e, ...args) => {
            try {
                return await this.RenderImage(args[0])
            } catch (error) {
                logger.error(error.message)
                return null
            }
        })
    }

    async RenderImage(timestamp: number): Promise<RenderedVideo> {
        logger.debug(`start render frame on timestamp ${timestamp}`)
        if (!this.renderedCache.some(t => t.timestamp === timestamp)) {
            await this.SeekByTimestamp(timestamp)
            let decodedFrames: beamcoder.Frame[]
            do {
                decodedFrames = await this.Decode()
                decodedFrames = await this.convertPixelFormat(decodedFrames)

                if (this.rectPositons !== null) {
                    decodedFrames = await this.DrawRect(decodedFrames)
                }

                if (decodedFrames == null) {
                    throw new Error('Unknown decode error')
                }

                // Cannot use promise.all since the encode operation must be sequential
                for (const frame of decodedFrames) {
                    this.renderedCache.push({
                        data: (await this.Encode(frame)).data,
                        timestamp: frame.pts
                    } as RenderedVideo)
                }
            }
            while (!decodedFrames.map(t => t.pts).some(t => t === timestamp))
        }

        const renderedFrame = this.renderedCache.filter(t => t.timestamp === timestamp)
        if (renderedFrame.length === 0) {
            throw new Error('Cannot find rendered timestamp from cache')
        } else if (renderedFrame.length > 1) {
            logger.info(`duplicate cache for timestamp ${timestamp}`)
        }
        const targetFrame = renderedFrame[0]

        while (this.renderedCache.length > Config.cachedFrames) {
            this.renderedCache.shift()
        }

        logger.debug(`send frame on timestamp ${timestamp}`)
        return targetFrame
    }

    private async DrawRect(frames: beamcoder.Frame[]): Promise<beamcoder.Frame[]> {
        return frames
    }
}

export default BMPVideoPlayer
