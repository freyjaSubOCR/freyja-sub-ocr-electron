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
                <transition-group name="line" tag="p">
                    <tr :class="{ 'subtitleInfo-row': true, 'subtitleInfo-row-merge-highlight': selectStart === index || selectStart <= index && index <= selectEnd, 'active': subtitleInfo.startFrame <= currentFrame && currentFrame < subtitleInfo.endFrame }"
                        v-for="subtitleInfo, index in subtitleInfos" :key="subtitleInfo.id" @pointerenter="setSelectEnd(index)"
                        @click="setCurrentFrame((subtitleInfo.endFrame - subtitleInfo.startFrame) / 2 + subtitleInfo.startFrame)">
                        <td class="subtitleInfo-time">
                            <input v-model="subtitleInfo.startTimeValidated" @change="updateInput" />
                        </td>
                        <td class="subtitleInfo-time">
                            <input v-model="subtitleInfo.endTimeValidated" @change="updateInput" />
                        </td>
                        <td class="subtitleInfo-text">
                            <input :title="subtitleInfo.text" v-model="subtitleInfo.text" placeholder="Enter subtitle here" />
                        </td>
                        <div class="subtitleInfo-buttons">
                            <button @click="addSubtitle(index)" title="Add">
                                <img src="@/assets/subtitle-add.svg" alt />
                            </button>
                            <button @click="removeSubtitle(index)" title="Remove">
                                <img src="@/assets/subtitle-delete.svg" alt />
                            </button>
                            <button @click="setCurrentFrame((subtitleInfo.endFrame - subtitleInfo.startFrame) / 2 + subtitleInfo.startFrame)" title="Jump">
                                <img src="@/assets/subtitle-locate.svg" alt />
                            </button>
                            <button @click="selectStart = index; selectEnd = index;" v-if="selectStart === -1" title="Merge">
                                <img src="@/assets/subtitle-merge-start.svg" alt />
                            </button>
                            <button @click="selectStart = -1; selectEnd = -1" v-else-if="selectStart === index" title="Cancel Merge">
                                <img src="@/assets/subtitle-merge-start.svg" alt />
                            </button>
                            <button @click="mergeSubtitles" v-else-if="index > selectStart" title="Merge">
                                <img src="@/assets/subtitle-merge-end.svg" alt />
                            </button>
                        </div>
                    </tr>
                </transition-group>
            </table>
        </simplebar>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { SubtitleInfo } from '@/SubtitleInfo'
// no simplebar-vue type definition
// @ts-expect-error: cannot find a type definition file for simplebar-vue
import simplebar from 'simplebar-vue'
import '@/styles/simplebar.css'

@Component({
    components: {
        // no simplebar-vue type definition
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        simplebar
    },
    model: {
        prop: 'currentFrame',
        event: 'change'
    }
})
class SubtitleInfoTable extends Vue {
    @Prop({ type: Array, required: true, default: () => [] }) subtitleInfos!: Array<SubtitleInfo>
    @Prop(Number) currentFrame!: number

    selectStart = -1
    selectEnd = -1
    subtitleInfosUndo: Array<Array<SubtitleInfo>> = []
    subtitleInfosRedo: Array<Array<SubtitleInfo>> = []

    created(): void {
        /* eslint-disable @typescript-eslint/unbound-method */
        // Allow unbound method for global event listener
        window.addEventListener('keyup', this.undo)
        window.addEventListener('keyup', this.redo)
        /* eslint-enable @typescript-eslint/unbound-method */
    }

    beforeDestory(): void {
        /* eslint-disable @typescript-eslint/unbound-method */
        // Allow unbound method for global event listener
        window.removeEventListener('keyup', this.undo)
        window.removeEventListener('keyup', this.redo)
        /* eslint-enable @typescript-eslint/unbound-method */
    }

    updateInput(): void {
        this.$emit('update:subtitleInfos', this.subtitleInfos.sort((a, b) => a.startFrame - b.startFrame))
        this.$forceUpdate()
    }

    setCurrentFrame(frame: number): void {
        this.$emit('change', frame)
    }

    setSelectEnd(index: number): void {
        if (this.selectStart !== -1) {
            this.selectEnd = index
        }
    }

    addSubtitle(index: number): void {
        this.subtitleInfosRedo = []
        this.subtitleInfosUndo.push(this.subtitleInfos.slice())
        const subtitleInfo = new SubtitleInfo(this.subtitleInfos[index])
        if (this.subtitleInfos[index].fps === undefined) {
            throw new Error('cannot get fps from other subtitles')
        }
        subtitleInfo.startFrame = subtitleInfo.endFrame
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        subtitleInfo.generateTime(this.subtitleInfos[index].fps!)
        subtitleInfo.text = ''
        this.subtitleInfos.splice(index, 0, subtitleInfo)
        this.updateInput()
    }

    removeSubtitle(index: number): void {
        this.subtitleInfosRedo = []
        this.subtitleInfosUndo.push(this.subtitleInfos.slice())
        this.subtitleInfos.splice(index, 1)
        this.updateInput()
    }

    mergeSubtitles(): void {
        if (this.selectStart === -1 || this.selectEnd === -1 || this.selectStart >= this.selectEnd) {
            return
        }
        this.subtitleInfosRedo = []
        this.subtitleInfosUndo.push(this.subtitleInfos.slice())
        this.subtitleInfos[this.selectStart].endFrame = this.subtitleInfos[this.selectEnd].endFrame
        this.subtitleInfos.splice(this.selectStart + 1, this.selectEnd - this.selectStart)
        this.selectStart = -1
        this.selectEnd = -1
        this.updateInput()
    }

    undo(event: KeyboardEvent): void {
        if (event.ctrlKey && event.key === 'z') {
            if (this.subtitleInfosUndo.length !== 0) {
                this.subtitleInfosRedo.push(this.subtitleInfos.slice())
                this.subtitleInfos = this.subtitleInfosUndo.pop() as Array<SubtitleInfo>
                this.updateInput()
            }
        }
    }

    redo(event: KeyboardEvent): void {
        if (event.ctrlKey && event.key === 'y') {
            if (this.subtitleInfosRedo.length !== 0) {
                this.subtitleInfosUndo.push(this.subtitleInfos.slice())
                this.subtitleInfos = this.subtitleInfosRedo.pop() as Array<SubtitleInfo>
                this.updateInput()
            }
        }
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
    margin-bottom: 16px;
    position: relative;
}

.subtitleInfo-row {
    display: flex;
    flex-direction: row;
    padding: 12px 24px;
    cursor: default;
    min-height: 48px;
    position: relative;
    transition: all 0.2s;

    &:nth-child(2n+1) {
        background: rgba(18, 44, 63, 0.2);
    }
}

.subtitleInfo-content .subtitleInfo-row {
    &:hover {
        background-color: #1c425f;
    }

    &.active {
        background-color: rgba($color: #18a2b4, $alpha: 0.8);
        // background-color: rgba(255, 255, 128, 0.8);
    }
}

.subtitleInfo-row-merge-highlight {
    background-color: #133047 !important;
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

.subtitleInfo-content .subtitleInfo-text {
    flex-grow: 2;
    display: flex;
}

.subtitleInfo-header .subtitleInfo-row .subtitleInfo-text {
    margin: auto 0;
}

.subtitleInfo-time {
    margin: auto 16px auto 0;
    width: 90px;
}

.subtitleInfo-content input {
    background: transparent;
    border: none;
    width: 100%;
}

.subtitleInfo-content .subtitleInfo-time input {
    color: rgba(255, 255, 255, 0.4);
}

.subtitleInfo-content .subtitleInfo-text input {
    color: rgba(255, 255, 255, 0.8);
    text-overflow: ellipsis;
    flex-grow: 1;

    &::placeholder {
        opacity: 0.5;
    }
}

.subtitleInfo-buttons {
    display: none;
    position: absolute;
    bottom: -14px;
    right: 16px;
    background: #1c425f;
    border: 1px solid rgba(0, 0, 0, 0.37);
    border-radius: 4px;
    padding: 2px 4px;
    z-index: 10;
}

.subtitleInfo-buttons button {
    border: transparent;
    border-radius: 2px;
    display: flex;
    background-color: transparent;
    padding: 3px 4px;

    img {
        width: 16px;
        height: 16px;
        margin: auto;
    }

    transition: 0.2s all;
    cursor: pointer;
}

.subtitleInfo-buttons button:hover {
    background: #ffffff20;
    border: #ffffff20;
}

.subtitleInfo-content .subtitleInfo-row:hover .subtitleInfo-buttons {
    display: flex;
}

.subtitleInfo-content .subtitleInfo-text input:focus + .subtitleInfo-buttons {
    display: none;
}

.line-enter-active,
.line-leave-active {
    transition: all 0.2s;
}

.line-enter {
    opacity: 0;
    transform: translate(0, -8px);
}

.line-leave-to {
    opacity: 0;
    transform: translate(0, -8px);
}

.line-leave-active {
    position: absolute;
}

</style>

<style>
[data-simplebar] {
    position: absolute;
    top: 48px;
    bottom: 0;
    left: 0;
    right: 0;
}

.simplebar-scrollbar::before {
    opacity: 0.5;
}

</style>
