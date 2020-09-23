<template>
    <div class="titlebar-wrapper">
        <div class="titlebar">
            <div class="titlebar-title noselect">Freyja</div>
            <div class="titlebar-button">
                <button class="minimize noselect" @click="minimize">
                    <img src="@/assets/titlebar-minimize.svg" alt />
                </button>
                <button class="unmaximize noselect" @click="unmaximize" v-if="maximized">
                    <img src="@/assets/titlebar-unmaximize.svg" alt />
                </button>
                <button class="maximize noselect" @click="maximize" v-else>
                    <img src="@/assets/titlebar-maximize.svg" alt />
                </button>
                <button class="close noselect" @click="close">
                    <img src="@/assets/titlebar-close.svg" alt />
                </button>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class TitleBar extends Vue {
    maximized = false

    async created(): Promise<void> {
        this.maximized = await global.ipcRenderer.invoke('CommonIpc:IsMaximized') as boolean
    }

    async maximize(): Promise<void> {
        await global.ipcRenderer.invoke('CommonIpc:Maximize')
        this.maximized = true
    }

    async unmaximize(): Promise<void> {
        await global.ipcRenderer.invoke('CommonIpc:Unmaximize')
        this.maximized = false
    }

    async minimize(): Promise<void> {
        await global.ipcRenderer.invoke('CommonIpc:Minimize')
    }

    async close(): Promise<void> {
        await global.ipcRenderer.invoke('CommonIpc:Close')
    }
}
</script>

<style lang="scss" scoped>
.titlebar-wrapper {
    width: 100%;
    height: 36px;
    background-color: #091620;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
}

.titlebar {
    margin: auto 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: space-between;
    -webkit-app-region: drag;
}

.titlebar-title {
    color: rgba($color: #fff, $alpha: 0.9);
    font-size: 12px;
    line-height: 12px;
    margin: auto 0 auto 12px;
}

.titlebar-button button {
    background-color: transparent;
    border: none;
    border-radius: 0;
    height: 100%;
    -webkit-app-region: no-drag;

    &:focus {
        outline: none;
    }
}

.minimize,
.maximize,
.unmaximize {
    &:hover {
        background-color: rgba($color: #fff, $alpha: 0.2);
    }
}

.close {
    &:hover {
        background-color: #e81123;
    }
}

.titlebar-button button img {
    margin: auto 12px;
}
</style>
