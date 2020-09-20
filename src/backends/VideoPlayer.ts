import beamcoder from 'beamcoder'
import { VideoProperties } from '@/VideoProperties'
import logger from '@/logger'

class VideoPlayer {
    private demuxer: beamcoder.Demuxer | null = null
    private decoder: beamcoder.Decoder | null = null
    private encoder: beamcoder.Encoder | null = null
    private formatFilter: beamcoder.Filterer | null = null
    protected startTimestamp = 0

    async OpenVideo(path: string): Promise<VideoProperties> {
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
        const startTimestamp = this.demuxer.streams[0].start_time
        if (startTimestamp === null) {
            this.startTimestamp = 0
        } else {
            logger.debug(`set start timestamp to ${startTimestamp}`)
            this.startTimestamp = startTimestamp
        }
        return new VideoProperties(
            this.demuxer.duration as number,
            this.demuxer.streams[0].time_base,
            this.demuxer.streams[0].r_frame_rate,
            this.demuxer.streams[0].codecpar.width,
            this.demuxer.streams[0].codecpar.height)
    }

    async SeekByTime(time: number): Promise<void> {
        logger.debug(`seek to time ${time}`)
        if (this.demuxer == null) {
            throw new Error('No video is opened for seek')
        }
        await this.demuxer.seek({ 'time': time })
    }

    async SeekByTimestamp(timestamp: number): Promise<void> {
        timestamp = Math.floor(timestamp)
        logger.debug(`seek to timestamp ${timestamp}`)
        if (this.demuxer == null) {
            throw new Error('No video is opened for seek')
        }
        await this.demuxer.seek({ 'timestamp': timestamp, 'stream_index': 0 })
    }

    protected async convertPixelFormat(decodedFrames: beamcoder.Frame[]): Promise<beamcoder.Frame[]> {
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

    protected async Encode(frame: beamcoder.Frame): Promise<beamcoder.Packet> {
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

    protected async Decode(): Promise<beamcoder.Frame[]> {
        if (this.demuxer == null || this.decoder == null) {
            throw new Error('No video is opened for decode')
        }

        const decodedFrames: beamcoder.Frame[] = []
        let metKeyFrame = false

        while (decodedFrames.length === 0 || !metKeyFrame) {
            const packet = await this.demuxer.read()
            if (packet == null) {
                decodedFrames.push(...(await this.decoder.flush()).frames)
                // restart a decoder for further processing
                this.decoder = beamcoder.decoder({ 'demuxer': this.demuxer, 'stream_index': 0 })
                if (decodedFrames.length === 0) {
                    throw new Error('Reach end of file')
                }
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
