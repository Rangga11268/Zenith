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

export interface MediaInfo {
  title: string
  artist: string
  album?: string
  isPlaying: boolean
  duration: number
  position: number
  source?: string
}

export interface LyricsData {
  plainLyrics?: string
  syncedLyrics?: string
}

export interface GitStatusResult {
  branch: string
  modified: number
  untracked: number
  staged: number
  lastCommit: string
  isRepo: boolean
  repoPath: string
}

export interface PortStatus {
  port: number
  serviceName: string
  isOpen: boolean
  url: string
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
  getMediaInfo: () => Promise<MediaInfo | null>
  controlMedia: (action: 'play' | 'pause' | 'next' | 'prev') => Promise<void>
  getLyrics: (title: string, artist: string) => Promise<LyricsData | null>
  getGitStatus: (targetPath?: string) => Promise<GitStatusResult>
  scanLocalPorts: (ports?: number[]) => Promise<PortStatus[]>
  openExternal: (url: string) => Promise<void>
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
  getMediaInfo: () => ipcRenderer.invoke('media:get-status'),
  controlMedia: (action: 'play' | 'pause' | 'next' | 'prev') =>
    ipcRenderer.invoke('media:control', action),
  getLyrics: (title: string, artist: string) =>
    ipcRenderer.invoke('media:get-lyrics', title, artist),
  getGitStatus: (targetPath?: string) =>
    ipcRenderer.invoke('git:get-status', targetPath),
  scanLocalPorts: (ports?: number[]) =>
    ipcRenderer.invoke('ports:scan', ports),
  openExternal: (url: string) =>
    ipcRenderer.invoke('shell:open-external', url),
}

contextBridge.exposeInMainWorld('devnotch', api)
