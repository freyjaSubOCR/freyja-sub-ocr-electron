<template>
    <div id="app">
        <router-view />
    </div>
</template>

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
    padding: 40px;
    margin: 0;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
}

#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    font-size: 16px;
    line-height: 24px;
}

.card {
    background: #0d1f2d;
    box-shadow: 0px 2px 16px rgba(0, 0, 0, 0.16);
    border-radius: 4px;
    overflow: hidden;
}
</style>
