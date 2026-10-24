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
}

declare global {
  interface Window {
    devnotch?: ZenithAPI
  }
}
