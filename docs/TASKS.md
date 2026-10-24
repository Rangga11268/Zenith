# Task Breakdown & Implementation Roadmap: Zenith

**Methodology:** Vertical Slices (End-to-End Per Feature)  
**Tracking Status:** Ready for Milestone 1  

---

## Dependency Graph

```
Project Scaffold (Vite + Electron + TS + Tailwind)
   │
   ├── Core Window & Frameless Transparent Shell (Milestone 1)
   │     │
   │     ├── Slice A: Collapsed / Expanded Notch Motion (Milestone 2)
   │     │     │
   │     │     ├── Slice B: To-Do & Task Manager (Milestone 3)
   │     │     ├── Slice C: Media Player & Lyrics (Milestone 4)
   │     │     ├── Slice D: Git Status HUD (Milestone 5)
   │     │     ├── Slice E: Local Port & Dev Server Monitor (Milestone 6)
   │     │     └── Slice F: AI Copilot Quick Prompt (Milestone 7)
   │     │
   │     └── Slice G: Code Snippet & Command Shelf (Milestone 8)
   │
   └── Packaging & Windows Auto-Launch (Milestone 9)
```

---

## Detailed Milestones

### Milestone 1: Project Scaffolding & Setup
- [x] Inisialisasi struktur direktori di `D:\Ngoding\Zenith`.
- [x] Konfigurasi `package.json` dengan `electron`, `vite`, `react 19`, `typescript 5.7`, `@tailwindcss/vite`, `lucide-react`.
- [x] Setup script `npm run dev`, `npm run build`, dan `npm test`.
- [x] *Acceptance Criteria:* Jendela Electron frameless berhasil terbuka di tengah atas layar dengan background transparan, hit-testing click-through (`setIgnoreMouseEvents`), dan lulus 12 verifikasi otomatis.
- [x] Penerapan `/antislop-ui`: palet Obsidian `#090A0F`, typografis clean, tanpa rainbow skittles, tanpa infinite ping loops, micro-borders tajam.

### Milestone 2: Notch Pill Container & Smooth Expansion
- [x] Implementasi UI bilah pil hitam rounded (*collapsed state*) di `src/components/NotchBar.tsx`.
- [x] Implementasi animasi transisi membuka ke deck multifungsi (*expanded state*) menggunakan Tailwind / CSS transitions `cubic-bezier(0.16, 1, 0.3, 1)`.
- [x] Implementasi Dynamic Island morphing untuk status Baterai (Charging Connected & Low Battery alert).
- [x] Implementasi Dynamic Island morphing untuk System Notification Hub (preview pesan + auto-collapse).
- [x] Integrasi Global Shortcut Windows (`Ctrl+Shift+Space`) untuk toggle notch di Main & Renderer.
- [x] *Acceptance Criteria:* Klik, hover, atau shortcut membuka deck dengan transisi 60 FPS tanpa jeda, lulus 15 verifikasi otomatis termasuk Dynamic Island battery & notification morphs.

### Milestone 3: To-Do & Task Manager (Fitur Bawaan)
- [x] Implementasi IPC handler untuk load/save task di `%APPDATA%\Zenith\tasks.json`.
- [x] Pembuatan UI To-Do tab: list task, checkbox, input box untuk tambah task baru.
- [x] Sinkronisasi otomatis dengan file `todo.txt` lama dari Nusa jika tersedia.
- [x] Fitur filter task (`all`, `active`, `completed`) dan aksi `Clear Done`.
- [x] *Acceptance Criteria:* Task dapat ditambah, dicentang selesai, dihapus, dan tetap tersimpan saat aplikasi ditutup (lulus verifikasi persistensi disk otomatis).

### Milestone 4: Media Player & LRCLIB Lyrics
- [x] Implementasi Windows GSMTC / media keys controller di Main Process (`electron/media-probe.ps1` & WScript.Shell SendKeys).
- [x] Implementasi UI player: judul lagu, artis, album, app source badge, tombol Play/Pause/Skip, dan progress bar.
- [x] Integrasi API `lrclib.net` untuk menampilkan lirik lagu aktif (plain & synchronized).
- [x] Fitur preview demo tracks (`Yellow` Coldplay & `Starboy` The Weeknd) untuk pengujian instan.
- [x] *Acceptance Criteria:* Memutar lagu di Spotify/browser otomatis menampilkan judul di notch, kontrol playback berfungsi, dan lirik terambil dari LRCLIB (lulus acceptance checks otomatis).

### Milestone 5: Git Status HUD (Developer Feature)
- [x] Implementasi IPC `git-status` menggunakan `child_process` Git CLI dengan output parsing deterministik.
- [x] UI kartu Git: menampilkan branch aktif, live uncommitted changes counter (modified/untracked/staged), last commit message, dan tombol refresh 1-klik `↻`.
- [x] Auto-poll interval (setiap 5 detik saat notch dibuka pada tab Dev).
- [x] *Acceptance Criteria:* Mengedit file di proyek langsung memperbarui counter uncommitted changes di notch (lulus verifikasi query & UI otomatis).

### Milestone 6: Dev Server & Port Monitor (Developer Feature)
- [x] Implementasi port scanner cepat via `net.Socket` bawaan Node.js untuk port `3000`, `5173`, `8000`, `8080`, `8501`.
- [x] UI indikator: dot hijau, counter port aktif, label service, dan tombol 1-klik untuk buka di browser default via `shell.openExternal`.
- [x] Auto-poll interval (setiap 4 detik saat notch dibuka pada tab Dev) dan tombol scan manual `↻`.
- [x] *Acceptance Criteria:* Menjalankan dev server di port umum langsung terdeteksi di notch dan dapat dibuka di browser dalam 1 klik (lulus live test socket probe otomatis).

### Milestone 7: AI Copilot & Quick Prompt Bar (Developer Feature)
- [x] Input box prompt di notch dengan shortcut `Ctrl + Shift + Space`.
- [x] Integrasi backend:
  - Local Ollama (`http://localhost:11434`), atau
  - Google Gemini API key, atau
  - Built-in Fast Dev Copilot offline recipe generator.
- [x] UI response: kotak jawaban rapi dengan *One-Click Copy* (`data-testid="ai-copy-btn"`) untuk blok kode dan syntax card berarsitektur Antislop Obsidian.
- [x] *Acceptance Criteria:* Mengetik "bikin fungsi debounce di JS" langsung memberikan snippet yang bisa disalin ke clipboard dalam 1 klik (lulus acceptance check otomatis).

### Milestone 8: Dynamic Battery & Charging Animation (Mac Style)
- [x] Integrasi `navigator.getBattery()` dengan listener real-time dan Electron PowerMonitor hardware events (`battery:status-changed`).
- [x] UI animasi mekar asimetris saat charger terhubung (ikon petir hijau berdenyut + persentase baterai + label Fast Charging).
- [x] UI peringatan baterai bertingkat: Amber 20% (Battery Low) & Merah 10% (Battery Critical) dengan animasi gentle shake.
- [x] *Acceptance Criteria:* Mencolokkan charger laptop langsung memicu animasi mekar Dynamic Island baterai selama 3.5 detik (lulus verifikasi 8 milestone otomatis).

### Milestone 9: Notification Morphing & macOS Glass Styling
- [ ] Desain styling *MacBook Notch* dengan sudut telinga melengkung (*concave inverted fillet ears*).
- [ ] Implementasi animasi *bloom notification* saat ada pesan/peringatan sistem.
- [ ] Dynamic click-through hit testing (`setIgnoreMouseEvents`).
- [ ] *Acceptance Criteria:* Notifikasi masuk membuat notch membesar lembut menampilkan pesan lalu mengempis kembali.

### Milestone 10: Code Snippet Shelf, Hotkeys & Windows Auto-Launch
- [ ] Penyimpanan template kode / perintah terminal favorit.
- [ ] Drag and drop file / text ke area shelf.
- [ ] Tombol salin instan.
- [ ] *Acceptance Criteria:* File atau potongan teks yang di-drop ke shelf tersimpan dan dapat disalin kembali.

### Milestone 9: Polish, Keyboard Shortcuts & Run on Startup
- [ ] Global hotkey untuk toggle buka/tutup notch.
- [ ] Opsi "Start with Windows".
- [ ] Final testing performa (verifikasi CPU 0% saat idle dan RAM < 80 MB).
