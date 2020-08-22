import { ipcMain } from 'electron'
import beamcoder from 'beamcoder'
import { RectPos, RenderedVideo, VideoProperties } from '@/interfaces'
import logger from '@/logger'
import Config from '@/config'

class VideoPlayer {
    private demuxer: beamcoder.Demuxer | null = null
    private decoder: beamcoder.Decoder | null = null
    private encoder: beamcoder.Encoder | null = null
    private formatFilter: beamcoder.Filterer | null = null
    private renderedCache: Array<RenderedVideo> = []
    private rectPositons: Array<RectPos> | null = null

    registerIPCListener() {
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

    async OpenVideo(path: string) {
        this.demuxer = await beamcoder.demuxer(path)
        this.decoder = beamcoder.decoder({ 'demuxer': this.demuxer, 'stream_index': 0 })
        this.encoder = beamcoder.encoder({
            'name': 'bmp',
            'width': this.demuxer.streams[0].codecpar.width,
            'height': this.demuxer.streams[0].codecpar.height,
            'pix_fmt': 'bgr24',
            'time_base': [1, 1]
        })
        this.formatFilter = await beamcoder.filterer({
            filterType: 'video',
            inputParams: [
                {
                    'width': this.demuxer.streams[0].codecpar.width,
                    'height': this.demuxer.streams[0].codecpar.height,
                    'pixelFormat': this.demuxer.streams[0].codecpar.format as string,
                    'pixelAspect': this.demuxer.streams[0].codecpar.sample_aspect_ratio,
                    'timeBase': this.demuxer.streams[0].time_base
                }
            ],
            outputParams: [
                {
                    pixelFormat: 'bgr24'
                }
            ],
            filterSpec: 'format=pix_fmts=bgr24'
        })
        return {
            'duration': this.demuxer.streams[0].duration,
            'timeBase': this.demuxer.streams[0].time_base,
            'fps': this.demuxer.streams[0].r_frame_rate
        } as VideoProperties
    }

    async SeekByTime(time: number) {
        logger.debug(`seek to time ${time}`)
        if (this.demuxer == null) {
            throw new Error('No video is opened for seek')
        }
        await this.demuxer.seek({ 'time': time })
    }

    async SeekByTimestamp(timestamp: number) {
        logger.debug(`seek to timestamp ${timestamp}`)
        if (this.demuxer == null) {
            throw new Error('No video is opened for seek')
        }
        await this.demuxer.seek({ 'timestamp': timestamp, 'stream_index': 0 })
    }

    async RenderImage(timestamp: number) {
        logger.debug(`start render frame on timestamp ${timestamp}`)
        if (!this.renderedCache.some(t => t.timestamp === timestamp)) {
            await this.SeekByTimestamp(timestamp)
            let decodedFrames: beamcoder.Frame[]
            do {
                decodedFrames = await this.Decode()
                decodedFrames = await this.convertPixelFormat(decodedFrames)

                if (this.rectPositons !== null) {
                    decodedFrames = this.DrawRect(decodedFrames)
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

    private async convertPixelFormat(decodedFrames: beamcoder.Frame[]) {
        if (this.formatFilter == null) {
            throw new Error('Failed to initlize formatFilter')
        }
        const filterResult = await this.formatFilter.filter(decodedFrames)
        if (filterResult === undefined) {
            throw new Error('Unknown filter error')
        }
        decodedFrames = filterResult[0].frames
        return decodedFrames
    }

    private DrawRect(frames: beamcoder.Frame[]) {
        return frames
    }

    private async Encode(frame: beamcoder.Frame) {
        if (this.encoder == null) {
            throw new Error('Failed to initlize encoder')
        }
        let encodeResult = await this.encoder.encode(frame)
        if (encodeResult.packets.length === 0) {
            encodeResult = await this.encoder.flush()
        }
        if (encodeResult.packets.length !== 1) {
            throw new Error(`Unexpected encode_result, got ${encodeResult.packets.length} packets`)
        }
        return encodeResult.packets[0]
    }

    private async Decode() {
        if (this.demuxer == null || this.decoder == null) {
            throw new Error('No video is opened for decode')
        }

        const decodedFrames: beamcoder.Frame[] = []
        let metKeyFrame = false

        while (decodedFrames.length === 0 || !metKeyFrame) {
            const packet = await this.demuxer.read()
            if (packet == null) {
                decodedFrames.push(...(await this.decoder.flush()).frames)
                if (decodedFrames.length === 0) {
                    throw new Error('Reach end of file')
                }
                // restart a decoder for further processing
                this.decoder = beamcoder.decoder({ 'demuxer': this.demuxer, 'stream_index': 0 })
                break // ignore keyframe optmization
            }

            const decodeResult = ((await this.decoder.decode(packet)).frames)
            metKeyFrame = decodeResult.some(t => t.key_frame)
            decodedFrames.push(...decodeResult)
        }

        logger.debug(`decoded frames on timestamp ${decodedFrames.map(t => t.pts).join(' ')}`)
        return decodedFrames
    }
}

export default VideoPlayer
