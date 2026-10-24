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

export interface PortStatus {
  port: number
  serviceName: string
  isOpen: boolean
  url: string
}

export interface AIPromptOptions {
  prompt: string
  provider?: 'ollama' | 'gemini' | 'fast'
  model?: string
  apiKey?: string
}

export interface AIResponse {
  answer: string
  codeSnippet?: string
  language?: string
  provider: string
}

export interface AISettings {
  provider: 'ollama' | 'gemini' | 'fast'
  geminiApiKey?: string
  ollamaModel?: string
  ollamaEndpoint?: string
}

export interface SnippetItem {
  id: string
  title: string
  content: string
  language?: string
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
  onBatteryStatusChanged: (
    callback: (status: { charging: boolean; level?: number }) => void
  ) => () => void
  loadTasks: () => Promise<TaskItem[]>
  saveTasks: (tasks: TaskItem[]) => Promise<boolean>
  getMediaInfo: () => Promise<MediaInfo | null>
  controlMedia: (action: 'play' | 'pause' | 'next' | 'prev') => Promise<void>
  getLyrics: (title: string, artist: string) => Promise<LyricsData | null>
  getGitStatus: (targetPath?: string) => Promise<GitStatusResult>
  scanLocalPorts: (ports?: number[]) => Promise<PortStatus[]>
  openExternal: (url: string) => Promise<void>
  askAI: (options: AIPromptOptions) => Promise<AIResponse>
  loadAISettings: () => Promise<AISettings>
  saveAISettings: (settings: AISettings) => Promise<boolean>
  loadSnippets: () => Promise<SnippetItem[]>
  saveSnippets: (snippets: SnippetItem[]) => Promise<boolean>
  getAutoLaunch: () => Promise<boolean>
  setAutoLaunch: (enabled: boolean) => Promise<boolean>
}

declare global {
  interface Window {
    devnotch?: ZenithAPI
  }
}
