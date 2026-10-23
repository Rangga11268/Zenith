# Technical Specification (SPEC): Zenith

**Version:** 1.0.0  
**Status:** DRAFT / APPROVED FOR PRE-CODE  
**Base Architecture:** Electron + React 19 + TypeScript + Vite + Tailwind CSS  
**Target Platform:** Windows 10 & 11 (64-bit)  

---

## 1. Architecture Overview

Zenith dibangun dengan arsitektur dua lapisan:

```
+-------------------------------------------------------------+
|                 Windows Desktop (Layered Window)            |
|       [WS_EX_TOPMOST | WS_EX_TOOLWINDOW | TRANSPARENT]      |
+-------------------------------------------------------------+
                              ▲
                              │ IPC (ContextBridge)
                              ▼
+-------------------------------------------------------------+
|                  Main Process (Node.js / OS)                |
|  - Windows Management (bounds, transparent, alwaysOnTop)    |
|  - System Media Transport Monitor (PowerShell / WinRT shim) |
|  - Git CLI Inspector (`git status --porcelain`, `branch`)   |
|  - Local Port Scanner (`net.Socket` quick probe)            |
|  - Local Storage Controller (JSON in `%APPDATA%\Zenith`)  |
|  - AI API Bridge (Gemini / Ollama / OpenAI fetch)           |
+-------------------------------------------------------------+
                              ▲
                              │ IPC Channels
                              ▼
+-------------------------------------------------------------+
|                 Renderer Process (React + Vite)             |
|  - Collapsed Pill Widget (Clock, Tiny Status, Mascot)       |
|  - Expanded Multitask Deck (Tabs: Dev, Music, Tasks, AI)    |
|  - Tailwind CSS + Framer Motion (GPU-accelerated springs)   |
|  - Code Syntax Highlighter (Prism / Shiki micro)            |
+-------------------------------------------------------------+
```

---

## 2. Window & UI Specifications

### 2.1. Window Configuration (Main Process)
```typescript
const win = new BrowserWindow({
  width: 580,
  height: 480,
  x: Math.round((screenWidth - 580) / 2),
  y: 0,
  frame: false,
  transparent: true,
  alwaysOnTop: true,
  skipTaskbar: true,       // Tidak memenuhi taskbar
  resizable: false,
  hasShadow: false,
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,
    nodeIntegration: false,
  }
});

// Set agar klik tembus saat mouse di luar area notch (click-through)
win.setIgnoreMouseEvents(false);
```

### 2.2. Ukuran Notch State
1. **Collapsed State (Bilah Ringkas):**
   * Ukuran: `260px` x `38px`
   * Posisi: Menempel di tepi atas layar (`top: 0`).
   * Border radius: `0 0 18px 18px` (*rounded bottom pill*).
2. **Expanded State (Deck Terbuka):**
   * Ukuran: `540px` x `420px`.
   * Tampilan: Tab navigasi di bagian atas (`⚡ Dev`, `🎵 Music`, `✅ Tasks`, `🤖 AI`), konten tab di bagian tengah, status bar di bawah.

---

## 3. IPC API Contracts (`window.devnotch`)

Interface `window.devnotch` diekspos melalui `preload.ts` dengan perlindungan `contextBridge`:

```typescript
export interface ZenithAPI {
  // Window State
  expandWindow: (expanded: boolean) => Promise<void>;
  closeApp: () => Promise<void>;
  
  // Git HUD
  getGitStatus: (repoPath?: string) => Promise<{
    branch: string;
    modified: number;
    untracked: number;
    staged: number;
    lastCommit: string;
    isRepo: boolean;
  }>;
  
  // Port Scanner
  scanLocalPorts: (ports?: number[]) => Promise<{
    port: number;
    serviceName: string;
    isOpen: boolean;
  }[]>;
  
  // Media Player
  getMediaInfo: () => Promise<{
    title: string;
    artist: string;
    isPlaying: boolean;
    duration: number;
    position: number;
  }>;
  controlMedia: (action: 'play' | 'pause' | 'next' | 'prev') => Promise<void>;
  getLyrics: (title: string, artist: string) => Promise<string[]>;

  // Tasks / To-Do
  loadTasks: () => Promise<TaskItem[]>;
  saveTasks: (tasks: TaskItem[]) => Promise<void>;

  // AI Copilot
  askAI: (prompt: string, modelType: 'ollama' | 'gemini') => Promise<string>;
  
  // Code Snippet Shelf
  loadSnippets: () => Promise<SnippetItem[]>;
  saveSnippets: (snippets: SnippetItem[]) => Promise<void>;
}
```

---

## 4. Subsystem Implementations

### 4.1. Local Port Scanner
Menggunakan `net.Socket` bawaan Node.js dengan timeout mikro (150ms per port) untuk memeriksa apakah port sedang mendengarkan (*listen*):
```typescript
function checkPort(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(150);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, '127.0.0.1');
  });
}
```

### 4.2. Git Status Inspector
Menggunakan `child_process.execFile('git', ['status', '--porcelain', '-b'])`:
* Parse branch: `## main...origin/main`
* Parse changes: hitung baris ` M`, `??`, `A `, dll.

### 4.3. Media Player (Windows GSMTC / PowerShell Shim)
* Mengakses Windows Runtime GSMTC via PowerShell one-liner atau native bridge untuk membaca data metadata lagu Spotify/Browser dan mengirimkan perintah `MediaPlayPause`, `MediaNextTrack`, dll.

### 4.4. AI Copilot Integration
* **Ollama Endpoint:** `http://127.0.0.1:11434/api/generate` (model `codellama`, `deepseek-coder`, `qwen2.5-coder`).
* **Gemini API Endpoint:** Google Gemini REST API via `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`.

---

## 5. Security & Boundary Rules
* **No Remote Code Execution:** Tidak ada `eval()` atau injeksi skrip dari luar.
* **Content Security Policy (CSP):** Ketat membatasi Renderer hanya memuat aset lokal dan hanya mengizinkan request ke `lrclib.net`, `127.0.0.1`, dan API Gemini resmi.
* **Safe Local Storage:** Data disimpan di `%APPDATA%\Zenith\` dalam format JSON terenkripsi/sanitized sederhana.
