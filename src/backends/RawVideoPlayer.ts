import beamcoder from 'beamcoder'
import { RenderedVideo } from '@/interfaces'
import logger from '@/logger'
import Config from '@/config'
import VideoPlayer from './VideoPlayer'

class RawVideoPlayer extends VideoPlayer {
    private renderedCache: Array<RenderedVideo> = []

    async RenderImage(timestamp: number): Promise<RenderedVideo> {
        logger.debug(`start render frame on timestamp ${timestamp}`)
        if (!this.renderedCache.some(t => t.timestamp === timestamp)) {
            await this.SeekByTimestamp(timestamp)
            let decodedFrames: beamcoder.Frame[]
            do {
                decodedFrames = await this.Decode()
                decodedFrames = await this.convertPixelFormat(decodedFrames)

                if (decodedFrames == null) {
                    throw new Error('Unknown decode error')
                }

                // Cannot use promise.all since the encode operation must be sequential
                for (const frame of decodedFrames) {
                    this.renderedCache.push({
                        data: frame.data,
                        timestamp: frame.pts,
                        keyFrame: frame.key_frame
                    })
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
}

export default RawVideoPlayer
