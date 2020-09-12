<template>
    <div class="warp">
        <SubtitleInfoTable :subtitleInfos="subtitleInfos"></SubtitleInfoTable>
        <div class="stack">
            <VideoPlayer></VideoPlayer>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import SubtitleInfoTable from '@/components/SubtitleInfoTable.vue'
import { SubtitleInfo, ISubtitleInfo } from '@/SubtitleInfo'
import VideoPlayer from '@/components/VideoPlayer.vue'

@Component({
    components: { SubtitleInfoTable, VideoPlayer }
})
class Mainwindow extends Vue {
    subtitleInfos: SubtitleInfo[] = [];
}

export default Mainwindow
</script>

<style lang="scss" scoped>
.warp {
    display: flex;
    flex-direction: row;
}
.stack {
    display: flex;
    flex-direction: column;
}
</style>
