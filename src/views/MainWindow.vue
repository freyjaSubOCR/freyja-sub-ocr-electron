<template>
    <SubtitleInfoTable :subtitleInfos="subtitleInfos"></SubtitleInfoTable>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import SubtitleInfoTable from '@/components/SubtitleInfoTable.vue'
import { SubtitleInfo, ISubtitleInfo } from '@/interfaces'

@Component({
    components: { SubtitleInfoTable }
})
class Mainwindow extends Vue {
  subtitleInfos: SubtitleInfo[] = [];
}

export default Mainwindow
</script>
