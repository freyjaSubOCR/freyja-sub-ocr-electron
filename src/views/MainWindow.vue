<template>
    <div class="warp">
        <SubtitleInfoTable v-model="currentFrame" :subtitleInfos.sync="subtitleInfos"></SubtitleInfoTable>
        <div class="stack">
            <VideoPlayer v-model="currentFrame" :videoProperties="videoProperties" @prevSubtitle="prevSubtitleEvent" @nextSubtitle="nextSubtitleEvent"></VideoPlayer>
            <Timeline v-model="currentFrame" :fps="videoProperties.fps[0] / videoProperties.fps[1]" :totalFrame="videoProperties.lastFrame"></Timeline>
        </div>
        <div><button id="openVideo" @click="openVideo">Open Video</button></div>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import SubtitleInfoTable from '@/components/SubtitleInfoTable.vue'
import { SubtitleInfo, ISubtitleInfo } from '@/SubtitleInfo'
import VideoPlayer from '@/components/VideoPlayer.vue'
import { VideoProperties } from '@/VideoProperties'
import Timeline from '@/components/Timeline.vue'

@Component({
    components: { SubtitleInfoTable, VideoPlayer, Timeline }
})
class Mainwindow extends Vue {
    subtitleInfos: SubtitleInfo[] = [];
    videoProperties = new VideoProperties(0, [1, 1], [1, 1], 0, 0)
    currentFrame_ = 0

    get currentFrame(): number {
        return this.currentFrame_
    }

    set currentFrame(value) {
        if (value < 0) value = 0
        if (value > this.videoProperties.lastFrame) {
            value = this.videoProperties.lastFrame
        }
        this.currentFrame_ = value
    }

    prevSubtitleEvent() {
        for (const i of this.subtitleInfos.keys()) {
            // assume sorted
            if (this.subtitleInfos[i].endFrame >= this.currentFrame) {
                this.currentFrame = this.subtitleInfos[Math.max(0, i - 1)].startFrame
                break
            }
        }
    }

    nextSubtitleEvent() {
        for (const i of this.subtitleInfos.keys()) {
            // assume sorted
            if (this.subtitleInfos[i].startFrame > this.currentFrame) {
                this.currentFrame = this.subtitleInfos[i].startFrame
                break
            }
        }
    }

    async openVideo(): Promise<void> {
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
                this.currentFrame = 0
            }
        }

        openVideoBtn.disabled = false
    }

    created() {
        if (process.env.NODE_ENV === 'development') {
            this.fakeData()
        }
    }
}

export default Mainwindow
</script>

<style lang="scss" scoped>
.stack {
    max-width: 50%;
    display: flex;
    margin: 40px 40px 40px 16px;
    flex-direction: column;
}

.warp {
    display: flex;
    flex-direction: row;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
}
</style>
