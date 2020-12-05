/* eslint-disable @typescript-eslint/no-var-requires */
const StyleLintPlugin = require('stylelint-webpack-plugin')
const ThreadsPlugin = require('threads-plugin')
const NodeTargetPlugin = require('webpack/lib/node/NodeTargetPlugin')
const ExternalsPlugin = require('webpack/lib/ExternalsPlugin')
/* eslint-enable @typescript-eslint/no-var-requires */

module.exports = {
    configureWebpack: {
        devtool: 'source-map',
        plugins: [
            new StyleLintPlugin({
                files: ['src/**/*.{vue,htm,html,css,sss,less,scss,sass}']
            })
        ]
    },
    pluginOptions: {
        electronBuilder: {
            preload: { 'preload': 'src/preload.js' },
            mainProcessWatch: ['src/backends/*.ts', 'src/*.ts', 'src/preload.js'],
            externals: ['segfault-handler'],
            chainWebpackMainProcess: (config) => {
                config.plugin('threads').use(ThreadsPlugin, [{
                    plugins: [
                        new NodeTargetPlugin(),
                        new ExternalsPlugin('commonjs', ['bindings', 'beamcoder', 'torch-js'])
                    ]
                }])
            }
        }
    }
}
