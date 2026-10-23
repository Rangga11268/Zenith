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
- [ ] Implementasi UI bilah pil hitam rounded (*collapsed state*) di `src/components/NotchBar.tsx`.
- [ ] Implementasi animasi transisi membuka ke deck multifungsi (*expanded state*) menggunakan Tailwind / CSS transitions.
- [ ] Pengaturan dynamic window resizing via IPC (resize dari 38px ke 420px saat dibuka).
- [ ] *Acceptance Criteria:* Klik atau hover pada notch membuka deck dengan transisi 60 FPS tanpa jeda.

### Milestone 3: To-Do & Task Manager (Fitur Bawaan)
- [ ] Implementasi IPC handler untuk load/save task di `%APPDATA%\Zenith\tasks.json`.
- [ ] Pembuatan UI To-Do tab: list task, checkbox, input box untuk tambah task baru.
- [ ] Sinkronisasi dengan file `todo.txt` lama dari Nusa (jika ada).
- [ ] *Acceptance Criteria:* Task dapat ditambah, dicentang selesai, dihapus, dan tetap tersimpan saat aplikasi ditutup.

### Milestone 4: Media Player & LRCLIB Lyrics
- [ ] Implementasi Windows GSMTC / media keys controller di Main Process.
- [ ] Implementasi UI player: judul lagu, artis, tombol Play/Pause/Skip, dan progress bar.
- [ ] Integrasi API `lrclib.net` untuk menampilkan lirik lagu aktif.
- [ ] *Acceptance Criteria:* Memutar lagu di Spotify/browser otomatis menampilkan judul di notch dan tombol pause berfungsi.

### Milestone 5: Git Status HUD (Developer Feature)
- [ ] Implementasi IPC `git-status` menggunakan `child_process` Git CLI.
- [ ] UI kartu Git: menampilkan branch aktif, jumlah uncommitted changes (modified/untracked), dan last commit message.
- [ ] Auto-poll interval (setiap 5-10 detik jika notch sedang dibuka).
- [ ] *Acceptance Criteria:* Mengedit file di proyek langsung memperbarui counter uncommitted changes di notch.

### Milestone 6: Dev Server & Port Monitor (Developer Feature)
- [ ] Implementasi port scanner cepat via `net.Socket` untuk port `3000`, `5173`, `8000`, `8080`, `8501`.
- [ ] UI indikator: lampu hijau bulat, label port, dan tombol 1-klik untuk buka di browser default.
- [ ] *Acceptance Criteria:* Menjalankan `npm run dev` di proyek mana saja langsung memunculkan indikator hijau `🟢 5173` di notch.

### Milestone 7: AI Copilot & Quick Prompt Bar (Developer Feature)
- [ ] Input box prompt di notch dengan shortcut `Ctrl + Shift + Space`.
- [ ] Integrasi backend:
  - Local Ollama (`http://localhost:11434`), atau
  - Google Gemini API key.
- [ ] UI response: kotak jawaban rapi dengan *One-Click Copy* untuk blok kode.
- [ ] *Acceptance Criteria:* Mengetik "bikin fungsi debounce di JS" langsung memberikan snippet yang bisa disalin ke clipboard dalam 1 klik.

### Milestone 8: Dynamic Battery & Charging Animation (Mac Style)
- [ ] Integrasi `navigator.getBattery()` dengan listener real-time.
- [ ] UI animasi mekar asimetris saat charger terhubung (ikon petir hijau + persentase baterai).
- [ ] UI peringatan baterai lemah (Amber 20% & Merah 10%) dengan animasi gentle shake.
- [ ] *Acceptance Criteria:* Mencolokkan charger laptop langsung memicu animasi mekar Dynamic Island baterai selama 3 detik.

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
