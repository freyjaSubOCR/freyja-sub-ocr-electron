import { ipcMain } from 'electron'
import beamcoder from 'beamcoder'
import { RectPos, RenderedVideo } from '@/interfaces'
import logger from '@/logger'
import Config from '@/config'
import VideoPlayer from './VideoPlayer'

class BMPVideoPlayer extends VideoPlayer {
    private renderedCache: Array<RenderedVideo> = []
    private rectPositons: Array<RectPos> | null = null
    private preloadPromise = new Promise((resolve) => resolve())

    registerIPCListener(): void {
        ipcMain.handle('VideoPlayer:OpenVideo', async (e, ...args) => {
            try {
                return await this.OpenVideo(args[0])
            } catch (error) {
                logger.error(error.message)
                return null
            }
        })
        ipcMain.handle('VideoPlayer:GetImage', async (e, ...args) => {
            try {
                return await this.GetImage(args[0])
            } catch (error) {
                logger.error(error.message)
                return null
            }
        })
    }

    async GetImage(timestamp: number): Promise<RenderedVideo> {
        if (!this.renderedCache.some(t => t.timestamp === timestamp)) {
            logger.debug(`cache miss on ${timestamp}`)
            try {
                await this.preloadPromise
            } catch {
                this.preloadPromise = new Promise(resolve => resolve())
            }
            if (!this.renderedCache.some(t => t.timestamp === timestamp)) {
                await this.RenderImage(timestamp)
                this.preloadPromise = this.preloadPromise.then(() => this.RenderImage(),
                    () => { this.preloadPromise = new Promise(resolve => resolve()) })
            }
        }

        const renderedFrame = this.renderedCache.filter(t => t.timestamp === timestamp)
        if (renderedFrame.length === 0) {
            throw new Error('Cannot find rendered timestamp from cache')
        } else if (renderedFrame.length > 1) {
            logger.debug(`duplicate cache for timestamp ${timestamp}`)
        }
        const targetFrame = renderedFrame[0]

        while (this.renderedCache.length > Config.cachedFrames) {
            this.renderedCache.shift()
        }

        if (targetFrame.keyFrame) {
            logger.debug(`preload on ${timestamp}`)
            this.preloadPromise = this.preloadPromise.then(() => this.RenderImage(),
                () => { this.preloadPromise = new Promise(resolve => resolve()) })
        }

        logger.debug(`send frame on timestamp ${timestamp}`)
        return targetFrame
    }

    async RenderImage(timestamp?: number | undefined): Promise<void> {
        logger.debug(`start render frame on timestamp ${timestamp}`)
        if (timestamp !== undefined) {
            await this.SeekByTimestamp(timestamp)
        }
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

            logger.debug(`decoded frame ${decodedFrames.map(t => t.pts).join(', ')}`)
            // Cannot use promise.all since the encode operation must be sequential
            for (const frame of decodedFrames) {
                this.renderedCache.push({
                    data: (await this.Encode(frame)).data,
                    timestamp: frame.pts,
                    keyFrame: frame.key_frame
                })
            }
        }
        // eslint-disable-next-line no-unmodified-loop-condition
        while (timestamp !== undefined && !decodedFrames.map(t => t.pts).some(t => t === timestamp))
    }

    private async DrawRect(frames: beamcoder.Frame[]): Promise<beamcoder.Frame[]> {
        return frames
    }
}

export default BMPVideoPlayer
