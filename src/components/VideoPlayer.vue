<template>
    <div class="video-wrapper card">
        <div class="video-img">
            <img :src="picData" />
        </div>
        <VideoBar v-model="currentPercent" :totalFrame="videoProperties.lastFrame" :fps="fps"></VideoBar>
        <div class="video-control">
            <span class="video-control-currentframe">{{currentTime}}</span>
            <div class="video-control-buttons">
                <button :disabled="!videoOpened">
                    <img src="@/assets/prev_line.svg" alt />
                </button>
                <button @click="currentFrame -= 1" :disabled="!videoOpened || currentFrame <= 0">
                    <img src="@/assets/prev_frame.svg" alt />
                </button>
                <button v-if="play" @click="stopVideo()" :disabled="!videoOpened">
                    <img src="@/assets/pause.svg" alt />
                </button>
                <button v-else @click="playVideo()" :disabled="!videoOpened">
                    <img src="@/assets/play.svg" alt />
                </button>
                <button
                    @click="currentFrame += 1"
                    :disabled="!videoOpened || currentFrame >= videoProperties.lastFrame"
                >
                    <img src="@/assets/next_frame.svg" alt />
                </button>
                <button :disabled="!videoOpened">
                    <img src="@/assets/next_line.svg" alt />
                </button>
            </div>
            <span class="video-control-duration"> {{durationTime}}</span>
        </div>
        <div style="display:none">
            <div>
                <button @click="openVideo()" id="openVideo">open video</button>
            </div>
            <div>
                <label for="currentFrame">Current frame:</label>
                <input
                    id="currentName"
                    name="currentName"
                    type="number"
                    min="0"
                    :max="videoProperties.lastFrame"
                    step="1"
                    :disabled="!videoOpened"
                    v-model.number="currentFrame"
                />
            </div>
            <div>Duration: {{videoProperties.duration}}</div>
            <div>unitFrame: {{videoProperties.unitFrame}}</div>
            <div>lastFrame: {{videoProperties.lastFrame}}</div>
            <div>TimeBase: {{videoProperties.timeBase[0]}} / {{videoProperties.timeBase[1]}}</div>
            <div>fps: {{videoProperties.fps[0]}} / {{videoProperties.fps[1]}}</div>
        </div>

    </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import lodash from 'lodash'
import { RenderedVideo } from '@/interfaces'
import { VideoProperties } from '@/VideoProperties'
import VideoBar from '@/components/VideoBar.vue'
import { FrameToTime } from '@/Utils'

// TODO: Drag and drop

@Component({
    components: {
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

    private frameData: Buffer | null = null
    private debouncedUpdatePicData?: lodash.DebouncedFunc<(frame: number) => Promise<void>>
    play = false
    videoOpened = true
    updatePicDataPromise = new Promise((resolve) => resolve())

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

    get timestamp(): number {
        return lodash.toInteger(this.currentFrame * this.videoProperties.unitFrame)
    }

    set timestamp(value) {
        this.$emit('change', lodash.toInteger(value / this.videoProperties.unitFrame))
    }

    get currentPercent() {
        return this.currentFrame / this.videoProperties.lastFrame
    }

    set currentPercent(value) {
        this.$emit('change', value * this.videoProperties.lastFrame)
    }

    get currentTime() {
        return FrameToTime(this.currentFrame, this.fps)
    }

    get durationTime() {
        return FrameToTime(this.videoProperties.duration / this.videoProperties.unitFrame, this.fps)
    }

    get fps() {
        return this.videoProperties.fps[0] / this.videoProperties.fps[1]
    }

    @Watch('currentFrame')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async watchCurrentFrame(currentFrame: number, oldFrame: number) {
        if (currentFrame !== oldFrame) {
            if (this.debouncedUpdatePicData !== undefined) {
                await this.debouncedUpdatePicData(currentFrame)
            }
        }
    }

    private async updatePicData(frame: number): Promise<void> {
        const timestamp = lodash.toInteger(lodash.toInteger(frame) * this.videoProperties.unitFrame)
        const renderedVideo = (await global.ipcRenderer.invoke('VideoPlayer:GetImage', timestamp)) as RenderedVideo | null
        if (renderedVideo != null) {
            this.timestamp = renderedVideo.timestamp
            this.frameData = renderedVideo.data as Buffer
        }
    }

    async playVideo(): Promise<void> {
        this.play = true
        const timeoutTime = (1000 * this.videoProperties.fps[1]) / this.videoProperties.fps[0]
        while (this.currentFrame < this.videoProperties.lastFrame && this.play) {
            const timeout = new Promise((resolve) => setTimeout(resolve, timeoutTime))
            this.updatePicDataPromise = this.updatePicDataPromise.then(() => this.updatePicData(this.currentFrame + 1))
            await timeout
        }
        this.play = false
    }

    stopVideo(): void {
        this.play = false
    }
}
</script>

<style lang="scss" scoped>
.video-wrapper {
    width: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
}

.video-img {
    background-color: #000000;
    display: flex;
    position: relative;
    padding: 80px 0;
}

.video-img img {
    max-width: 100%;
    pointer-events: none;
}

.video-control {
    display: flex;
    justify-content: space-between;
    align-content: center;
    padding: 8px 24px;
}

.video-control-currentframe, .video-control-duration {
    font-size: 14px;
    line-height: 24px;
    margin: auto 0;
    font-weight: 600;
    width: 200px;
}

.video-control-currentframe {
    color: #18A1B4;
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
}

.video-control button:hover {
    background: #ffffff20;
    border: #ffffff20;
}
</style>
