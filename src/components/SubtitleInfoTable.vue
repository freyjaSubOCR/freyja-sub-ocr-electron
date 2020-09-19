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
                <tr :class="{ 'subtitleInfo-row': true, 'subtitleInfo-row-merge-highlight': selectStart === index || selectStart <= index && index <= selectEnd, 'active': subtitleInfo.startFrame <= currentFrame && currentFrame < subtitleInfo.endFrame }"
                    v-for="subtitleInfo, index in subtitleInfos" :key="subtitleInfo.id" @pointerenter="setSelectEnd(index)">
                    <td class="subtitleInfo-time">
                        <input v-model="subtitleInfo.startTimeValidated" @change="updateInput" />
                    </td>
                    <td class="subtitleInfo-time">
                        <input v-model="subtitleInfo.endTimeValidated" @change="updateInput" />
                    </td>
                    <td class="subtitleInfo-text">
                        <input v-model="subtitleInfo.text" />
                        <div class="subtitleInfo-buttons">
                            <button @click="setCurrentFrame(subtitleInfo.startFrame)">
                                <img src="@/assets/subtitle-locate.svg" alt />
                            </button>
                            <button @click="selectStart = index; selectEnd = index;" v-if="selectStart === -1">
                                <img src="@/assets/subtitle-merge-start.svg" alt />
                            </button>
                            <button @click="selectStart = -1; selectEnd = -1" v-else-if="selectStart === index">
                                <img src="@/assets/subtitle-merge-start.svg" alt />
                            </button>
                            <button @click="merge" v-else-if="index > selectStart">
                                <img src="@/assets/subtitle-merge-end.svg" alt />
                            </button>
                        </div>
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

    selectStart = -1
    selectEnd = -1

    updateInput() {
        this.$emit('update:subtitleInfos', this.subtitleInfos.sort((a, b) => a.startFrame - b.startFrame))
        this.$forceUpdate()
    }

    setCurrentFrame(frame: number) {
        this.$emit('change', frame)
    }

    setSelectEnd(index: number) {
        if (this.selectStart !== -1) {
            this.selectEnd = index
        }
    }

    merge() {
        if (this.selectStart === -1 || this.selectEnd === -1 || this.selectStart >= this.selectEnd) {
            return
        }
        this.subtitleInfos[this.selectStart].endFrame = this.subtitleInfos[this.selectEnd].endFrame
        this.subtitleInfos.splice(this.selectStart + 1, this.selectEnd - this.selectStart)
        this.selectStart = -1
        this.selectEnd = -1
        this.updateInput()
    }
}

export default SubtitleInfoTable
</script>

<style lang="scss" scoped>
.subtitleInfo-wrapper {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    width: 100%;
}
.subtitleInfo-row {
    display: flex;
    flex-direction: row;
    padding: 12px 24px;
    cursor: default;

    &:nth-child(2n+1) {
        background: rgba(18, 44, 63, 0.2);
    }
}
.subtitleInfo-content .subtitleInfo-row {
    &:hover {
        background-color: #1C425F;
    }

    &.active {
        background-color: rgba($color: #18a2b4, $alpha: .8);
        // background-color: rgba(255, 255, 128, 0.8);
    }
}

.subtitleInfo-row-merge-highlight {
    background-color: #133047!important;
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
    display: flex;
}
.subtitleInfo-content .subtitleInfo-text input {
    color: rgba(255, 255, 255, 0.8);
    text-overflow: ellipsis;
    flex-grow: 1;
}

.subtitleInfo-content .subtitleInfo-text input:focus + .subtitleInfo-buttons{
    display: none;
}

.subtitleInfo-buttons {
    display: none;
}

.subtitleInfo-buttons button {
    border: transparent;
    border-radius: 2px;
    padding: 2px 6px;
    display: flex;
    background-color: rgba($color: #fff, $alpha: 0.6);
    margin-left: 12px;
    img {
        margin: auto;
    }
    cursor: pointer;
}

.subtitleInfo-content .subtitleInfo-row:hover .subtitleInfo-buttons {
    display: flex;
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
