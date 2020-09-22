<template>
    <div class="timeline-control">
        <div class="timeline-control-background">
            <div class="timeline-control-bar" @pointerdown="barPointerDownEvent" :style="{left: leftPercent * 100 + '%', width: (rightPercent-leftPercent) * 100 + '%'}"></div>
            <div class="timeline-control-handle timeline-control-handle-left" @pointerdown="leftHandlePointerDownEvent" :style="{left: leftPercent * 100 + '%'}"></div>
            <div class="timeline-control-handle timeline-control-handle-right" @pointerdown="rightHandlePointerDownEvent" :style="{left: rightPercent * 100 + '%'}"></div>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component
export default class TimelineBar extends Vue {
    @Prop({ type: Number, default: 0 }) leftPercent!: number
    @Prop({ type: Number, default: 1 }) rightPercent!: number
    @Prop({ type: Number, default: 0 }) totalFrame!: number

    private _pointerId: number | undefined
    private _pointerDragging: 'left' | 'right' | 'bar' = 'bar'

    beforeDestroy(): void {
        /* eslint-disable @typescript-eslint/unbound-method */
        // Allow unbound method for global event listener
        document.removeEventListener('pointermove', this.pointerMoveEvent)
        document.removeEventListener('pointerup', this.pointerUpEvent)
        /* eslint-enable @typescript-eslint/unbound-method */
    }

    created(): void {
        /* eslint-disable @typescript-eslint/unbound-method */
        // Allow unbound method for global event listener
        document.addEventListener('pointermove', this.pointerMoveEvent)
        document.addEventListener('pointerup', this.pointerUpEvent)
        /* eslint-enable @typescript-eslint/unbound-method */
    }

    private _lastX = 0
    barPointerDownEvent(event: PointerEvent): void {
        if (this._pointerId === undefined) {
            event.preventDefault()
            this._pointerId = event.pointerId
            this._pointerDragging = 'bar'
            this._lastX = event.pageX
        }
    }

    leftHandlePointerDownEvent(event: PointerEvent): void {
        if (this._pointerId === undefined) {
            event.preventDefault()
            this._pointerId = event.pointerId
            this._pointerDragging = 'left'
        }
    }

    rightHandlePointerDownEvent(event: PointerEvent): void {
        if (this._pointerId === undefined) {
            event.preventDefault()
            this._pointerId = event.pointerId
            this._pointerDragging = 'right'
        }
    }

    pointerMoveEvent(event: PointerEvent): void {
        if (this._pointerId === event.pointerId) {
            event.preventDefault()
            const timeline = document.querySelector('.timeline-control')
            if (timeline !== null) {
                const timelinePos = timeline.getBoundingClientRect()
                if (this._pointerDragging === 'bar') {
                    const timelineBackground = document.querySelector('.timeline-control-background')
                    if (timelineBackground !== null) {
                        // const timelineBackgroundPos = timelineBackground.getBoundingClientRect()
                        this.$emit('move', (event.pageX - this._lastX) / timelinePos.width * this.totalFrame)
                        this._lastX = event.pageX
                    }
                } else {
                    if (this._pointerDragging === 'left') {
                        this.$emit('update:leftPercent', (event.pageX - timelinePos.left) / timelinePos.width)
                    } else {
                        this.$emit('update:rightPercent', (event.pageX - timelinePos.left) / timelinePos.width)
                    }
                }
            }
        }
    }

    pointerUpEvent(event: PointerEvent): void {
        if (this._pointerId === event.pointerId) {
            event.preventDefault()
            this._pointerId = undefined
            this._pointerDragging = 'bar'
        }
    }
}
</script>

<style lang="scss" scoped>
.timeline-control {
    height: 28px;
    display: flex;
    position: relative;
}

.timeline-control-background {
    position: absolute;
    left: 8px;
    right: 8px;
    top: 8px;
    height:8px;
    background-color: rgba($color: #091620, $alpha: 0.6);
    border-radius: 10px;
}

.timeline-control-handle {
    position: absolute;
    top: -2px;
    height:12px;
    width: 12px;
    border-radius: 50%;
    border: 2px solid rgba($color: #1C425F, $alpha: 1.0);
    background-color: #122C3F;
    cursor: pointer;
    transform: translateX(-50%);
}

.timeline-control-bar {
    background-color: #122C3F;
    position: absolute;
    height: 8px;
    width: 80px;
    left: 20px;
}
</style>
