// eslint-disable-next-line @typescript-eslint/no-var-requires
const StyleLintPlugin = require('stylelint-webpack-plugin')

module.exports = {
    configureWebpack: {
        devtool: 'source-map',
        plugins: [
            new StyleLintPlugin({
                files: ['**/*.{vue,htm,html,css,sss,less,scss,sass}']
            })
        ]
    },
    pluginOptions: {
        electronBuilder: {
            preload: { 'preload': 'src/preload.js', 'TorchOCRTaskSchedulerWorkerStarter': 'src/backends/TorchOCRTaskSchedulerWorkerStarter.js' },
            mainProcessWatch: ['src/backends/*.ts', 'src/*.ts', 'src/preload.js']
        }
    }
}
