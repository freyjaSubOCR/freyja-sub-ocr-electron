<template>
    <div class="video-wrapper card">
        <div class="video-img">
            <div v-if="errorMessage !== ''">{{ errorMessage }}</div>
            <img :src="picData" />
            <!-- <img src="@/assets/sample.png" /> -->
        </div>
        <VideoBar v-model="currentPercent" :totalFrame="videoProperties.lastFrame" :fps="fps" :disabled="disabled" @bar-drag-start="play = false"></VideoBar>
        <div class="video-control">
            <span class="video-control-currentframe">{{currentTime}}</span>
            <div class="video-control-buttons">
                <button :disabled="disabled" @click="prevSubtitleEvent" v-if="showSubtitleJumpButton">
                    <img src="@/assets/prev_line.svg" alt />
                </button>
                <button @click="prevFrameEvent" :disabled="disabled || currentFrame <= 0">
                    <img src="@/assets/prev_frame.svg" alt />
                </button>
                <button v-if="play" @click="stopVideo()" :disabled="disabled">
                    <img src="@/assets/pause.svg" alt />
                </button>
                <button v-else @click="playVideo()" :disabled="disabled">
                    <img src="@/assets/play.svg" alt />
                </button>
                <button
                    @click="nextFrameEvent"
                    :disabled="disabled || currentFrame >= videoProperties.lastFrame"
                >
                    <img src="@/assets/next_frame.svg" alt />
                </button>
                <button :disabled="disabled" @click="nextSubtitleEvent" v-if="showSubtitleJumpButton">
                    <img src="@/assets/next_line.svg" alt />
                </button>
            </div>
            <span class="video-control-duration">{{durationTime}}</span>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import lodash from 'lodash'
import { RenderedVideo } from '@/interfaces'
import { VideoProperties } from '@/VideoProperties'
import VideoBar from '@/components/VideoBar.vue'
import { frameToTime } from '@/Utils'

// TODO: Drag and drop

@Component({
    components: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        VideoBar
    },
    model: {
        prop: 'currentFrame',
        event: 'change'
    }
})
export default class VideoPlayer extends Vue {
    @Prop(VideoProperties) videoProperties!: VideoProperties
    @Prop(Number) currentFrame!: number
    @Prop({ type: Boolean, default: true }) showSubtitleJumpButton!: boolean
    @Prop({ type: Boolean, default: false }) disabled!: boolean

    frameData: Buffer | null = null
    debouncedUpdatePicData?: lodash.DebouncedFunc<(frame: number) => Promise<void>>
    play = false
    updatePicDataPromise = new Promise((resolve) => resolve())
    errorMessage = ''
    currentDisplayFrame = 0

    created(): void {
        this.debouncedUpdatePicData = lodash.debounce((frame: number) => {
            this.updatePicDataPromise = this.updatePicDataPromise.then(() => this.updatePicData(frame))
        }, 500, { leading: true })
    }

    get picData(): string {
        if (this.frameData == null) {
            return ''
        } else {
            const blob = new Blob([this.frameData.buffer], { type: 'image/bmp' })
            return window.URL.createObjectURL(blob)
        }
    }

    // get timestamp(): number {
    //     return lodash.toInteger(this.currentFrame * this.videoProperties.unitFrame)
    // }

    // set timestamp(value: number) {
    //     this.$emit('change', lodash.toInteger(value / this.videoProperties.unitFrame))
    // }

    get currentPercent(): number {
        return this.currentFrame / this.videoProperties.lastFrame
    }

    set currentPercent(value: number) {
        this.$emit('change', value * this.videoProperties.lastFrame)
    }

    get currentTime(): string {
        return frameToTime(this.currentFrame, this.fps)
    }

    get durationTime(): string {
        return frameToTime(this.videoProperties.duration / this.videoProperties.unitFrame, this.fps)
    }

    get fps(): number {
        return this.videoProperties.fps[0] / this.videoProperties.fps[1]
    }

    @Watch('currentFrame')
    async watchCurrentFrame(currentFrame: number, oldFrame: number): Promise<void> {
        if (currentFrame !== oldFrame) {
            await new Promise((resolve) => resolve())
            this.updatePicDataPromise = this.updatePicDataPromise.then(() => this.updatePicData(currentFrame))
            // if (currentFrame - oldFrame === 1) {
            //     this.updatePicDataPromise = this.updatePicDataPromise.then(() => this.updatePicData(currentFrame))
            // } else {
            //     this.play = false
            //     if (this.debouncedUpdatePicData !== undefined) {
            //         await this.debouncedUpdatePicData(currentFrame)
            //     }
            // }
        }
    }

    async updatePicData(frame: number): Promise<void> {
        const timestamp = lodash.toInteger(lodash.toInteger(frame) * this.videoProperties.unitFrame)
        if (frame !== this.currentFrame || frame === this.currentDisplayFrame) return
        const renderedVideo = (await global.ipcRenderer.invoke('VideoPlayer:GetImage', timestamp)) as RenderedVideo | Error
        if (renderedVideo instanceof Error) {
            this.errorMessage = renderedVideo.message
        } else {
            this.frameData = renderedVideo.data as Buffer
            this.errorMessage = ''
            this.currentDisplayFrame = lodash.toInteger(renderedVideo.timestamp / this.videoProperties.unitFrame)
            this.$emit('update-frame')
        }
    }

    async playVideo(): Promise<void> {
        this.play = true
        const timeoutTime = (1000 * this.videoProperties.fps[1]) / this.videoProperties.fps[0]
        // The condition is valid. Since the function is async, other function can change the value
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        while (this.currentFrame < this.videoProperties.lastFrame && this.play) {
            this.$emit('change', this.currentFrame + 1)
            const timeout = new Promise((resolve) => setTimeout(resolve, timeoutTime))
            // this.updatePicDataPromise = this.updatePicDataPromise.then(() => this.updatePicData(this.currentFrame + 1))
            // await this.updatePicDataPromise
            await timeout
        }
        this.play = false
    }

    stopVideo(): void {
        this.play = false
    }

    prevSubtitleEvent(): void {
        this.$emit('prev-subtitle')
    }

    nextSubtitleEvent(): void {
        this.$emit('next-subtitle')
    }

    prevFrameEvent(): void {
        this.$emit('change', this.currentFrame - 1)
    }

    nextFrameEvent(): void {
        this.$emit('change', this.currentFrame + 1)
    }
}
</script>

<style lang="scss" scoped>
.video-wrapper {
    width: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
    margin-bottom: 32px;
    flex-grow: 1;
}

.video-img {
    background-color: #000;
    display: flex;
    position: relative;
    flex-grow: 1;
}

.video-img img {
    max-width: 100%;
    max-height: 100%;
    pointer-events: none;
    margin: auto 0;
}

.video-control {
    display: flex;
    justify-content: space-between;
    align-content: center;
    padding: 8px 24px;
}

.video-control-currentframe,
.video-control-duration {
    font-size: 14px;
    line-height: 24px;
    margin: auto 0;
    font-weight: 600;
    width: 200px;
}

.video-control-currentframe {
    color: #18a1b4;
}

.video-control-duration {
    color: rgba(255, 255, 255, 0.4);
    text-align: right;
    cursor: default;
}

.video-control-buttons {
    display: flex;
    justify-content: center;
}

.video-control-buttons button {
    display: flex;
    padding: 2px 6px;
    margin: 0 12px;
    border-radius: 2px;
    background: transparent;
    border: transparent;
    transition: 0.2s all;
    cursor: pointer;

    &:focus {
        outline: none;
    }

    &:hover {
        background: #ffffff20;
        border: #ffffff20;
    }

    &:disabled {
        cursor: not-allowed;
        background: transparent;
        border: transparent;
    }
}

</style>
