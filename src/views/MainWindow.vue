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
