import { ipcMain } from 'electron'
import beamcoder from 'beamcoder'
import { RectPos, RenderedVideo } from '@/interfaces'
import logger from '@/logger'
import Config from '@/config'
import VideoPlayer from './VideoPlayer'

class BMPVideoPlayer extends VideoPlayer {
    private _decodedCache: Array<Beamcoder.Frame> = []
    private _renderedCache: Array<RenderedVideo> = []
    private _rectPositons: Array<RectPos> | null = null
    private _preloadPromise = new Promise((resolve) => resolve())

    registerIPCListener(): void {
        ipcMain.handle('VideoPlayer:OpenVideo', async (e, ...args) => {
            try {
                return await this.openVideo(args[0])
            } catch (error) {
                logger.error((error as Error).message)
                return null
            }
        })
        ipcMain.handle('VideoPlayer:GetImage', async (e, ...args) => {
            try {
                return await this.getImage2(args[0])
            } catch (error) {
                logger.error((error as Error).message)
                return (error as Error)
            }
        })
    }

    async getImage2(timestamp: number): Promise<RenderedVideo> {
        timestamp = Math.floor(timestamp)
        if (timestamp < this.startTimestamp) {
            // fake a frame
            return {
                data: Buffer.from([]),
                timestamp: timestamp,
                keyFrame: false
            }
        }
        if (!this._decodedCache.some(t => t.pts === timestamp)) {
            await this.seekByTimestamp(timestamp)
            let decodedFrames: Array<beamcoder.Frame>
            do {
                decodedFrames = await this.decode()
                decodedFrames = await this.convertPixelFormat(decodedFrames)

                if (this._rectPositons !== null) {
                    decodedFrames = this.drawRect(decodedFrames)
                }

                // error upstream type definitions
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                if (decodedFrames == null) {
                    throw new Error('Unknown decode error')
                }

                logger.debug(`decoded frame ${decodedFrames.map(t => t.pts).join(', ')}`)

                // if (decodedFrames.length > 0 && decodedFrames[0].pts > timestamp) {
                //     throw new Error('Unsupported variable frame rate video. Try to transcode the video using ffmpeg.\n' +
                //         `Requested timestamp: ${timestamp}, receive timestamp ${decodedFrames[0].pts}`)
                // }
            }
            // eslint-disable-next-line no-unmodified-loop-condition
            while (!decodedFrames.some(t => t.pts === timestamp))

            this._decodedCache = decodedFrames
        }

        const decodedFrame = this._decodedCache.filter(t => t.pts === timestamp)
        const renderedFrame: RenderedVideo = {
            data: (await this.encode(decodedFrame[0])).data,
            timestamp: decodedFrame[0].pts,
            keyFrame: decodedFrame[0].key_frame
        }
        logger.debug(`send frame on timestamp ${timestamp}`)
        return renderedFrame
    }

    async getImage(timestamp: number): Promise<RenderedVideo> {
        timestamp = Math.floor(timestamp)
        if (!this._renderedCache.some(t => t.timestamp === timestamp)) {
            logger.debug(`cache miss on ${timestamp}`)
            try {
                await this._preloadPromise
            } catch {
                this._preloadPromise = new Promise(resolve => resolve())
            }
            if (!this._renderedCache.some(t => t.timestamp === timestamp)) {
                await this.renderImage(timestamp)
                this._preloadPromise = this._preloadPromise.then(() => this.renderImage(),
                    () => { this._preloadPromise = new Promise(resolve => resolve()) })
            }
        }

        const renderedFrame = this._renderedCache.filter(t => t.timestamp === timestamp)
        if (renderedFrame.length === 0) {
            throw new Error('Cannot find rendered timestamp from cache')
        } else if (renderedFrame.length > 1) {
            logger.debug(`duplicate cache for timestamp ${timestamp}`)
        }
        const targetFrame = renderedFrame[0]

        while (this._renderedCache.length > Config.cachedFrames) {
            this._renderedCache.shift()
        }

        if (targetFrame.keyFrame) {
            logger.debug(`preload on ${timestamp}`)
            this._preloadPromise = this._preloadPromise.then(() => this.renderImage(),
                () => { this._preloadPromise = new Promise(resolve => resolve()) })
        }

        logger.debug(`send frame on timestamp ${timestamp}`)
        return targetFrame
    }

    async renderImage(timestamp?: number | undefined): Promise<void> {
        logger.debug(`start render frame on timestamp ${timestamp ?? ''}`)
        if (timestamp !== undefined) {
            timestamp = Math.floor(timestamp)
            await this.seekByTimestamp(timestamp)
        }
        let decodedFrames: Array<beamcoder.Frame>
        do {
            decodedFrames = await this.decode()
            decodedFrames = await this.convertPixelFormat(decodedFrames)

            if (this._rectPositons !== null) {
                decodedFrames = this.drawRect(decodedFrames)
            }

            // error upstream type definitions
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (decodedFrames == null) {
                throw new Error('Unknown decode error')
            }

            logger.debug(`decoded frame ${decodedFrames.map(t => t.pts).join(', ')}`)
            // Cannot use promise.all since the encode operation must be sequential
            for (const frame of decodedFrames) {
                this._renderedCache.push({
                    data: (await this.encode(frame)).data,
                    timestamp: frame.pts,
                    keyFrame: frame.key_frame
                })
            }

            if (timestamp !== undefined) {
                if (timestamp < this.startTimestamp) {
                // fake a frame
                    this._renderedCache.push({
                        data: decodedFrames[0].data,
                        timestamp: timestamp,
                        keyFrame: false
                    })
                } else if (decodedFrames.length > 0 && decodedFrames[0].pts > timestamp) {
                    throw new Error('Unsupported variable frame rate video. Try to transcode the video using ffmpeg.')
                }
            }
        }
        // eslint-disable-next-line no-unmodified-loop-condition
        while (timestamp !== undefined && !this._renderedCache.some(t => t.timestamp === timestamp))
    }

    drawRect(frames: Array<beamcoder.Frame>): Array<beamcoder.Frame> {
        return frames
    }
}

export default BMPVideoPlayer
