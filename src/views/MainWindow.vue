<template>
    <div class="wrapper">
        <div class="stack stack-left">
            <SubtitleInfoTable v-model="currentFrame" :subtitleInfos.sync="subtitleInfos"></SubtitleInfoTable>
            <button class="save-sub" @click="saveASS">Save subtitles</button>
        </div>
        <div class="stack stack-right">
            <VideoPlayer v-model="currentFrame" :videoProperties="videoProperties" @prevSubtitle="prevSubtitleEvent" @nextSubtitle="nextSubtitleEvent"></VideoPlayer>
            <Timeline v-model="currentFrame" :fps="videoProperties.fps[0] / videoProperties.fps[1]" :totalFrame="videoProperties.lastFrame"  :subtitleInfos.sync="subtitleInfos"></Timeline>
        </div>
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

    async saveASS() {
        const path = (await global.ipcRenderer.invoke('CommonIpc:SaveASSDialog')) as string | null
        if (path != null) {
            await global.ipcRenderer.invoke('ASSGenerator:GenerateAndSave', this.subtitleInfos, this.videoProperties, path)
        }
    }

    async openVideo(path: string | undefined): Promise<void> {
        if (path === undefined) {
            throw new Error('Cannot load video from path')
        }
        const videoProperties = (await global.ipcRenderer.invoke('VideoPlayer:OpenVideo', path)) as VideoProperties | null
        if (videoProperties != null) {
            this.videoProperties = new VideoProperties(videoProperties)
            this.currentFrame = 0
        }
    }

    async created() {
        if (process.env.NODE_ENV === 'development') {
            this.fakeData()
        }
        this.subtitleInfos = ((await global.ipcRenderer.invoke('TorchOCRTaskScheduler:subtitleInfos')) as SubtitleInfo[])
            .map(t => new SubtitleInfo(t))
        const path = this.$route.params.path as string | undefined
        await this.openVideo(path)
    }
}

export default Mainwindow
</script>

<style lang="scss" scoped>
.stack {
    width: 50%;
    display: flex;
    flex-direction: column;
}

.save-sub {
    padding: 12px 16px;
    margin-top: 16px;
    box-shadow: 0px 2px 16px rgba(0, 0, 0, 0.16);
    border-radius: 2px;
    border: none;
    transition: 0.2s all;
    background: #0D1F2D;
    color: rgba(#fff, 0.7);
}

.save-sub:hover {
    background: #ffffff20;
    border: #ffffff20;
}

.stack-left {
    min-width: 430px;
    margin: 40px 16px 40px 40px;
}

.stack-right {
    min-width: 520px;
    margin: 40px 40px 40px 16px;
}

.wrapper {
    display: flex;
    flex-direction: row;
    position: fixed;
    top: 36px;
    left: 0;
    bottom: 0;
    right: 0;
}
</style>
