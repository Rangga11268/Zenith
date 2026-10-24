/// <reference types="vite/client" />

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

declare global {
  interface Window {
    devnotch?: ZenithAPI
  }
}
