<template>
    <div>
        <div>
            <button id="openVideo" @click="openVideo" :disabled="processing">Open Video</button>
        </div>
        <div>
            <div class="process-bar">
                <div class="process-bar-current" :style="{width: percent * 100 + '%'}">
                </div>
            </div>
            <div v-if="processing">Processing: {{ currentProcessingFrame }}Frames / {{ totalFrame }}Frames</div>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
class Start extends Vue {
    currentProcessingFrame = 0
    totalFrame = 1
    processing = false

    get percent() {
        return this.currentProcessingFrame / this.totalFrame
    }

    async openVideo(): Promise<void> {
        this.processing = true
        const path = (await global.ipcRenderer.invoke('CommonIpc:OpenMovieDialog')) as string | null
        if (path != null) {
            await global.ipcRenderer.invoke('TorchOCRTaskScheduler:Init', path)
            this.totalFrame = await global.ipcRenderer.invoke('TorchOCRTaskScheduler:totalFrame')
            const interval = setInterval(async () => {
                this.currentProcessingFrame = await global.ipcRenderer.invoke('TorchOCRTaskScheduler:currentProcessingFrame')
            }, 1000)
            await global.ipcRenderer.invoke('TorchOCRTaskScheduler:Start')
            await global.ipcRenderer.invoke('TorchOCRTaskScheduler:CleanUpSubtitleInfos')
            clearInterval(interval)
            await this.$router.push({ name: 'MainWindow', params: { 'path': path } })
            this.processing = false
        } else {
            this.processing = false
        }
    }
}

export default Start
</script>

<style lang="scss" scoped>
.process-bar {
    border-radius: 10px;
    width: 100%;
    height: 4px;
    cursor: pointer;
    position: relative;
    background: rgba(255, 255, 255, 0.1);
}

.process-bar-current {
    height:4px;
    background: #18A1B4;
    position: relative;
}
</style>
