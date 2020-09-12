<template>
    <div class="video-bar" @pointerdown="pointerDown" @pointermove="pointerMoveTooltip">
        <div class="video-bar-current" :style="{width: percent * 100 + '%'}">
            <div class="video-bar-tooltip">{{currentTime}}</div>
            <div class="video-bar-handle"></div>
        </div>
        <div class="video-bar-placeholder"></div>
    </div>

</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { FrameToTime } from '@/Utils'
@Component({
    model: {
        prop: 'percent',
        event: 'change'
    }
})
export default class VideoBar extends Vue {
    @Prop(Number) percent: number | undefined
    @Prop(Boolean) disabled: boolean | undefined
    @Prop(Number) totalFrame: number | undefined
    @Prop(Number) fps: number | undefined
    percentCurrent = 0

    private pointerId: number | undefined

    created() {
        document.addEventListener('pointermove', this.pointerMove)
        document.addEventListener('pointerup', this.pointerUp)
    }

    beforeDestroy() {
        document.removeEventListener('pointermove', this.pointerMove)
        document.removeEventListener('pointerup', this.pointerUp)
    }

    get currentTime(): string {
        if (this.totalFrame !== undefined && this.fps !== undefined) {
            return FrameToTime(this.percentCurrent * this.totalFrame, this.fps)
        }
        return ''
    }

    updatePos(event: PointerEvent) {
        const videoBarDOM = document.querySelector('.video-bar')
        if (videoBarDOM !== null) {
            const videoBarPos = videoBarDOM.getBoundingClientRect()
            let percent = 0
            if (event.pageX - videoBarPos.left < 0) {
                percent = 0
            } else if (event.pageX - videoBarPos.right > 0) {
                percent = 1
            } else {
                percent = (event.pageX - videoBarPos.left) / (videoBarPos.right - videoBarPos.left)
            }
            this.$emit('change', percent)
        }
    }

    pointerDown(event: PointerEvent) {
        if (!this.disabled && this.pointerId === undefined) {
            event.preventDefault()
            this.pointerId = event.pointerId
            const videoBarDOM = document.querySelector('.video-bar-handle')
            const videoBarTipDOM = document.querySelector('.video-bar-tooltip')
            if (videoBarDOM !== null) {
                videoBarDOM.classList.add('video-bar-handle-active')
            }
            if (videoBarTipDOM !== null) {
                videoBarTipDOM.classList.add('video-bar-tooltip-active')
            }
            this.updatePos(event)
        }
    }

    pointerMove(event: PointerEvent) {
        if (this.pointerId === event.pointerId) {
            event.preventDefault()
            this.updatePos(event)
            this.pointerMoveTooltip(event)
        }
    }

    pointerUp(event: PointerEvent) {
        if (this.pointerId === event.pointerId) {
            event.preventDefault()
            this.pointerId = undefined
            const videoBarDOM = document.querySelector('.video-bar-handle')
            const videoBarTipDOM = document.querySelector('.video-bar-tooltip')
            if (videoBarDOM !== null) {
                videoBarDOM.classList.remove('video-bar-handle-active')
            }
            if (videoBarTipDOM !== null) {
                videoBarTipDOM.classList.remove('video-bar-tooltip-active')
            }
        }
    }

    pointerMoveTooltip(event: PointerEvent) {
        const videoBarDOM = document.querySelector('.video-bar')
        const videoBarTooltip = document.querySelector('.video-bar-tooltip') as HTMLElement | null
        if (videoBarDOM !== null && videoBarTooltip !== null) {
            const videoBarPos = videoBarDOM.getBoundingClientRect()
            if (event.pageX - videoBarPos.left < 0) {
                this.percentCurrent = 0
                videoBarTooltip.style.left = '40px'
            } else if (event.pageX - videoBarPos.right > 0) {
                this.percentCurrent = 1
                videoBarTooltip.style.left = (videoBarPos.right - videoBarPos.left - 40).toString() + 'px'
            } else {
                if (event.pageX - videoBarPos.left < 40) {
                    videoBarTooltip.style.left = '40px'
                } else if (event.pageX - videoBarPos.right > -40) {
                    videoBarTooltip.style.left = (videoBarPos.right - videoBarPos.left - 40).toString() + 'px'
                } else {
                    videoBarTooltip.style.left = ((event.pageX - videoBarPos.left)).toString() + 'px'
                }
                this.percentCurrent = (event.pageX - videoBarPos.left) / (videoBarPos.right - videoBarPos.left)
            }
        }
    }
}
</script>

<style lang="scss" scoped>

.video-bar {
    border-radius: 10px;
    width: 100%;
    height: 4px;
    cursor: pointer;
    position: relative;
    background: rgba(255, 255, 255, 0.1);
}

.video-bar-current {
    height:4px;
    background: #18A1B4;
    position: relative;
}

.video-bar-handle {
    content: "";
    width: 0px;
    height: 0px;
    background: white;
    position: absolute;
    right: 0px;
    border-radius: 50%;
    transform: translate(50%, -25%);
    opacity: 0;
    transition: 0.3s all;
}

.video-bar-handle-active {
    opacity: 1;
    width: 10px;
    height: 10px;
}

.video-bar:hover .video-bar-handle {
    opacity: 1;
    width: 10px;
    height: 10px;
}

.video-bar-tooltip {
    font-size: 12px;
    font-weight: 500;
    line-height: 12px;
    position: absolute;
    top: 0;
    transform: translate(-50%, -24px);
    color: white;
    text-shadow: 0 1px 8px #000000ff;
    opacity: 0;
    transition: opacity 0.3s;
}

.video-bar:hover .video-bar-tooltip {
    opacity: 1;
}

.video-bar-tooltip-active {
    opacity: 1;
}

.video-bar-placeholder {
    position: absolute;
    width:100%;
    height: 16px;
    transform: translateY(-50%);
    left:0;
}

</style>
