<template>
    <div>
        <div>
            <img :src="picData" width="960" height="540">
        </div>
        <div>
            <button @click="openVideo()" id="openVideo">open video</button>
        </div>
        <div>
            <button @click="currentFrame -= 1" :disabled="!videoOpened || currentFrame <= 0">previous</button>
            <button @click="currentFrame += 1" :disabled="!videoOpened || currentFrame >= videoProperties.lastFrame">next</button>
        </div>
        <div>
            <div>
                <label for="currentFrame">Current frame: </label>
                <input id="currentName" name="currentName" type="number"
                       min="0" :max="videoProperties.lastFrame" step="1"
                       :disabled="!videoOpened" v-model.number="currentFrame">
            </div>
            <div>
                <button v-if="play" @click="stopVideo()" :disabled="!videoOpened">stop</button>
                <button v-else @click="playVideo()" :disabled="!videoOpened">play</button>
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
import { Component, Vue } from 'vue-property-decorator'
import lodash from 'lodash'
import { RenderedVideo } from '@/interfaces'
import { VideoProperties } from '@/VideoProperties'

// TODO: Drag and drop

@Component
export default class VideoPlayer extends Vue {
    videoOpened = false
    videoProperties: VideoProperties = new VideoProperties(0, [1, 1], [1, 1], 0, 0)
    timestamp = 0
    play = false

    private frameData: Buffer | null = null
    private debouncedUpdatePicData?: lodash.DebouncedFunc<(timestamp: number) => Promise<void>>

    created(): void {
        this.debouncedUpdatePicData = lodash.debounce(this.updatePicData, 500, { leading: true })
    }

    get picData(): string {
        if (this.frameData == null) {
            return ''
        } else {
            const blob = new Blob([this.frameData.buffer], { type: 'image/bmp' })
            return window.URL.createObjectURL(blob)
        }
    }

    get currentFrame(): number {
        return lodash.toInteger(this.timestamp / this.videoProperties.unitFrame)
    }

    set currentFrame(value) {
        if (this.debouncedUpdatePicData !== undefined) {
            if (value < 0) value = 0
            if (value > this.videoProperties.lastFrame) value = this.videoProperties.lastFrame
            this.timestamp = lodash.toInteger(value * this.videoProperties.unitFrame)
            this.debouncedUpdatePicData(this.timestamp)
        }
    }

    private async updatePicData(timestamp: number): Promise<void> {
        const renderedVideo = (await global.ipcRenderer.invoke('VideoPlayer:GetImage', timestamp)) as RenderedVideo | null
        if (renderedVideo != null) {
            this.timestamp = renderedVideo.timestamp
            this.frameData = renderedVideo.data as Buffer
        }
    }

    async openVideo(): Promise<void> {
        this.play = false
        const openVideoBtn = document.querySelector('#openVideo') as HTMLButtonElement
        openVideoBtn.disabled = true

        const path = (await global.ipcRenderer.invoke('CommonIpc:OpenMovieDialog')) as string | null
        if (path != null) {
            const videoProperties = (await global.ipcRenderer.invoke('VideoPlayer:OpenVideo', path)) as VideoProperties | null
            if (videoProperties != null) {
                this.videoProperties = new VideoProperties(
                    videoProperties.duration,
                    videoProperties.timeBase,
                    videoProperties.fps,
                    videoProperties.width,
                    videoProperties.height
                )
                await this.updatePicData(0)
                this.videoOpened = true
            }
        }

        openVideoBtn.disabled = false
    }

    async playVideo(): Promise<void> {
        this.play = true
        const timeoutTime = 1000 * this.videoProperties.fps[1] / this.videoProperties.fps[0]
        while (this.currentFrame < this.videoProperties.lastFrame && this.play) {
            const timeout = new Promise(resolve => setTimeout(resolve, timeoutTime))
            this.updatePicData(this.timestamp + this.videoProperties.unitFrame)
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
</style>
