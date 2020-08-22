import { ipcRenderer } from 'electron'

process.once('loaded', () => {
    global.ipcRenderer = ipcRenderer
})
