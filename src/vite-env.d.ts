/// <reference types="vite/client" />

export interface ZenithAPI {
  expandWindow: (expanded: boolean) => Promise<void>
  closeApp: () => Promise<void>
  setIgnoreMouseEvents: (ignore: boolean, options?: { forward: boolean }) => void
}

declare global {
  interface Window {
    devnotch?: ZenithAPI
  }
}
