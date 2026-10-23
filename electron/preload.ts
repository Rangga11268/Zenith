import { contextBridge, ipcRenderer } from 'electron'

export interface ZenithAPI {
  expandWindow: (expanded: boolean) => Promise<void>
  closeApp: () => Promise<void>
  setIgnoreMouseEvents: (ignore: boolean, options?: { forward: boolean }) => void
}

const api: ZenithAPI = {
  expandWindow: (expanded: boolean) => ipcRenderer.invoke('window:expand', expanded),
  closeApp: () => ipcRenderer.invoke('window:close'),
  setIgnoreMouseEvents: (ignore: boolean, options?: { forward: boolean }) =>
    ipcRenderer.send('set-ignore-mouse-events', ignore, options),
}

contextBridge.exposeInMainWorld('devnotch', api)
