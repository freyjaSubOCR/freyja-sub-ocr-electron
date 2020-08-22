module.exports = {
    configureWebpack: {
        devtool: 'source-map'
    },
    pluginOptions: {
        electronBuilder: {
            preload: 'src/preload.js',
            mainProcessWatch: ['src/backends/*.ts', 'src/*.ts', 'src/preload.js']
        }
    }
}
