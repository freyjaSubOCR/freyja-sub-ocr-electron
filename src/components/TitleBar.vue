<template>
    <div>
        <div class="titlebar">
            <div class="titlebar-title">Freyja</div>
            <div class="titlebar-button">
                <button class="minimize" @click="minimize">minimize</button>
                <button class="maximize" @click="maximize" v-if="maximized">maximize</button>
                <button class="unmaximize" @click="unmaximize" v-else>unmaximize</button>
                <button class="close" @click="close">close</button>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class TitleBar extends Vue {
    maximized = false

    async created() {
        this.maximized = await global.ipcRenderer.invoke('CommonIpc:IsMaximized')
    }

    async maximize() {
        await global.ipcRenderer.invoke('CommonIpc:Maximize')
        this.maximized = true
    }

    async unmaximize() {
        await global.ipcRenderer.invoke('CommonIpc:Unmaximize')
        this.maximized = false
    }

    async minimize() {
        await global.ipcRenderer.invoke('CommonIpc:Minimize')
    }

    async close() {
        await global.ipcRenderer.invoke('CommonIpc:Close')
    }
}
</script>
