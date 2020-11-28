import { ipcMain } from 'electron'
import beamcoder from 'beamcoder'
import { RectPos, RenderedVideo } from '@/interfaces'
import logger from '@/logger'
import VideoPlayer from './VideoPlayer'

class BMPVideoPlayer extends VideoPlayer {
    private _decodedCache: Array<Beamcoder.Frame> = []
    private _rectPositons: Array<RectPos> | null = null

    registerIPCListener(): void {
        ipcMain.handle('VideoPlayer:OpenVideo', async (e, ...args) => {
            try {
                logger.debug('BMPVideoPlayer:OpenVideo')
                return await this.openVideo(args[0])
            } catch (error) {
                logger.error((error as Error).message)
                return null
            }
        })
        ipcMain.handle('VideoPlayer:GetVideoProperties', () => {
            try {
                logger.debug('BMPVideoPlayer:GetVideoProperties')
                return this.videoProperties
            } catch (error) {
                logger.error((error as Error).message)
                return null
            }
        })
        ipcMain.handle('VideoPlayer:Seek', async (e, ...args) => {
            try {
                logger.debug(`BMPVideoPlayer:Seek ${args[0] as number}`)
                return await this.seekByTimestamp(args[0])
            } catch (error) {
                logger.error((error as Error).message)
                return (error as Error)
            }
        })
        ipcMain.handle('VideoPlayer:GetImage', async (e, ...args) => {
            try {
                logger.debug(`BMPVideoPlayer:GetImage ${args[0] as number}`)
                return await this.getImage2(args[0])
            } catch (error) {
                logger.error((error as Error).message)
                return (error as Error)
            }
        })
        ipcMain.handle('VideoPlayer:CloseVideo', () => {
            try {
                logger.debug('BMPVideoPlayer:CloseVideo')
                return this.closeVideo()
            } catch (error) {
                logger.error((error as Error).message)
                return null
            }
        })
    }

    async getImage2(timestamp: number): Promise<RenderedVideo> {
        if (timestamp < this.startTimestamp) {
            // fake a frame
            return {
                data: Buffer.from([]),
                timestamp: timestamp,
                keyFrame: false
            }
        }
        if (!this._decodedCache.some(t => t.best_effort_timestamp === timestamp)) {
            await this.seekByTimestamp(timestamp)
            let decodedFrames: Array<beamcoder.Frame>
            do {
                logger.debug(`BMPVideoPlayer: decoding for timestamp ${timestamp}`)
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

                // if (decodedFrames.length > 0 && decodedFrames[0].best_effort_timestamp > timestamp) {
                //     throw new Error('Unsupported variable frame rate video. Try to transcode the video using ffmpeg.\n' +
                //         `Requested timestamp: ${timestamp}, receive timestamp ${decodedFrames[0].best_effort_timestamp}`)
                // }
            }
            // eslint-disable-next-line no-unmodified-loop-condition
            while (!decodedFrames.some(t => t.best_effort_timestamp === timestamp))

            this._decodedCache = decodedFrames
        }

        const decodedFrame = this._decodedCache.filter(t => t.best_effort_timestamp === timestamp)
        const renderedFrame: RenderedVideo = {
            data: (await this.encode(decodedFrame[0])).data,
            timestamp: decodedFrame[0].best_effort_timestamp,
            keyFrame: decodedFrame[0].key_frame
        }
        logger.debug(`BMPVideoPlayer: send frame on timestamp ${timestamp}`)
        return renderedFrame
    }

    drawRect(frames: Array<beamcoder.Frame>): Array<beamcoder.Frame> {
        return frames
    }
}

export default BMPVideoPlayer
