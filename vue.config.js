module.exports = {
    configureWebpack: {
        devtool: 'source-map'
    },
    pluginOptions: {
        electronBuilder: {
            preload: { 'preload': 'src/preload.js', 'TorchOCRTaskSchedulerWorkerStarter': 'src/backends/TorchOCRTaskSchedulerWorkerStarter.js' },
            mainProcessWatch: ['src/backends/*.ts', 'src/*.ts', 'src/preload.js']
        }
    }
}
