<template>
    <div class="timeline-wrapper card">
        <div class="timeline-main grabbable" @wheel.alt.prevent="wheelAltEvent" @wheel.exact.prevent="wheelEvent" @pointermove="pointerLocalMoveEvent" @pointerdown="pointerDownEvent">
            <svg id="timeline-svg" :width="timelineMainWidth + 'px'" height="20px" />
            <svg id="current-svg" :width="timelineMainWidth + 'px'" height="100%">
                <g :transform="'translate(' + this.xScale(currentFrame) + ', 0)'">
                    <line class="current-line" x1="0" x2="0" y1="20" y2="500"></line>
                    <text class="current-time-text">{{frameToTime(currentFrame, fps)}}</text>
                </g>
            </svg>
            <svg id="current-pointer-svg" :width="timelineMainWidth + 'px'" height="100%">
                <g :transform="'translate(' + this.timelinePointerX + ', 0)'">
                    <line class="current-line" x1="0" x2="0" y1="20" y2="500"></line>
                    <text class="current-time-text">{{frameToTime(this.xScale.invert(Math.floor(this.timelinePointerX)), fps)}}</text>
                </g>
            </svg>
            <svg id="subtitle-svg" :width="timelineMainWidth + 'px'">
                <g v-for="subtitleInfo in subtitleInfos" :key="subtitleInfo.id" :transform="'translate(' + xScale(subtitleInfo.startFrame) + ', 25)'">
                    <rect :class="{'subtitle-rect': true, 'subtitle-rect-active': subtitleInfo.endFrame > currentFrame && currentFrame >= subtitleInfo.startFrame}"
                          :width="xScale(subtitleInfo.endFrame) - xScale(subtitleInfo.startFrame)" height="100" rx="4"></rect>
                    <foreignObject class="subtitle-text-object" :width="xScale(subtitleInfo.endFrame) - xScale(subtitleInfo.startFrame)" height="100">
                        <xhtml:div class="subtitle-text-wrapper">
                            <p :class="{'subtitle-text': true, 'subtitle-text-active': subtitleInfo.endFrame > currentFrame && currentFrame >= subtitleInfo.startFrame}"
                               @pointerdown.stop="">
                                <EditableDiv v-model="subtitleInfo.text" />
                            </p>
                        </xhtml:div>
                    </foreignObject>
                </g>
            </svg>
        </div>
        <TimelineBar :totalFrame="totalFrame" :leftPercent.sync="leftPercent" :rightPercent.sync="rightPercent" @move="move" />
    </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import lodash from 'lodash'
import * as d3Scale from 'd3-scale'
import * as d3Selection from 'd3-selection'
import * as d3Axis from 'd3-axis'
import { SubtitleInfo } from '@/SubtitleInfo'
import { FrameToTime } from '@/Utils'
import EditableDiv from '@/components/EditableDiv.vue'
import TimelineBar from '@/components/TimelineBar.vue'

@Component({
    components: { EditableDiv, TimelineBar },
    model: {
        prop: 'currentFrame',
        event: 'change'
    }
})
export default class Timeline extends Vue {
    @Prop({ type: Boolean, default: false }) disabled!: boolean
    @Prop({ type: Number, default: 0 }) totalFrame!: number
    @Prop({ type: Number, default: 1 }) fps!: number
    @Prop({ type: Number, default: 0 }) currentFrame!: number
    @Prop({ type: Array, default: [] }) subtitleInfos!: SubtitleInfo[]

    leftPos = 0
    rightPos = 0
    timelineMainWidth = 0
    timelineMainHeight = 0
    timelinePointerX = 0

    private _pointerPos = -1
    private _pointerId: number | undefined

    get length() {
        return this.rightPos - this.leftPos
    }

    set length(value) {
        this.rightPos = this.leftPos + value
    }

    get xScale() {
        return d3Scale.scaleLinear().domain([this.leftPos, this.rightPos]).range([0, this.timelineMainWidth])
    }

    get currentSubtitles() {
        return this.subtitleInfos.filter((t) => t.endFrame >= this.leftPos && t.startFrame <= this.rightPos)
    }

    get leftPercent() {
        return this.leftPos / this.totalFrame
    }

    set leftPercent(value) {
        this.leftPos = Math.min(1, Math.max(0, value)) * this.totalFrame
        if (this.rightPos - this.leftPos > 5 * 60 * this.fps) {
            // this.length = 5 * 60 * this.fps
        } else if (this.rightPos - this.leftPos < 1 * this.fps) {
            this.leftPos = this.rightPos - 1 * this.fps
        }
    }

    get rightPercent() {
        return this.rightPos / this.totalFrame
    }

    set rightPercent(value) {
        this.rightPos = Math.min(1, Math.max(0, value)) * this.totalFrame
        if (this.rightPos - this.leftPos > 5 * 60 * this.fps) {
            // this.length = 5 * 60 * this.fps
        } else if (this.rightPos - this.leftPos < 1 * this.fps) {
            this.length = 1 * this.fps
        }
    }

    beforeDestroy() {
        document.removeEventListener('pointermove', this.pointerMoveEvent)
        document.removeEventListener('pointerup', this.pointerUpEvent)
        window.removeEventListener('resize', this.updateTimelineSize)
    }

    created() {
        this.length = Math.min(this.totalFrame, this.fps * 5)
        document.addEventListener('pointermove', this.pointerMoveEvent)
        document.addEventListener('pointerup', this.pointerUpEvent)
        window.addEventListener('resize', this.updateTimelineSize)
    }

    mounted() {
        this.updateTimelineSize()
    }

    @Watch('leftPos')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    leftPosWatch(newValue: number, oldValue: number) {
        this.renderTimeline()
    }

    @Watch('rightPos')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    rightPosWatch(newValue: number, oldValue: number) {
        this.renderTimeline()
    }

    @Watch('currentFrame')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    currentFrameWatch(newValue: number, oldValue: number) {
        if (this.leftPos > this.currentFrame || this.rightPos < this.currentFrame) {
            const middle = (this.rightPos - this.leftPos) / 2 + this.leftPos
            this.move(this.currentFrame - middle)
        }
    }

    frameToTime(frame: number, fps: number) {
        return FrameToTime(frame, fps)
    }

    updateTimelineSize() {
        const timelineMain = document.querySelector('.timeline-main')
        if (timelineMain !== null) {
            const timelineMainRect = timelineMain.getBoundingClientRect()
            this.timelineMainWidth = timelineMainRect.width
            this.timelineMainHeight = timelineMainRect.height
        }
    }

    renderTimeline() {
        d3Selection.select('#timeline-svg').selectAll('g').remove()

        const xAxis = d3Axis.axisBottom(this.xScale).ticks(5).tickFormat((f) => FrameToTime(f as number, this.fps))
        d3Selection.select('#timeline-svg').append('g').attr('class', 'timeline-axis').call(xAxis).attr('text-anchor', 'left')
        d3Selection.select('#timeline-svg').select('.timeline-axis').selectAll('g').selectAll('line').attr('y2', '12px')

        const xAxisLines = d3Axis.axisBottom(this.xScale).ticks(30)
        d3Selection.select('#timeline-svg').append('g').attr('class', 'timeline-axis-lines').call(xAxisLines)
        d3Selection.select('#timeline-svg').select('.timeline-axis-lines').selectAll('g').selectAll('line').attr('y2', '10px')
    }

    wheelAltEvent(event: WheelEvent) {
        let delta = 0
        if (lodash.toSafeInteger(event.deltaX) !== 0) {
            delta = event.deltaX
        } else if (lodash.toSafeInteger(event.deltaY) !== 0) {
            delta = event.deltaY
        } else if (lodash.toSafeInteger(event.deltaZ) !== 0) {
            delta = event.deltaZ
        }
        delta = 0.001 * delta

        const timeline = document.querySelector('.timeline-main')
        if (timeline !== null) {
            const timelinePos = timeline.getBoundingClientRect()
            let percent = 0
            if (event.pageX - timelinePos.left < 0) {
                percent = 0
            } else if (event.pageX - timelinePos.right > 0) {
                percent = 1
            } else {
                percent = (event.pageX - timelinePos.left) / (timelinePos.right - timelinePos.left)
            }
            this.scale(delta, percent)
        } else {
            this.scale(delta, 0.5)
        }
    }

    wheelEvent(event: WheelEvent) {
        let delta = 0
        if (lodash.toSafeInteger(event.deltaX) !== 0) {
            delta = event.deltaX
        } else if (lodash.toSafeInteger(event.deltaY) !== 0) {
            delta = event.deltaY
        } else if (lodash.toSafeInteger(event.deltaZ) !== 0) {
            delta = event.deltaZ
        }
        delta = 0.05 * delta

        this.move(delta)
    }

    private _lastX = 0
    pointerDownEvent(event: PointerEvent) {
        if (!this.disabled && this._pointerId === undefined) {
            event.preventDefault()
            this._pointerId = event.pointerId
            this._pointerPos = event.pageX
            this._lastX = event.pageX
        }
    }

    pointerMoveEvent(event: PointerEvent) {
        if (this._pointerId === event.pointerId) {
            event.preventDefault()
            this.move((this._lastX - event.pageX) / this.timelineMainWidth * this.length)
            this._lastX = event.pageX
        }
    }

    pointerUpEvent(event: PointerEvent) {
        if (this._pointerId === event.pointerId) {
            event.preventDefault()
            this._pointerId = undefined
            if (this._pointerPos === event.pageX) {
                this.$emit('change', Math.min(this.totalFrame, Math.max(0, this.xScale.invert(Math.floor(this.timelinePointerX)))))
            }
        }
    }

    pointerLocalMoveEvent(event: PointerEvent) {
        const timeline = document.querySelector('.timeline-main')
        if (timeline !== null) {
            const timelinePos = timeline.getBoundingClientRect()
            this.timelinePointerX = event.pageX - timelinePos.left
        }
    }

    scale(delta: number, centerPercent: number) {
        this.leftPos = Math.max(0, this.leftPos * (1 - delta * centerPercent))
        this.rightPos = Math.min(
            this.rightPos * (1 + delta * (1 - centerPercent)),
            this.totalFrame
        )
        if (this.rightPos - this.leftPos > 5 * 60 * this.fps) {
            // this.length = 5 * 60 * this.fps
        } else if (this.rightPos - this.leftPos < 1 * this.fps) {
            this.length = 1 * this.fps
        }
    }

    move(delta: number) {
        if (this.leftPos + delta < 0) {
            const length = this.length
            this.leftPos = 0
            this.rightPos = length
        } else if (this.rightPos + delta > this.totalFrame) {
            const length = this.length
            this.leftPos = this.totalFrame - length
            this.rightPos = this.totalFrame
        } else {
            this.leftPos += delta
            this.rightPos += delta
        }
    }
}
</script>

<style lang="scss" scoped>
.timeline-wrapper {
    flex-grow: 1;
    width: 100%;
    min-height: 150px;
    display: flex;
    flex-direction: column;
}

.timeline-main {
    width: 100%;
    min-height: 150px;
    background-color: #091620;
    flex-grow: 1;
    position: relative;

    &:hover #current-pointer-svg {
        opacity: 0.6;
    }
}

.grabbable {
    cursor: grab;
    &:active {
        cursor: grabbing;
    }
}

#subtitle-svg {
    margin: 10px 0 0;
    position: absolute;
    top: 50%;
    left: 0;
    transform: translateY(-50%);
}

#current-svg, #current-pointer-svg {
    position: absolute;
    top: 0;
    left: 0;
}

#current-pointer-svg{
    opacity: 0;
    transition: 0.1s all;
}
</style>
<style lang="scss">
.timeline-axis {
    transform: translate(0, 8px);
}

.timeline-axis-lines {
    transform: translate(0, 9px);
}

.timeline-axis path,
.timeline-axis-lines path {
    display: none;
}

.timeline-axis text {
    fill: rgba($color: #fff, $alpha: 0.4);
    transform: translate(4px, -6px);
    opacity: 1;
}

.timeline-axis-lines text {
    display: none;
}

.timeline-axis line,
.timeline-axis-lines line {
    stroke-linecap: round;
    stroke-width: 1px;
}
.timeline-axis line {
    stroke: rgba($color: #fff, $alpha: 0.24);
}
.timeline-axis-lines line {
    stroke: rgba($color: #fff, $alpha: 0.16);
}

.subtitle-rect {
    fill: rgba(#44ADFF, 0.06);
    stroke: transparent;
    stroke-linecap: round;
    stroke-width: 2px;
}

.subtitle-rect-active {
    stroke: #25587E;
}

.subtitle-text-object {
    display: flex;
}

.subtitle-text-wrapper {
    width:100%;
    height:100%;
    display: flex;
}

.subtitle-text {
    padding: 0 16px;
    margin: auto;
    font-size: 14px;
    color: rgba(#fff, 0.6);
    background-color: transparent;
    cursor: text;
    overflow-wrap: break-word;
    max-width: 100%;
    opacity: 0.25;
}

.subtitle-text-active {
    opacity: 1;
}

.current-line {
    stroke:#18A1B4;
    stroke-width:1;
}

.current-time-text {
    transform: translate(4px, 34px);
    fill:#18A1B4;
    font-size: 10px;
}
</style>
