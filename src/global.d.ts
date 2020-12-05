/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-namespace */
import { IpcRenderer } from 'electron'

declare global {
    namespace NodeJS {
        interface Global {
            ipcRenderer: IpcRenderer
        }
    }
}
