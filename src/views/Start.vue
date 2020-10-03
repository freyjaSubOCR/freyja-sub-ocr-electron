<template>
    <div @dragover.prevent.stop="dragNone" class="start-wrapper">
        <div class="start-content">
            <div @dragover.prevent.stop @drop.prevent.stop="dropVideo" class="start-video">
                <div v-if="dragging">
                </div>
                <div class="start-prompt" v-if="!videoOpened">
                    <img src="@/assets/open-video-icon.svg" />
                    <div class="prompt-drag">Drag and drop Video here</div>
                    <div class="prompt-format">MP4 or MKV format</div>
                    <div class="prompt-or">or <button @click="openVideoDialog" :disabled="processing">Import from computer</button></div>
                </div>
                <div class="start-video-wrapper" v-else>
                    <div class="video-reselect">
                        <div>Select subtitle area by adjusting the handles</div>
                        <button @click="openVideoDialog" :disabled="processing">Reselect a video</button>
                    </div>
                    <div class="video-wrapper">
                        <div class="subtitle-select" :style="{'padding-top': `${blackBarHeight + cropTopComputed}px`, 'padding-bottom': `${blackBarHeight + cropBottomComputed}px`}">
                            <div class="subtitle-select-box">
                                <div class="handle handle-top" @pointerdown="cropTopPointerDown">
                                    <div class="line"></div>
                                    <div class="line"></div>
                                </div>
                                <div class="handle handle-bottom" @pointerdown="cropBottomPointerDown">
                                    <div class="line"></div>
                                    <div class="line"></div>
                                </div>
                                <div class="dark-top"></div>
                                <div class="dark-bottom"></div>
                            </div>
                        </div>
                        <VideoPlayer v-model="currentFrame" :videoProperties="videoProperties" :showSubtitleJumpButton="false" :disabled="processing"></VideoPlayer>
                    </div>
                </div>
            </div>
            <div class="start-settings">
                <div>
                    <div class="settings-section-header">Settings</div>
                    <div class="settings-section">
                        <label for="languages">Language</label>
                        <select name="languages" id="languages" v-model="language" :disabled="processing">
                            <option v-for="(value, name) in languages" :key="name" :value="value">{{ name }}</option>
                        </select>
                    </div>
                    <div class="settings-section settings-font">
                        <label for="fonts">Font</label>
                        <select name="fonts" id="fonts" v-model="font" :disabled="processing">
                            <option v-for="(value, name) in fonts" :key="name" :value="value">{{ name }}</option>
                        </select>
                    </div>
                    <div class="settings-section-header clickable" @click="toggleAdvancedSettingsExpand">Advanced settings <img :class="{ 'advanced-settings-expand': advancedSettingsExpand }" src="@/assets/advanced-settings-expand.svg" /></div>
                    <div v-if="advancedSettingsExpand">
                        <div class="settings-section settings-cuda">
                            <label for="enableCuda">Enable CUDA</label>
                            <input type="checkbox" name="enableCuda" id="enableCuda" v-model="enableCuda" :disabled="processing">
                        </div>
                        <div class="settings-section">
                            <label for="batchSize">Batch size</label>
                            <input type="number" name="batchSize" id="batchSize" v-model.number="batchSize" :disabled="processing">
                        </div>
                        <div class="settings-section">
                            <label for="cachedFrames">Frame cache size</label>
                            <input type="number" name="cachedFrames" id="cachedFrames" v-model.number="cachedFrames" :disabled="processing">
                        </div>
                    </div>
                </div>
                <button class="start-button" @click="start" :disabled="!videoOpened || processing">{{processing ? "Processing..." : "Start"}}</button>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import VideoPlayer from '@/components/VideoPlayer.vue'
import { VideoProperties } from '@/VideoProperties'
import lodash from 'lodash'

@Component({
    // eslint-disable-next-line @typescript-eslint/naming-convention
    components: { VideoPlayer }
})
class Start extends Vue {
    processing = false
    dragging = false
    videoOpened = false
    currentFrame = 0
    videoProperties = new VideoProperties(0, [1, 1], [1, 1], 1920, 1080)
    path: string | undefined
    advancedSettingsExpand = false
    blackBarHeight = 0
    videoHeight = 0

    languages: Record<string, string> = {}
    fonts: Record<string, string> = {}
    language = 'SC3500Chars'
    font = 'yuan'
    enableCuda = true
    batchSize = 24
    cropTop = 0
    cropBottom = 0
    cachedFrames = 100

    private _pointerId: number | undefined

    async created(): Promise<void> {
        /* eslint-disable @typescript-eslint/unbound-method */
        // Allow unbound method for global event listener
        document.addEventListener('pointermove', this.pointerMove)
        document.addEventListener('pointerup', this.pointerUp)
        /* eslint-enable @typescript-eslint/unbound-method */

        this.languages = await global.ipcRenderer.invoke('Config:languages') as Record<string, string>
        this.fonts = await global.ipcRenderer.invoke('Config:fonts') as Record<string, string>
        this.language = await global.ipcRenderer.invoke('Config:language') as string
        this.font = await global.ipcRenderer.invoke('Config:font') as string
        this.enableCuda = await global.ipcRenderer.invoke('Config:enableCuda') as boolean
        this.batchSize = await global.ipcRenderer.invoke('Config:batchSize') as number
        this.cropTop = await global.ipcRenderer.invoke('Config:cropTop') as number
        this.cropBottom = await global.ipcRenderer.invoke('Config:cropBottom') as number
        this.cachedFrames = await global.ipcRenderer.invoke('Config:cachedFrames') as number
    }

    @Watch('language')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async watchLanguage(newValue: string, oldValue: string): Promise<void> {
        await global.ipcRenderer.invoke('Config:language', newValue)
    }

    @Watch('font')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async watchFont(newValue: string, oldValue: string): Promise<void> {
        await global.ipcRenderer.invoke('Config:font', newValue)
    }

    @Watch('enableCuda')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async watchEnableCuda(newValue: boolean, oldValue: boolean): Promise<void> {
        await global.ipcRenderer.invoke('Config:enableCuda', newValue)
    }

    @Watch('batchSize')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async watchBatchSize(newValue: number, oldValue: number): Promise<void> {
        await global.ipcRenderer.invoke('Config:batchSize', newValue)
    }

    @Watch('cropTop')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async watchCropTop(newValue: number, oldValue: number): Promise<void> {
        await global.ipcRenderer.invoke('Config:cropTop', Math.round(newValue))
    }

    @Watch('cropBottom')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async watchCropBottom(newValue: number, oldValue: number): Promise<void> {
        await global.ipcRenderer.invoke('Config:cropBottom', Math.round(newValue))
    }

    @Watch('cachedFrames')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async watchCachedFrames(newValue: number, oldValue: number): Promise<void> {
        await global.ipcRenderer.invoke('Config:cachedFrames', newValue)
    }

    beforeDestroy(): void {
        /* eslint-disable @typescript-eslint/unbound-method */
        // Allow unbound method for global event listener
        document.removeEventListener('pointermove', this.pointerMove)
        document.removeEventListener('pointerup', this.pointerUp)
        /* eslint-enable @typescript-eslint/unbound-method */
    }

    get cropTopComputed(): number {
        return this.cropTop / this.videoProperties.height * this.videoHeight
    }

    set cropTopComputed(value: number) {
        if (value > this.videoHeight - this.cropBottomComputed) {
            value = this.videoHeight - this.cropBottomComputed
        }
        if (value < 0) {
            value = 0
        }
        this.cropTop = value / this.videoHeight * this.videoProperties.height
    }

    get cropBottomComputed(): number {
        return this.cropBottom / this.videoProperties.height * this.videoHeight
    }

    set cropBottomComputed(value: number) {
        if (this.videoHeight - value < this.cropTopComputed) {
            value = this.videoHeight - this.cropTopComputed
        }
        if (value < 0) {
            value = 0
        }
        this.cropBottom = value / this.videoHeight * this.videoProperties.height
    }

    computeBlackBarHeight(): void {
        const video = document.querySelector('.video-img img')
        if (video !== null) {
            const marginTop = window.getComputedStyle(video).marginTop
            this.blackBarHeight = lodash.toNumber(marginTop.substring(0, marginTop.length - 2))
        } else {
            this.blackBarHeight = 0
        }
    }

    computeVideoHeight(): void {
        const video = document.querySelector('.video-img img')
        if (video !== null) {
            this.videoHeight = video.getBoundingClientRect().height
        }
    }

    private _lastY = 0
    private _pointerBtn = 'top'
    cropTopPointerDown(event: PointerEvent): void {
        if (!this.processing && this._pointerId === undefined) {
            event.preventDefault()
            this._pointerId = event.pointerId
            this._lastY = event.pageY
            this._pointerBtn = 'top'
        }
    }
    cropBottomPointerDown(event: PointerEvent): void {
        if (!this.processing && this._pointerId === undefined) {
            event.preventDefault()
            this._pointerId = event.pointerId
            this._lastY = event.pageY
            this._pointerBtn = 'bottom'
        }
    }

    pointerMove(event: PointerEvent): void {
        if (this._pointerId === event.pointerId) {
            event.preventDefault()
            if (this._pointerBtn === 'top') {
                this.cropTopComputed = (event.pageY - this._lastY) + this.cropTopComputed
            } else if (this._pointerBtn === 'bottom') {
                this.cropBottomComputed -= (event.pageY - this._lastY)
            }
            this._lastY = event.pageY
        }
    }

    pointerUp(event: PointerEvent): void {
        if (this._pointerId === event.pointerId) {
            event.preventDefault()
            this._pointerId = undefined
        }
    }

    dragNone(event: DragEvent): void {
        if (event.dataTransfer !== null) {
            event.dataTransfer.dropEffect = 'none'
        }
    }

    async dropVideo(event: DragEvent): Promise<void> {
        const fileList = event.dataTransfer?.files
        if (fileList !== undefined) {
            for (const file of fileList) {
                if (file.path.toLowerCase().endsWith('.mp4') || file.path.toLowerCase().endsWith('.mkv')) {
                    this.path = file.path
                    await this.openVideo()
                    break
                }
            }
        }
    }

    toggleAdvancedSettingsExpand(): void {
        this.advancedSettingsExpand = !this.advancedSettingsExpand
    }

    async openVideoDialog(): Promise<void> {
        const path = (await global.ipcRenderer.invoke('CommonIpc:OpenMovieDialog')) as string | null
        if (path != null) {
            this.path = path
            await this.openVideo()
        }
    }

    async openVideo(): Promise<void> {
        if (this.path === undefined) {
            throw new Error('Cannot load video from path')
        }
        const videoProperties = (await global.ipcRenderer.invoke('VideoPlayer:OpenVideo', this.path)) as VideoProperties | null
        if (videoProperties != null) {
            this.videoProperties = new VideoProperties(videoProperties)
            this.currentFrame = 0
            this.videoOpened = true
            const interval = setInterval(() => {
                this.computeBlackBarHeight()
                this.computeVideoHeight()
                if (this.videoHeight > 0) {
                    clearInterval(interval)
                }
            }, 100)
        }
    }

    @Watch('currentFrame')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    watchCurrentFrame(newValue: number, oldValue: number): void {
        const interval = setInterval(() => {
            this.computeBlackBarHeight()
            this.computeVideoHeight()
            if (this.videoHeight > 0) {
                clearInterval(interval)
            }
        }, 100)
    }

    async start(): Promise<void> {
        if (this.path === undefined) {
            throw new Error('Cannot load video from path')
        }
        this.processing = true
        if (!await global.ipcRenderer.invoke('Config:CheckPath')) {
            this.processing = false
            await global.ipcRenderer.invoke('CommonIpc:ErrorBox', 'Cannot find models. Please download model from https://github.com/freyjaSubOCR/freyja-sub-ocr-model-zoo/releases.')
            return
        }
        if (await global.ipcRenderer.invoke('TorchOCRTaskScheduler:Init', this.path) !== null) {
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            const interval = setInterval(async () => {
                this.currentFrame = (await global.ipcRenderer.invoke('TorchOCRTaskScheduler:currentProcessingFrame') as number | null) ?? this.currentFrame
            }, 1000)
            if (await global.ipcRenderer.invoke('TorchOCRTaskScheduler:Start') !== null) {
                if (await global.ipcRenderer.invoke('TorchOCRTaskScheduler:CleanUpSubtitleInfos') !== null) {
                    clearInterval(interval)
                    await this.$router.push({ name: 'MainWindow', params: { 'path': this.path } })
                    this.processing = false
                    return
                }
            }
            clearInterval(interval)
        }
        this.processing = false
        await global.ipcRenderer.invoke('CommonIpc:ErrorBox', 'pyTorch backend crashed, please try again.')
    }
}

export default Start
</script>

<style lang="scss" scoped>

.start-wrapper {
    display: flex;
    position: fixed;
    top: 36px;
    left: 0;
    bottom: 0;
    right: 0;
}

.start-content {
    display: flex;
    flex-direction: row;
    background-color: #091620;
    margin: auto;
    border-radius: 4px;
}

.start-settings {
    background-color: #0b1b27;
    padding: 24px 16px;
    width: 200px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    select,
    input {
        background: #112a3e;
        border-radius: 4px;
        border: none;
        outline: none;
        height: 24px;
        line-height: 14px;
        padding-left: 4px;
        color: rgba(255, 255, 255, 0.7);
    }
}

.start-video {
    width: 600px;
    height: 500px;
    padding: 24px;
    display: flex;
    flex-direction: column;
}

.start-prompt {
    margin: auto;
    display: flex;
    flex-direction: column;

    img {
        margin: auto auto 24px;
    }
}

.prompt-drag {
    font-weight: 500;
    font-size: 20px;
    line-height: 24px;
    color: rgba(255, 255, 255, 0.8);
}

.prompt-format,
.prompt-or {
    margin: 0 auto 8px;
    font-size: 14px;
    line-height: 24px;
    color: rgba(255, 255, 255, 0.5);
}

.prompt-or button {
    font-size: 14px;
    line-height: 20px;
    color: rgba(255, 255, 255, 0.5);
    border: 1px solid #1c425f;
    box-sizing: border-box;
    border-radius: 4px;
    padding: 8px 16px;
    background-color: transparent;
    margin-left: 12px;
    transition: 0.2s all;
    cursor: pointer;

    &:hover {
        color: rgba(255, 255, 255, 0.8);
        background-color: rgba($color: #fff, $alpha: 0.05);
    }
}

.video-reselect {
    color: rgba(#fff, 0.5);
    display: flex;
    justify-content: space-between;
    margin-bottom: 16px;

    // stylelint-disable-next-line no-descending-specificity
    button {
        color: rgba(255, 255, 255, 0.3);
        outline: none;
        border: none;
        background-color: transparent;
        cursor: pointer;
        transition: 0.2s all;

        &:hover {
            color: rgba(255, 255, 255, 0.5);
        }
    }
}

.settings-section-header {
    font-size: 14px;
    line-height: 14px;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.4);
    margin-bottom: 16px;
    display: flex;
    justify-content: space-between;
    cursor: default;

    &.clickable {
        cursor: pointer;
    }

    .advanced-settings-expand {
        transform: rotate(180deg);
    }

    img {
        transition: 0.2s all;
        margin: auto 0;
    }
}

.settings-section {
    display: flex;
    flex-direction: column;
    margin-bottom: 12px;

    label {
        font-size: 14px;
        line-height: 14px;
        color: rgba(255, 255, 255, 0.75);
        margin-bottom: 8px;
    }
}

.settings-font {
    margin-bottom: 24px;
}

.start-button {
    background: #1c425f;
    padding: 12px;
    border: none;
    border-radius: 4px;
    box-sizing: border-box;
    color: rgba(255, 255, 255, 0.75);
    font-size: 14px;
    line-height: 14px;
    cursor: pointer;
    transition: 0.2s all;

    &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }

    &:hover {
        color: rgba(255, 255, 255, 0.9);
    }
}

.settings-cuda {
    display: flex;
    flex-direction: row;
    justify-content: space-between;

    label {
        margin: auto 0;
    }
}

.start-video-wrapper {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
}

.video-wrapper {
    display: flex;
    flex-grow: 1;
    width: 552px;
    margin-bottom: 0 !important;
    position: relative;
}

.subtitle-select {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 48px;
    z-index: 10;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.subtitle-select-box {
    border: 3px solid #18a1b4;
    margin-left: 0;
    margin-right: 0;
    flex-grow: 1;
    position: relative;
    background: rgba(24, 161, 180, 0.2);
}

.handle {
    width: 48px;
    height: 8px;
    background: #18a1b4;
    border-radius: 2px;
    display: flex;
    flex-direction: column;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    justify-content: space-around;
    padding: 1px;
    cursor: s-resize;
    z-index: 2;

    .line {
        margin: auto;
        width: 40px;
        height: 1px;
        background: rgba(255, 255, 255, 0.8);
        border-radius: 5px;
    }
}

.handle-top {
    top: -8px;
}

.handle-bottom {
    bottom: -8px;
}

.dark-top,
.dark-bottom {
    position: absolute;
    height: 500px;
    left: -10px;
    right: -10px;
    background: rgba(0, 0, 0, 0.7);
}

.dark-top {
    top: -503px;
}

.dark-bottom {
    bottom: -503px;
}

</style>
