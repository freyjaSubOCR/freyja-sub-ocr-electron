'use strict'

import { app, protocol, BrowserWindow } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
import path from 'path'
import CommonIpc from '@/CommonIpc'
import CommonStorage from '@/CommonStorage'
import TorchOCRWorkerManager from '@/backends/TorchOCRWorkerManager'
import BMPVideoPlayer from '@/backends/BMPVideoPlayer'
import ASSGenerator from '@/backends/ASSGenerator'
import ConfigIpc from '@/configIpc'
import SegfaultHandler from 'segfault-handler'

const isDevelopment = process.env.NODE_ENV === 'development'
SegfaultHandler.registerHandler('crash.log')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win: BrowserWindow | null
let torchOCRWorkerManager: TorchOCRWorkerManager | undefined

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
    { scheme: 'app', privileges: { secure: true, standard: true } }
])

function createWindow() {
    // Create the browser window.
    win = new BrowserWindow({
        width: 1100,
        height: 680,
        minWidth: 1100,
        minHeight: 680,
        frame: false,
        webPreferences: {
            // Use pluginOptions.nodeIntegration, leave this alone
            // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
            nodeIntegration: false,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js')
        }
    })

    if (process.env.WEBPACK_DEV_SERVER_URL) {
        // Load the url of the dev server if in development mode
        void win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
        if (isDevelopment && !process.env.IS_TEST) win.webContents.openDevTools()
    } else {
        createProtocol('app')
        // Load the index.html when not in development
        void win.loadURL('app://./index.html')
    }

    win.on('closed', () => {
        // ignore promise
        void torchOCRWorkerManager?.terminateWorker()
        win = null
    })
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow()
    }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
// eslint-disable-next-line @typescript-eslint/no-misused-promises
app.on('ready', async () => {
    if (isDevelopment && !process.env.IS_TEST) {
        // Install Vue Devtools
        try {
            await installExtension(VUEJS_DEVTOOLS)
        } catch (e) {
            console.error('Vue Devtools failed to install:', (e as Error).message)
        }
    }

    const bmpVideoPlayer = new BMPVideoPlayer()
    bmpVideoPlayer.registerIPCListener()
    const commonIpc = new CommonIpc()
    commonIpc.registerIPCListener()
    const commonStorage = new CommonStorage()
    commonStorage.registerIPCListener()
    const assGenerator = new ASSGenerator()
    assGenerator.registerIPCListener()
    torchOCRWorkerManager = new TorchOCRWorkerManager()
    torchOCRWorkerManager.registerIPCListener()
    ConfigIpc.registerIPCListener()

    createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
    if (process.platform === 'win32') {
        process.on('message', (data) => {
            if (data === 'graceful-exit') {
                app.quit()
            }
        })
    } else {
        process.on('SIGTERM', () => {
            app.quit()
        })
    }
}
