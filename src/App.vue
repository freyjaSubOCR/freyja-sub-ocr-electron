<template>
    <div id="app">
        <TitleBar/>
        <router-view />
    </div>
</template>

<script lang="ts">

import { Component, Vue } from 'vue-property-decorator'
import TitleBar from '@/components/TitleBar.vue'
import 'normalize.css'

@Component({
    components: { TitleBar }
})
export default class App extends Vue {
}
</script>

<style lang="scss">
* {
    box-sizing: border-box;
}
table {
    border-spacing: 0;
}
body {
    display: flex;
    background: #162835;
    margin: 0;
}

#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    font-size: 16px;
    line-height: normal;
}

.card {
    background: #0d1f2d;
    box-shadow: 0px 2px 16px rgba(0, 0, 0, 0.16);
    border-radius: 4px;
    overflow: hidden;
}

.noselect {
  -webkit-touch-callout: none; /* iOS Safari */
    -webkit-user-select: none; /* Safari */
     -khtml-user-select: none; /* Konqueror HTML */
       -moz-user-select: none; /* Old versions of Firefox */
        -ms-user-select: none; /* Internet Explorer/Edge */
            user-select: none; /* Non-prefixed version, currently
                                  supported by Chrome, Edge, Opera and Firefox */
}
</style>
