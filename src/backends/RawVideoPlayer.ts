import beamcoder from 'beamcoder'
import { RenderedVideo } from '@/interfaces'
import logger from '@/logger'
import Config from '@/config'
import VideoPlayer from './VideoPlayer'

class RawVideoPlayer extends VideoPlayer {
    private _renderedCache: Array<RenderedVideo> = []

    async renderImage(timestamp: number): Promise<RenderedVideo> {
        timestamp = Math.floor(timestamp)
        logger.debug(`start render frame on timestamp ${timestamp}`)
        if (!this._renderedCache.some(t => Math.abs(t.timestamp - timestamp) <= 1)) {
            // assume torchOCR will never need to seek
            // await this.SeekByTimestamp(timestamp)
            let decodedFrames: Array<beamcoder.Frame>
            do {
                decodedFrames = await this.decode()
                decodedFrames = await this.convertPixelFormat(decodedFrames)

                // error upstream type definitions
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                if (decodedFrames == null) {
                    throw new Error('Unknown decode error')
                }

                // Cannot use promise.all since the encode operation must be sequential
                for (const frame of decodedFrames) {
                    this._renderedCache.push({
                        data: frame.data,
                        timestamp: frame.pts,
                        keyFrame: frame.key_frame
                    })
                }

                if (timestamp < this.startTimestamp) {
                    logger.debug(`fake a frame on timestamp ${timestamp}`)
                    this._renderedCache.push({
                        data: decodedFrames[0].data,
                        timestamp: timestamp,
                        keyFrame: false
                    })
                }
            }
            while (!this._renderedCache.some(t => Math.abs(t.timestamp - timestamp) <= 1))
        }

        const renderedFrame = this._renderedCache.filter(t => Math.abs(t.timestamp - timestamp) <= 1)
        if (renderedFrame.length === 0) {
            throw new Error('Cannot find rendered timestamp from cache')
        } else if (renderedFrame.length > 1) {
            logger.info(`duplicate cache for timestamp ${timestamp}`)
        }
        const targetFrame = renderedFrame[0]

        while (this._renderedCache.length > Config.cachedFrames) {
            this._renderedCache.shift()
        }

        logger.debug(`send frame on timestamp ${timestamp}`)
        return targetFrame
    }
}

export default RawVideoPlayer
