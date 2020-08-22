<template>
    <div class="home">
        <VideoPlayer />
        <HelloWorld msg="Welcome to Your Vue.js + TypeScript App" />
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import HelloWorld from '@/components/HelloWorld.vue' // @ is an alias to /src
import VideoPlayer from '@/components/VideoPlayer.vue' // @ is an alias to /src

@Component({
    components: {
        HelloWorld,
        VideoPlayer
    }
})
export default class Home extends Vue {}
</script>
