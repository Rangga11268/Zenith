import { contextBridge, ipcRenderer } from 'electron'

export interface NotificationPayload {
  id?: string
  appName?: string
  title: string
  body: string
}

export interface BatteryStatus {
  level: number
  charging: boolean
}

export interface TaskItem {
  id: string
  title: string
  completed: boolean
  createdAt: number
}

export interface ZenithAPI {
  expandWindow: (expanded: boolean) => Promise<void>
  closeApp: () => Promise<void>
  setIgnoreMouseEvents: (ignore: boolean, options?: { forward: boolean }) => void
  onToggleNotch: (callback: () => void) => () => void
  triggerNotification: (notif: NotificationPayload) => void
  onNotification: (callback: (notif: NotificationPayload) => void) => () => void
  getBatteryStatus: () => Promise<BatteryStatus>
  loadTasks: () => Promise<TaskItem[]>
  saveTasks: (tasks: TaskItem[]) => Promise<boolean>
}

const api: ZenithAPI = {
  expandWindow: (expanded: boolean) => ipcRenderer.invoke('window:expand', expanded),
  closeApp: () => ipcRenderer.invoke('window:close'),
  setIgnoreMouseEvents: (ignore: boolean, options?: { forward: boolean }) =>
    ipcRenderer.send('set-ignore-mouse-events', ignore, options),
  onToggleNotch: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on('toggle-notch', handler)
    return () => {
      ipcRenderer.removeListener('toggle-notch', handler)
    }
  },
  triggerNotification: (notif: NotificationPayload) =>
    ipcRenderer.send('notification:trigger', notif),
  onNotification: (callback: (notif: NotificationPayload) => void) => {
    const handler = (_event: any, data: NotificationPayload) => callback(data)
    ipcRenderer.on('notification:received', handler)
    return () => {
      ipcRenderer.removeListener('notification:received', handler)
    }
  },
  getBatteryStatus: () => ipcRenderer.invoke('battery:get-status'),
  loadTasks: () => ipcRenderer.invoke('tasks:load'),
  saveTasks: (tasks: TaskItem[]) => ipcRenderer.invoke('tasks:save', tasks),
}

contextBridge.exposeInMainWorld('devnotch', api)
