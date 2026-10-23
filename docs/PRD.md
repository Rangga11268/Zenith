# Product Requirements Document (PRD): Zenith

**Version:** 1.0.0  
**Status:** DRAFT / APPROVED FOR PRE-CODE  
**Target Platform:** Windows 10 & 11 (64-bit)  
**Author:** Pair-Programming AI & User  

---

## 1. Executive Summary & Vision

**Zenith** adalah *interactive living notch* di desktop Windows yang didesain khusus untuk **software engineer dan developer**. 

Zenith menempel di bagian tengah paling atas layar monitor pengguna (*frameless, transparent, always-on-top*), mempertahankan estetika mulus dan utilitas favorit dari Nusa (**Media Player + To-Do List**), sambil menyematkan *power-tools* koding harian:
* **AI Quick Copilot / Prompt Bar** untuk tanya jawab error & snippet kode instan.
* **Git Status HUD** untuk memonitor repo aktif, branch, dan uncommitted changes.
* **Local Port & Dev Server Monitor** untuk mengetahui port dev mana saja yang aktif (`3000`, `5173`, `8080`, dll).
* **Code Snippet & Command Shelf** untuk menyimpan dan copy potongan kode sering dipakai.

---

## 2. User Personas & Problem Statements

### Persona: Fullstack & Frontend Developer
* **Frustrasi:** 
  1. Bolak-balik ganti window/tab browser hanya untuk menyalin potongan kode, mengecek lirik lagu, atau membuka localhost port.
  2. Lupa branch aktif atau lupa commit sebelum berpindah tugas.
  3. Butuh tempat cepat menempelkan prompt AI atau error log tanpa membuka browser berat.
* **Kebutuhan:** 
  Antarmuka ringkas di sudut layar yang tidak menghalangi IDE (VS Code / JetBrains / Terminal), hemat RAM, 0% CPU idle, dan langsung responsif ketika diklik atau dipanggil lewat shortcut keyboard.

---

## 3. Core Features & Functional Requirements

### 3.1. Mode Notch Default (Idle / Collapsed State)
* **Visual:** Bilah oval hitam minimalis (lebar ~220px - 280px, tinggi ~36px) di tengah atas layar dengan tepi melengkung (*pill shape*).
* **Info Default:**
  * Waktu/Jam minimalis atau Maskot ekspresif.
  * Status miniatur: Judul lagu pendek (jika ada lagu aktif), indikator port hijau (jika dev server hidup), dan jumlah tugas to-do yang tersisa.
* **Interaksi:** Hover kursor atau klik mouse membuka (*expand*) notch menjadi menu multifungsi.

---

### 3.2. Fitur 1: Media Player (Dipertahankan dari Nusa)
* **Kebutuhan:**
  * Terhubung dengan pemutar media Windows (Spotify, YouTube, browser, Windows Media).
  * Menampilkan: Judul lagu, Nama artis, Durasi/Progress bar, dan Tombol navigasi (Previous, Play/Pause, Next).
  * Menampilkan lirik lagu bergulir (*synced lyrics*) via API LRCLIB jika lagu sedang berputar.

---

### 3.3. Fitur 2: Quick To-Do & Focus Task (Dipertahankan dari Nusa)
* **Kebutuhan:**
  * Daftar tugas sederhana (Checklist).
  * Input cepat via keyboard (tekan Enter untuk tambah tugas).
  * Klik untuk mencoret/menyelesaikan tugas.
  * Penyimpanan lokal otomatis (`todo.json` / kompatibel dengan format Nusa).

---

### 3.4. Fitur 3: AI Quick Copilot Bar (Baru - Developer Assist)
* **Kebutuhan:**
  * Input text box instan untuk:
    * *"Jelaskan error ini: [paste error]"*
    * *"Buatkan regex untuk validasi email"*
    * *"Bikin perintah git untuk squash 3 commit terakhir"*
  * Dukungan API fleksibel:
    * Gemini API / OpenAI API key pengguna, ATAU
    * Local Ollama (`http://localhost:11434`) untuk koding 100% offline & gratis.
  * Jawaban ditampilkan dalam kotak popup ringkas dengan tombol *One-Click Copy Code*.

---

### 3.5. Fitur 4: Git Status HUD (Baru - Developer Assist)
* **Kebutuhan:**
  * Pengguna dapat memilih root folder proyek koding (misal `D:\Ngoding` atau folder repo aktif).
  * Notch menampilkan:
    * 🌿 Nama branch saat ini (misal `main`, `dev`, `feature/auth`).
    * ⚠️ Indikator status: Jumlah file yang diubah (`modified`, `untracked`, `staged`).
    * 🔄 Tombol quick refresh.

---

### 3.6. Fitur 5: Local Dev Server & Port Monitor (Baru - Developer Assist)
* **Kebutuhan:**
  * Memindai port lokal setiap beberapa detik:
    * `3000` (Next.js / React)
    * `5173` (Vite)
    * `8000` / `8080` (FastAPI / Spring / Go)
    * `4200` (Angular)
    * `8501` (Streamlit)
  * Jika port sedang *listening*, tampilkan lampu indikator hijau (🟢 5173).
  * Klik pada indikator port langsung membuka browser di `http://localhost:<port>`.

---

### 3.7. Fitur 6: Code Snippet & Command Shelf (Baru - Developer Assist)
* **Kebutuhan:**
  * Tab laci untuk menyimpan template kode atau perintah bash/powershell yang sering dipakai.
  * Tombol 1-klik salin ke clipboard.
  * Mendukung drag-and-drop file sementara (seperti fitur *Shelf* bawaan Nusa).

---

## 4. Non-Functional Requirements (Performance & Security)

1. **Performa:**
   * Konsumsi RAM < 80 MB saat aktif, dan konsumsi CPU mendekati 0% saat idle.
   * Animasi transisi ekspansi notch 60 FPS tanpa jeda (menggunakan akselerasi CSS GPU transform).
2. **Keamanan & Privasi:**
   * Semua data to-do, konfigurasi, dan riwayat kode disimpan **100% lokal** di komputer pengguna.
   * Tidak ada telemetri tersembunyi ke server luar.
3. **Kompatibilitas:**
   * Windows 10 (1809+) dan Windows 11 (64-bit).
   * Mendukung monitor standar (1080p) hingga monitor resolusi tinggi (2K/4K/Ultrawide).

---

## 5. Success Metrics (Kriteria Keberhasilan)
* Notch dapat dibuka dan disembunyikan dengan mulus tanpa lag.
* To-Do dan pemutar musik bekerja selaras.
* Dev server port 5173 atau 3000 langsung terdeteksi saat user menjalankan `npm run dev`.
* Prompt AI mengembalikan snippet kode yang siap di-copy dalam 1 klik.
