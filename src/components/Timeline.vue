<template>
    <div class="timeline-warpper">
        <div class="timeline" @wheel.alt.prevent="wheelAltEvent" @wheel.exact.prevent="wheelEvent" @pointerdown="pointerDownEvent"></div>
        <div>
            <div>left: {{leftPos}}</div>
            <div>right: {{rightPos}}</div>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import lodash from 'lodash'

@Component({
    components: { },
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

    leftPos = 0
    rightPos = 0

    private pointerId: number | undefined

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
        delta = 0.01 * delta

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
            this.move(event.movementX)
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
        this.rightPos = Math.min(this.rightPos * (1 + delta * (1 - centerPercent)), this.totalFrame)
        if (this.rightPos - this.leftPos < 5 * 60 * this.fps) {
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
.timeline-warpper {
    width: 100%;
    height: 50%;
}
.timeline {
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.2);
}
</style>
