import beamcoder from 'beamcoder'
import { IVideoProperties, VideoProperties } from '@/VideoProperties'
import logger from '@/logger'

class VideoPlayer {
    private _demuxer: beamcoder.Demuxer | null = null
    private _decoder: beamcoder.Decoder | null = null
    private _encoder: beamcoder.Encoder | null = null
    private _formatFilter: beamcoder.Filterer | null = null
    protected startTimestamp = 0

    get videoProperties(): VideoProperties | null {
        if (this._demuxer == null) return null

        const videoProperties: IVideoProperties = {
            duration: this._demuxer.streams[0].duration !== null ? this._demuxer.streams[0].duration : this._demuxer.duration,
            timeBase: this._demuxer.streams[0].time_base,
            fps: this._demuxer.streams[0].avg_frame_rate,
            width: this._demuxer.streams[0].codecpar.width,
            height: this._demuxer.streams[0].codecpar.height
        }

        return new VideoProperties(videoProperties)
    }

    async openVideo(path: string): Promise<VideoProperties | null> {
        this._demuxer = await beamcoder.demuxer(path)
        // eslint-disable-next-line @typescript-eslint/naming-convention
        this._decoder = beamcoder.decoder({ 'demuxer': this._demuxer, 'stream_index': 0 })
        this._encoder = beamcoder.encoder({
            'name': 'bmp',
            'width': this._demuxer.streams[0].codecpar.width,
            'height': this._demuxer.streams[0].codecpar.height,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'pix_fmt': 'bgr24',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'time_base': [1, 1]
        })
        this._formatFilter = await beamcoder.filterer({
            filterType: 'video',
            inputParams: [
                {
                    'width': this._demuxer.streams[0].codecpar.width,
                    'height': this._demuxer.streams[0].codecpar.height,
                    'pixelFormat': this._demuxer.streams[0].codecpar.format,
                    'pixelAspect': this._demuxer.streams[0].codecpar.sample_aspect_ratio,
                    'timeBase': this._demuxer.streams[0].time_base
                }
            ],
            outputParams: [
                {
                    pixelFormat: 'bgr24'
                }
            ],
            filterSpec: 'format=pix_fmts=bgr24'
        })
        const startTimestamp = this._demuxer.streams[0].start_time
        if (startTimestamp === null) {
            this.startTimestamp = 0
        } else {
            logger.debug(`set start timestamp to ${startTimestamp}`)
            this.startTimestamp = startTimestamp
        }

        logger.debug(`Opened Video: ${path}`)
        const videoProperties = this.videoProperties
        logger.debug(videoProperties)
        return videoProperties
    }

    async seekByTime(time: number): Promise<void> {
        logger.debug(`seek to time ${time}`)
        if (this._demuxer == null) {
            throw new Error('No video is opened for seek')
        }
        await this._demuxer.seek({ 'time': time })
    }

    async seekByTimestamp(timestamp: number): Promise<void> {
        timestamp = Math.floor(timestamp)
        logger.debug(`seek to timestamp ${timestamp}`)
        if (this._demuxer == null) {
            throw new Error('No video is opened for seek')
        }
        // eslint-disable-next-line @typescript-eslint/naming-convention
        await this._demuxer.seek({ 'timestamp': timestamp, 'stream_index': 0 })
    }

    protected async convertPixelFormat(decodedFrames: Array<beamcoder.Frame>): Promise<Array<beamcoder.Frame>> {
        if (this._formatFilter == null) {
            throw new Error('Failed to initlize formatFilter')
        }
        const filterResult = await this._formatFilter.filter(decodedFrames)
        // error upstream type definitions
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (filterResult === undefined) {
            throw new Error('Unknown filter error')
        }
        decodedFrames = filterResult[0].frames
        return decodedFrames
    }

    protected async encode(frame: beamcoder.Frame): Promise<beamcoder.Packet> {
        if (this._encoder == null) {
            throw new Error('Failed to initlize encoder')
        }
        let encodeResult = await this._encoder.encode(frame)
        if (encodeResult.packets.length === 0) {
            encodeResult = await this._encoder.flush()
        }
        if (encodeResult.packets.length !== 1) {
            throw new Error(`Unexpected encode_result, got ${encodeResult.packets.length} packets`)
        }
        return encodeResult.packets[0]
    }

    protected async decode(): Promise<Array<beamcoder.Frame>> {
        if (this._demuxer == null || this._decoder == null) {
            throw new Error('No video is opened for decode')
        }

        const decodedFrames: Array<beamcoder.Frame> = []
        let metKeyFrame = false

        while (decodedFrames.length === 0 || !metKeyFrame) {
            const packet = await this._demuxer.read()
            // error upstream type definitions
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (packet == null) {
                decodedFrames.push(...(await this._decoder.flush()).frames)
                // restart a decoder for further processing
                // eslint-disable-next-line @typescript-eslint/naming-convention
                this._decoder = beamcoder.decoder({ 'demuxer': this._demuxer, 'stream_index': 0 })
                if (decodedFrames.length === 0) {
                    throw new Error('Reach end of file')
                }
                break // ignore keyframe optmization
            }

            const decodeResult = ((await this._decoder.decode(packet)).frames)
            metKeyFrame = decodeResult.some(t => t.key_frame)
            decodedFrames.push(...decodeResult)
        }

        logger.debug(`decoded frames on timestamp ${decodedFrames.map(t => t.pts).join(' ')}`)
        return decodedFrames
    }
}

export default VideoPlayer
