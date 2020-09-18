<template>
    <div class="timeline-wrapper card">
        <div
            class="timeline-main"
            @wheel.alt.prevent="wheelAltEvent"
            @wheel.exact.prevent="wheelEvent"
            @pointerdown="pointerDownEvent"
        >
            <svg id="timeline-svg" :width="timelineMainWidth + 'px'" height="120px" />
            <svg id="subtitle-svg" :width="timelineMainWidth + 'px'"/>
        </div>
        <div class="timeline-control">
            <div>left: {{leftPos}}</div>
            <div>right: {{rightPos}}</div>
        </div>
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

@Component({
    components: {},
    model: {
        prop: 'currentFrame',
        event: 'change'
    }
})
export default class Timeline extends Vue {
    @Prop({ type: Boolean, default: false }) disabled!: boolean;
    @Prop({ type: Number, default: 0 }) totalFrame!: number;
    @Prop({ type: Number, default: 1 }) fps!: number;
    @Prop({ type: Number, default: 0 }) currentFrame!: number;
    @Prop({ type: Array, default: [] }) subtitleInfos!: SubtitleInfo[];

    leftPos = 0;
    rightPos = 0;
    renderTimelineDebounced: lodash.DebouncedFunc<() => void> | undefined;
    timelineMainWidth = 0;
    timelineMainHeight = 0;

    private pointerId: number | undefined;

    get length() {
        return this.rightPos - this.leftPos
    }

    set length(value) {
        this.rightPos = this.leftPos + value
    }

    beforeDestroy() {
        document.removeEventListener('pointermove', this.pointerMoveEvent)
        document.removeEventListener('pointerup', this.pointerUpEvent)
    }

    created() {
        this.length = Math.min(this.totalFrame, this.fps * 5)
        document.addEventListener('pointermove', this.pointerMoveEvent)
        document.addEventListener('pointerup', this.pointerUpEvent)
        this.renderTimelineDebounced = lodash.debounce(this.renderTimeline, 10, {
            leading: true
        })
    }

    mounted() {
        this.renderTimeline()
        const timelineMain = document.querySelector('.timeline-main')
        if (timelineMain !== null) {
            const timelineMainRect = timelineMain.getBoundingClientRect()
            this.timelineMainWidth = timelineMainRect.width
            this.timelineMainHeight = timelineMainRect.height
        }
    }

    @Watch('leftPos')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    leftPosWatch(newValue: number, oldValue: number) {
        if (this.renderTimelineDebounced !== undefined) {
            this.renderTimelineDebounced()
        }
    }

    @Watch('rightPos')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    rightPosWatch(newValue: number, oldValue: number) {
        if (this.renderTimelineDebounced !== undefined) {
            this.renderTimelineDebounced()
        }
    }

    renderTimeline() {
        d3Selection.select('#timeline-svg').selectAll('g').remove()
        d3Selection.select('#subtitle-svg').selectAll('g').remove()
        const timelineMain = document.querySelector('.timeline-main')
        if (timelineMain !== null) {
            const timelineMainRect = timelineMain.getBoundingClientRect()
            this.timelineMainWidth = timelineMainRect.width
            this.timelineMainHeight = timelineMainRect.height

            const xScale = d3Scale.scaleLinear().domain([this.leftPos, this.rightPos]).range([0, timelineMainRect.width])
            const xAxis = d3Axis.axisBottom(xScale).ticks(5).tickFormat((f) => FrameToTime(f as number, this.fps))

            d3Selection.select('#timeline-svg').append('g').attr('class', 'timeline-axis').call(xAxis).attr('text-anchor', 'left')
            d3Selection.select('#timeline-svg').select('.timeline-axis').selectAll('g').selectAll('line').attr('y2', '12px')

            const xAxisLines = d3Axis.axisBottom(xScale).ticks(30)
            d3Selection.select('#timeline-svg').append('g').attr('class', 'timeline-axis-lines').call(xAxisLines)
            d3Selection.select('#timeline-svg').select('.timeline-axis-lines').selectAll('g').selectAll('line').attr('y2', '10px')

            const currentSubs = this.subtitleInfos.filter((t) => t.endFrame >= this.leftPos && t.startFrame <= this.rightPos)
            const subtitleSvg = d3Selection.select('#subtitle-svg').selectAll('g').data(currentSubs).enter().append('g').attr('transform', t => 'translate(' + xScale(t.startFrame) + ',' + '25' + ')')

            subtitleSvg.append('rect').attr('class', 'subtitle-rect')
                .attr('width', t => xScale(t.endFrame) - xScale(t.startFrame)).attr('height', '100').attr('rx', '4')

            const subtitleFo = subtitleSvg.append('foreignObject').attr('class', 'subtitle-text-object').attr('width', t => xScale(t.endFrame) - xScale(t.startFrame)).attr('height', '100')
            const subtitleDiv = subtitleFo.append('xhtml:div').attr('class', 'subtitle-text-wrapper')
            subtitleDiv.append('p').attr('class', 'subtitle-text').html(t => { if (t.text !== undefined) { return t.text } return '' })
        }
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

        const timeline = document.querySelector('.timeline')
        if (timeline !== null) {
            const timelinePos = timeline.getBoundingClientRect()
            let percent = 0
            if (event.pageX - timelinePos.left < 0) {
                percent = 0
            } else if (event.pageX - timelinePos.right > 0) {
                percent = 1
            } else {
                percent =
          (event.pageX - timelinePos.left) /
          (timelinePos.right - timelinePos.left)
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

    pointerDownEvent(event: PointerEvent) {
        if (!this.disabled && this.pointerId === undefined) {
            event.preventDefault()
            this.pointerId = event.pointerId
        }
    }

    pointerMoveEvent(event: PointerEvent) {
        if (this.pointerId === event.pointerId) {
            event.preventDefault()
            if (lodash.toSafeInteger(event.movementX) !== 0) {
                this.move(-event.movementX * 0.1)
            }
        }
    }

    pointerUpEvent(event: PointerEvent) {
        if (this.pointerId === event.pointerId) {
            event.preventDefault()
            this.pointerId = undefined
        }
    }

    scale(delta: number, centerPercent: number) {
        this.leftPos = Math.max(0, this.leftPos * (1 - delta * centerPercent))
        this.rightPos = Math.min(
            this.rightPos * (1 + delta * (1 - centerPercent)),
            this.totalFrame
        )
        if (this.rightPos - this.leftPos > 5 * 60 * this.fps) {
            this.length = 5 * 60 * this.fps
        }
        if (this.rightPos - this.leftPos > 1 * this.fps) {
            this.length = 5 * 60 * this.fps
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
}
.timeline-control {
    height: 28px;
    display: flex;
}

#subtitle-svg {
    margin: 0;
    position: absolute;
    top: 50%;
    left: 0;
    transform: translateY(-50%);
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
    fill: #0D1F2D;
    stroke: #25587E;
    stroke-linecap: round;
    stroke-width: 2px;
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
    background-color: transparent
}
</style>
