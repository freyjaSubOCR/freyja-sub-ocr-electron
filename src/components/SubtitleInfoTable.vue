<template>
    <div class="subtitleInfo-wrapper card">
        <table class="subtitleInfo-header">
            <tr class="subtitleInfo-row">
                <td class="subtitleInfo-time">Start</td>
                <td class="subtitleInfo-time">End</td>
                <td class="subtitleInfo-text">Subtitle Text</td>
            </tr>
        </table>
        <simplebar force-visible>
            <table class="subtitleInfo-content">
                <tr class="subtitleInfo-row" v-for="subtitleInfo in subtitleInfos" :key="subtitleInfo.id">
                    <td class="subtitleInfo-time">
                        <input v-model="subtitleInfo.startTimeValidated" @change="updateInput" />
                    </td>
                    <td class="subtitleInfo-time">
                        <input v-model="subtitleInfo.endTimeValidated" @change="updateInput" />
                    </td>
                    <td class="subtitleInfo-text">
                        <input v-model.lazy="subtitleInfo.text" />
                    </td>
                </tr>
            </table>
        </simplebar>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { SubtitleInfo } from '@/SubtitleInfo'
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: cannot find a type definition file for simplebar-vue
import simplebar from 'simplebar-vue'
import '@/styles/simplebar.css'

@Component({
    components: {
        simplebar
    }
})
class SubtitleInfoTable extends Vue {
    @Prop({ type: Array, required: true, default: () => [] })
    subtitleInfos!: SubtitleInfo[];

    updateInput() {
        this.$forceUpdate()
    }
}

export default SubtitleInfoTable
</script>

<style lang="scss" scoped>
.subtitleInfo-wrapper {
    display: flex;
    flex-direction: column;
    min-width: 430px;
    height: 100%;
}
.subtitleInfo-row {
    display: flex;
    flex-direction: row;
    padding: 12px 24px;
}
.subtitleInfo-header {
    width: 100%;
    background: #091620;
    color: rgba(255, 255, 255, 0.3);
}
.subtitleInfo-content {
    width: 100%;
    height: 100%;
    overflow-y: auto;
}
.subtitleInfo-time {
    margin-right: 16px;
    width: 90px;
}
.subtitleInfo-content input {
    background: transparent;
    width: 100%;
    border: none;
}
.subtitleInfo-content .subtitleInfo-time input {
    color: rgba(255, 255, 255, 0.4);
}
.subtitleInfo-content .subtitleInfo-text {
    flex-grow: 2;
}
.subtitleInfo-content .subtitleInfo-text input {
    color: rgba(255, 255, 255, 0.8);
    text-overflow: ellipsis;
}
.subtitleInfo-content .subtitleInfo-row:nth-child(2n+1) {
    background: rgba(18, 44, 63, 0.2);
}
</style>

<style>
[data-simplebar] {
    height: 100%;
}
.simplebar-scrollbar::before {
    opacity: 0.5;
}
</style>
