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
                <tr :class="{ 'subtitleInfo-row': true, 'active': subtitleInfo.startFrame <= currentFrame && currentFrame < subtitleInfo.endFrame }" v-for="subtitleInfo in subtitleInfos" :key="subtitleInfo.id" :data-key="subtitleInfo.id">
                    <td class="subtitleInfo-time">
                        <input v-model="subtitleInfo.startTimeValidated" @change="updateInput" />
                    </td>
                    <td class="subtitleInfo-time">
                        <input v-model="subtitleInfo.endTimeValidated" @change="updateInput" />
                    </td>
                    <td class="subtitleInfo-text">
                        <input v-model="subtitleInfo.text" />
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
    },
    model: {
        prop: 'currentFrame',
        event: 'change'
    }
})
class SubtitleInfoTable extends Vue {
    @Prop({ type: Array, required: true, default: () => [] }) subtitleInfos!: SubtitleInfo[]
    @Prop(Number) currentFrame!: number

    updateInput() {
        this.$emit('update:subtitleInfos', this.subtitleInfos.sort((a, b) => a.startFrame - b.startFrame))
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
    width: 50%;
    margin: 40px 16px 40px 40px;
}
.subtitleInfo-row {
    display: flex;
    flex-direction: row;
    padding: 12px 24px;

    &:nth-child(2n+1) {
        background: rgba(18, 44, 63, 0.2);
    }

    &:hover {
        background-color: rgba(255, 255, 255, 0.8);
    }

    &.active {
        background-color: rgba(255, 255, 128, 0.8);
    }
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
    margin: 0 0 50px;
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
</style>

<style>
[data-simplebar] {
    height: 100%;
}
.simplebar-scrollbar::before {
    opacity: 0.5;
}

.simplebar-scrollbar {
margin-bottom: 50px;
}
</style>
