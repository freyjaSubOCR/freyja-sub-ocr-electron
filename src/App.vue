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
    // eslint-disable-next-line @typescript-eslint/naming-convention
    components: { TitleBar }
})
export default class App extends Vue {
}
</script>

<style lang="scss">
* {
    box-sizing: border-box;
    user-select: none;

    &:focus {
        outline: none;
    }
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
    font-size: 14px;
    line-height: normal;
}

.card {
    background: #0d1f2d;
    box-shadow: 0 2px 16px rgba(0, 0, 0, 0.16);
    border-radius: 4px;
    overflow: hidden;
}

.primary-button {
    background: #1c425f;
    padding: 12px;
    border: none;
    border-radius: 4px;
    box-sizing: border-box;
    color: rgba(255, 255, 255, 0.75);
    font-size: 14px;
    line-height: 14px;
    cursor: pointer;
    transition: 0.2s all;

    &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }

    &:hover {
        background: #1f4b6d;
        color: rgba(255, 255, 255, 0.9);
    }

    &:active {
        opacity: 0.5;
    }
}

.secondary-button {
    font-size: 14px;
    line-height: 20px;
    color: rgba(255, 255, 255, 0.5);
    border: 1px solid #1c425f;
    box-sizing: border-box;
    border-radius: 4px;
    padding: 8px 16px;
    background-color: transparent;
    margin-left: 12px;
    transition: 0.2s all;
    cursor: pointer;

    &:hover {
        color: rgba(255, 255, 255, 0.8);
        background-color: rgba($color: #fff, $alpha: 0.05);
    }
}

select,
input {
    background: #112a3e;
    border: solid 1px #112a3e;
    border-radius: 4px;
    outline: none;
    height: 24px;
    line-height: 14px;
    padding-left: 4px;
    color: rgba(255, 255, 255, 0.7);
    transition: 0.2s all;

    &:hover {
        border: solid 1px #1f4b6d;
    }

    &:active,
    &:focus {
        border: solid 1px #3783be;
    }
}

input[type=number]::-webkit-inner-spin-button {
    -webkit-appearance: none;
}

input[type=checkbox] {
    transition: 0.2s all;
    display: flex;
}

input[type=checkbox]::before {
    width: 12.67px;
    height: 12.67px;
    margin: auto;
    content: " ";
    background-color: #112a3e;
    display: inline-block;
    visibility: visible;
    border-radius: 2px;
    border: solid 1px #112a3e;
}

input[type=checkbox]:hover::before {
    border: 1px solid #1f4b6d;
    visibility: visible;
}

input[type=checkbox]:checked::before {
    visibility: hidden;
}

</style>
