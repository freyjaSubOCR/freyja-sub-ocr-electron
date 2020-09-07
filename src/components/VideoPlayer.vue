<template>
    <div>
        <div>
            <img :src="picData">
        </div>
        <div>
            <button @click="openVideo()" id="openVideo">open video</button>
        </div>
        <div>
            <button @click="currentFrame -= 1" :disabled="!videoOpened || currentFrame <= 0">previous</button>
            <button @click="currentFrame += 1" :disabled="!videoOpened || currentFrame >= lastFrame">next</button>
        </div>
        <div>
            <div>
                <label for="currentFrame">Current frame: </label>
                <input id="currentName" name="currentName" type="number"
                       min="0" :max="lastFrame" step="1"
                       :disabled="!videoOpened" v-model.number="currentFrame">
            </div>
            <div>
                <button v-if="play" @click="stopVideo()" :disabled="!videoOpened">stop</button>
                <button v-else @click="playVideo()" :disabled="!videoOpened">play</button>
            </div>
            <div>Duration: {{videoProperties.duration}}</div>
            <div>unitFrame: {{unitFrame}}</div>
            <div>lastFrame: {{lastFrame}}</div>
            <div>TimeBase: {{videoProperties.timeBase[0]}} / {{videoProperties.timeBase[1]}}</div>
            <div>fps: {{videoProperties.fps[0]}} / {{videoProperties.fps[1]}}</div>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import lodash from 'lodash'
import { RenderedVideo, VideoProperties } from '@/interfaces'

// TODO: Drag and drop

@Component
export default class VideoPlayer extends Vue {
    videoOpened = false
    videoProperties: VideoProperties = { duration: 0, timeBase: [1, 1], fps: [1, 1], width: 0, height: 0 }
    timestamp = 0
    play = false

    private frameData?: Buffer
    private debouncedUpdatePicData?: lodash.DebouncedFunc<(timestamp: number) => Promise<void>>

    created(): void {
        this.debouncedUpdatePicData = lodash.debounce(this.updatePicData, 500, { leading: true })
    }

    get unitFrame(): number {
        return this.videoProperties.timeBase[1] *
                this.videoProperties.fps[1] /
                this.videoProperties.timeBase[0] /
                this.videoProperties.fps[0]
    }

    get lastFrame(): number {
        return Math.floor(this.videoProperties.duration / this.unitFrame)
    }

    get picData(): string {
        if (this.frameData === undefined) {
            return ''
        } else {
            const blob = new Blob([this.frameData.buffer], { type: 'image/bmp' })
            return window.URL.createObjectURL(blob)
        }
    }

    get currentFrame(): number {
        return lodash.toInteger(this.timestamp / this.unitFrame)
    }

    set currentFrame(value) {
        if (this.debouncedUpdatePicData !== undefined) {
            if (value < 0) value = 0
            if (value > this.lastFrame) value = this.lastFrame
            this.timestamp = lodash.toInteger(value * this.unitFrame)
            this.debouncedUpdatePicData(this.timestamp)
        }
    }

    private async updatePicData(timestamp: number): Promise<void> {
        const renderedVideo = (await global.ipcRenderer.invoke('VideoPlayer:RenderImage', timestamp)) as RenderedVideo | null
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
                this.videoProperties = videoProperties
                await this.updatePicData(0)
                this.videoOpened = true
            }
        }

        openVideoBtn.disabled = false
    }

    async playVideo(): Promise<void> {
        this.play = true
        const timeoutTime = 1000 * this.videoProperties.fps[1] / this.videoProperties.fps[0]
        while (this.currentFrame < this.lastFrame && this.play) {
            const timeout = new Promise(resolve => setTimeout(resolve, timeoutTime))
            await this.updatePicData(this.timestamp + this.unitFrame)
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
