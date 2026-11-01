# Panduan Instalasi PhysicsLearn v1.0.0

PhysicsLearn adalah LMS pembelajaran fisika untuk satu guru (sekaligus admin) dan siswanya: absensi sesi berbasis GPS, materi, tugas dan pengumpulan berkas, bank soal, ujian/latihan dengan timer, laporan nilai, dan pengaturan identitas aplikasi (nama, logo, warna).

Aplikasi terdiri dari dua bagian yang dipasang terpisah:

| Bagian | Isi | Dipasang di |
|---|---|---|
| **Backend** (server + database) | `Kode.gs`, `appsscript.json` | Google Apps Script, dengan data di Google Sheets + Google Drive milik Anda |
| **Frontend** (tampilan) | `index.html`, folder `css/`, folder `js/` | GitHub Pages (gratis) |

Perkiraan waktu: backend ±15 menit, frontend ±20 menit, pengaturan awal ±15 menit.

---

## Daftar isi

1. [Berkas yang Anda terima](#1-berkas-yang-anda-terima)
2. [Bagian A — Memasang backend di Apps Script](#bagian-a--memasang-backend-di-apps-script)
3. [Bagian B — Memasang frontend di GitHub Pages](#bagian-b--memasang-frontend-di-github-pages)
4. [Bagian C — Langkah pertama setelah online](#bagian-c--langkah-pertama-setelah-online)
5. [Bagian D — Login dengan Google (opsional)](#bagian-d--login-dengan-google-opsional)
6. [Bagian E — Memindahkan data siswa lama (impor)](#bagian-e--memindahkan-data-siswa-lama-impor)
7. [Bagian F — Script Properties: mana yang otomatis, mana yang Anda isi](#bagian-f--script-properties-mana-yang-otomatis-mana-yang-anda-isi)
8. [Bagian G — Akses darurat](#bagian-g--akses-darurat)
9. [Bagian H — Server tetap hangat (keepWarm) dan kuota](#bagian-h--server-tetap-hangat-keepwarm-dan-kuota)
10. [Bagian I — Cara memperbarui aplikasi](#bagian-i--cara-memperbarui-aplikasi)
11. [Kendala umum & solusinya](#kendala-umum--solusinya)
12. [Batasan yang perlu diketahui](#batasan-yang-perlu-diketahui)

---

## 1. Berkas yang Anda terima

```
Kode.gs                       ← backend, disalin-tempel ke editor Apps Script
appsscript.json               ← pengaturan proyek Apps Script (zona waktu, izin)
PANDUAN-INSTALASI.md          ← panduan ini
physicslearn-frontend.zip     ← frontend untuk GitHub Pages
```

Isi `physicslearn-frontend.zip` setelah diekstrak:

```
physicslearn-frontend/        ← folder INI yang nanti di-"git init"
├── index.html
├── README.md
├── PANDUAN-INSTALASI.md
├── .nojekyll                 (berkas tersembunyi, biarkan saja)
├── css/
│   └── style.css
└── js/
    ├── config.js             ← satu-satunya berkas yang perlu Anda ubah
    ├── api.js
    ├── app.js
    ├── ui.js
    ├── icons.js
    ├── charts.js
    ├── siswa.js
    ├── guru.js
    └── guru2.js
```

> Berkas backend (`Kode.gs`, `appsscript.json`) sengaja **tidak** ada di dalam ZIP. Keduanya hanya untuk Apps Script dan tidak boleh ikut terunggah ke GitHub.

---

## Bagian A — Memasang backend di Apps Script

Gunakan akun Google yang akan menjadi **pemilik aplikasi** (akun guru). Semua data (spreadsheet, berkas tugas, materi) akan tersimpan di Google Drive akun ini.

### A1. Buat proyek Apps Script

1. Buka **https://script.google.com** → klik **Proyek baru**.
2. Klik judul "Proyek tanpa judul" di kiri atas → ganti menjadi `PhysicsLearn API` → **Ganti nama**.

### A2. Pasang `appsscript.json` (pengaturan proyek)

Berkas ini mengatur zona waktu **Asia/Jakarta** (agar jadwal otomatis berjalan dalam WIB) dan izin yang dibutuhkan.

1. Klik ikon **⚙️ Setelan proyek** di bilah kiri.
2. Centang **Tampilkan file manifes "appsscript.json" di editor**.
3. Kembali ke ikon **< > Editor** → klik berkas `appsscript.json`.
4. Hapus seluruh isinya, lalu tempel seluruh isi berkas `appsscript.json` yang Anda terima → **Simpan** (Ctrl+S).

### A3. Pasang `Kode.gs`

1. Klik berkas `Kode.gs` di editor.
2. Hapus seluruh isinya (Ctrl+A lalu Delete).
3. Buka berkas `Kode.gs` yang Anda terima dengan Notepad/TextEdit → salin semua (Ctrl+A, Ctrl+C) → tempel ke editor (Ctrl+V).
4. Klik **💾 Simpan** (Ctrl+S). Pastikan tidak ada pesan galat merah.

### A4. Jalankan setup (sekali saja)

1. Di bilah atas editor, pilih fungsi **`setupAppEnvironment`** dari menu tarik-turun → klik **▶ Jalankan**.
2. Muncul jendela **Otorisasi diperlukan** → **Tinjau izin** → pilih akun Google Anda.
3. Muncul layar "Google belum memverifikasi aplikasi ini". Ini **normal** karena skrip ini buatan Anda sendiri, bukan aplikasi pihak lain. Klik **Lanjutan** → **Buka PhysicsLearn API (tidak aman)** → **Izinkan**.

Izin yang diminta dan alasannya:

| Izin | Untuk apa |
|---|---|
| Google Sheets | Membuat dan mengisi spreadsheet database |
| Google Drive | Menyimpan materi, lampiran tugas, berkas jawaban siswa, logo, cadangan |
| Layanan eksternal | Memverifikasi login Google siswa ke server Google |
| Trigger | Menjadwalkan tugas otomatis (lihat Bagian H) |
| Alamat email Anda | Mengisi email akun guru pertama |

### A5. Catat akun dari log

Setelah selesai, buka **Log eksekusi** di bawah editor. Isinya kira-kira seperti ini (nilai sebenarnya berbeda):

```
✅ Folder induk dibuat: https://drive.google.com/drive/folders/XXXX
✅ Spreadsheet dibuat: https://docs.google.com/spreadsheets/d/XXXX
👩‍🏫 AKUN GURU (catat sekarang — hanya tampil sekali, wajib diganti saat masuk pertama)
   Username    : guru
   Kata sandi  : XXXXXXXXXXXX
🔐 AKSES DARURAT (catat sekarang — hanya tampil sekali, ganti setelah masuk pertama)
   Halaman     : <alamat-frontend>/#/darurat
   Pengguna    : darurat
   Kata sandi  : XXXXXXXXXXXXXXXX
✅ Trigger terpasang: keepWarm (5 menit), tugasHarian (01.00), cadanganMingguan (Minggu 02.00).
✅ SETUP SELESAI
```

> ⚠️ **Catat kedua kata sandi itu sekarang** di tempat aman. Sandi hanya tampil sekali. Sandi guru wajib diganti saat masuk pertama kali, dan sandi darurat sebaiknya diganti dari menu Pengaturan → Keamanan.
>
> Log eksekusi tersimpan di riwayat Apps Script, karena itu sandi awal ini **harus diganti** setelah dipakai.

`setupAppEnvironment` **aman dijalankan ulang**: tidak membuat spreadsheet baru, tidak menghapus data, dan tidak mengganti sandi yang sudah ada. Jalankan lagi bila suatu saat ada sheet atau folder yang tidak sengaja terhapus.

### A6. (Opsional) Isi data contoh

Ingin mencoba dulu sebelum memakai data asli? Pilih fungsi **`isiDataContoh`** → **▶ Jalankan**. Ini membuat kelas "XI MIPA 2 (Contoh)", 3 siswa (NIS `2024001`–`2024003`, kata sandi = NIS-nya), 2 materi, 1 tugas, 3 soal, dan 1 latihan. Kelas contoh bisa diarsipkan nanti dari menu Kelas & Siswa.

### A7. Deploy sebagai Web App

1. Klik **Terapkan** (kanan atas) → **Deployment baru**.
2. Klik ikon **⚙️** di samping "Pilih jenis" → pilih **Aplikasi web**.
3. Isi:

   | Kolom | Nilai |
   |---|---|
   | Deskripsi | `v1.0.0` |
   | Jalankan sebagai | **Saya** (email Anda) |
   | Siapa yang memiliki akses | **Siapa saja** |

4. Klik **Terapkan** → salin **URL aplikasi web**. Bentuknya:
   `https://script.google.com/macros/s/XXXX/exec`

> **Kenapa "Siapa saja"?** Siswa membuka aplikasi dari GitHub Pages, bukan dari Google. Keamanan dijaga oleh login PhysicsLearn (token sesi + pemeriksaan peran di server), bukan oleh pengaturan ini. Tanpa "Siapa saja", aplikasi tidak bisa memanggil server.
>
> Pakai URL yang berakhiran **`/exec`**, bukan `/dev`.

### A8. Uji backend

Tempel URL `/exec` tadi di tab browser baru. Jika berhasil, muncul teks seperti:

```
{"success":true,"app":"PhysicsLearn API","v":"1.0.0","message":"API aktif. Aplikasi memanggil lewat POST."}
```

---

## Bagian B — Memasang frontend di GitHub Pages

Bagian ini memakai **terminal** (PowerShell di Windows, Terminal di Mac). Jangan memakai tombol "Upload files" di situs GitHub: cara itu meratakan semua berkas tanpa folder `css/` dan `js/`, sehingga tampilan rusak.

Istilah singkat:
- **Repository (repo)**: folder proyek Anda di GitHub.
- **Commit**: "simpan titik" perubahan berkas.
- **Push**: mengirim commit dari komputer ke GitHub.

### B1. Isi `js/config.js` lebih dulu

1. Ekstrak `physicslearn-frontend.zip` (Windows: klik kanan → **Extract All** → biarkan nama folder `physicslearn-frontend`; Mac: klik dua kali). Anda akan mendapat folder **`physicslearn-frontend`** yang langsung berisi `index.html`, `css`, dan `js`.
2. Buka `physicslearn-frontend/js/config.js` dengan Notepad/TextEdit.
3. Ganti `GANTI_DENGAN_ID_DEPLOYMENT` sehingga barisnya berisi URL `/exec` Anda dari langkah A7:

   ```js
   window.APP_CONFIG = {
     GAS_URL: 'https://script.google.com/macros/s/XXXX/exec'
   };
   ```

4. Simpan. Jangan menaruh sandi atau kunci apa pun di berkas ini. URL `/exec` bukan rahasia.

> **Sudah terlanjur di-push sebelum diisi?** Tidak masalah. Buka repository di github.com → folder `js` → `config.js` → ikon pensil ✏️ → ganti alamatnya → **Commit changes**. Tunggu 1–2 menit lalu muat ulang situs. Setelah mengedit di github.com, jalankan `git pull` di komputer sebelum `git push` berikutnya.
>
> Bila `config.js` belum benar, situs menampilkan layar yang menyebut penyebab pastinya (berkas tidak ditemukan, masih alamat contoh, memakai `/dev`, alamat editor, dan lain-lain) beserta langkah perbaikannya.

### B2. Pasang Git (sekali saja)

- **Windows**: unduh dari https://git-scm.com/download/win, pasang dengan pilihan bawaan. Lalu buka **PowerShell**.
- **Mac**: buka **Terminal**, ketik `git --version`. Bila belum ada, macOS menawarkan pemasangan otomatis.

Periksa:

```bash
git --version
```

Lalu atur identitas (sekali seumur komputer itu; nama bebas, email sebaiknya sama dengan akun GitHub):

```bash
git config --global user.name "Nama Anda"
git config --global user.email "email-akun-github@contoh.com"
```

### B3. Buat akun & repository GitHub

1. Daftar di https://github.com bila belum punya. Username Anda akan menjadi bagian alamat situs: `https://USERNAME.github.io/...`
2. Klik **+** (kanan atas) → **New repository**.
3. Nama repository, misalnya `physicslearn`. Pilih **Public** (wajib untuk GitHub Pages gratis; aman karena frontend tidak memuat rahasia).
4. **Jangan** centang "Add a README", ".gitignore", atau "license".
5. Klik **Create repository**. Biarkan halaman itu terbuka.

### B4. Masuk ke folder yang BENAR

Folder kerja Anda adalah **`physicslearn-frontend`** (folder hasil ekstraksi ZIP yang berisi `index.html` langsung di dalamnya). Bukan folder induknya, dan bukan folder `css` atau `js`.

Cara cepat di Windows: buka folder `physicslearn-frontend` di File Explorer → klik address bar → ketik `powershell` → Enter.

Atau dengan perintah (sesuaikan jalurnya):

```powershell
cd "C:\Users\NAMA\Downloads\physicslearn-frontend"
```

Mac:

```bash
cd ~/Downloads/physicslearn-frontend
```

**Periksa isinya sebelum lanjut:**

```powershell
dir
```

(Mac: `ls -la`)

Yang **harus** terlihat: `index.html`, `README.md`, `PANDUAN-INSTALASI.md`, folder `css`, folder `js`.

> ⛔ Jika yang terlihat justru satu folder `physicslearn-frontend` lagi (biasanya karena ZIP diekstrak dua kali), Anda masih satu tingkat terlalu tinggi. Jalankan `cd physicslearn-frontend` lalu `dir` lagi. **Jangan lanjut sebelum `index.html` terlihat.** Git tidak akan memperingatkan bila foldernya salah, tetapi situs akan tampil "404".

### B5. Kirim ke GitHub

Jalankan satu per satu:

```bash
git init
```
Hasil normal: `Initialized empty Git repository in ...`

```bash
git add .
```
Perhatikan **titik** di akhir. Hasil normal: tidak ada keluaran.

```bash
git commit -m "Upload pertama PhysicsLearn"
```
Hasil normal: daftar berkas seperti `create mode 100644 index.html`.

```bash
git branch -M main
git remote add origin https://github.com/USERNAME/physicslearn.git
```
Ganti `USERNAME` (dan nama repo bila berbeda).

```bash
git push -u origin main
```

Saat diminta:
- **Username**: username GitHub Anda.
- **Password**: tempel **Personal Access Token**, bukan sandi akun GitHub (lihat B6).

> 💡 Saat menempel token, layar **tetap kosong**, tanpa bintang atau titik. Itu normal. Tempel (klik kanan di PowerShell), lalu tekan Enter.

Tanda berhasil: `Writing objects: 100%` dan `* [new branch] main -> main`.

### B6. Membuat Personal Access Token (bila diminta)

Bila muncul `Password authentication is not supported`, itu bukan galat fatal. GitHub hanya menerima token:

1. Buka https://github.com/settings/tokens → **Generate new token** → **Generate new token (classic)**.
2. Note: `physicslearn-push`. Expiration: `90 days`. Centang scope **repo**.
3. **Generate token** → salin token (`ghp_...`). Token hanya tampil sekali; simpan sementara di Notepad.
4. Jalankan lagi `git push -u origin main` dan tempel token sebagai password.

Kesulitan dengan terminal? Alternatif visual: **GitHub Desktop** (https://desktop.github.com) → **Add Local Repository** → pilih folder `physicslearn-frontend` → **Publish repository**.

### B7. Aktifkan GitHub Pages

1. Buka `https://github.com/USERNAME/physicslearn`. Pastikan terlihat `index.html` serta folder `css` dan `js` di halaman utama repo, dan **tidak ada** berkas `.gs`.
2. **Settings** → **Pages** (menu kiri).
3. Isi:

   | Kolom | Nilai |
   |---|---|
   | Source | **Deploy from a branch** |
   | Branch | **main** · **/ (root)** → Save |
   | Enforce HTTPS | ✅ **Wajib dicentang** |

4. Tunggu 1–2 menit, muat ulang halaman. Muncul: *Your site is live at `https://USERNAME.github.io/physicslearn/`*.

> ⚠️ **Enforce HTTPS wajib.** Tanpa HTTPS, browser memblokir GPS (absensi sesi) dan kamera (foto tugas).

---

## Bagian C — Langkah pertama setelah online

Buka `https://USERNAME.github.io/physicslearn/`, lalu:

1. **Masuk sebagai guru**: username `guru` + sandi dari log setup. Anda langsung diminta membuat sandi baru.
2. **Pengaturan → Identitas**: nama aplikasi, nama guru, nama sekolah, unggah logo (otomatis dibuat thumbnail 512 px dan favicon).
3. **Pengaturan → Tema warna** (opsional): pilih tema atau warna sendiri. Aplikasi memperingatkan bila kontras warna terlalu rendah.
4. **Pengaturan → Lokasi**: berdirilah di laboratorium/kelas → **Tambah lokasi** → **Gunakan lokasi saat ini** → atur radius (disarankan 50–100 m karena GPS dalam ruangan sering meleset 20–60 m) → simpan.
5. **Pengaturan → Akademik**: tahun ajaran, semester, batas ketuntasan (KKM), durasi sesi.
6. **Pengaturan → Keamanan**: **Ganti sandi darurat** (minimal 12 karakter, huruf + angka). Isi Client ID Google bila ingin login Google (Bagian D).
7. **Kelas & Siswa → Kelas baru**: buat kelas. Setiap kelas punya **kode kelas**.
8. Tambahkan siswa dengan salah satu cara:
   - **Impor data** dari Excel/CSV/Google Sheets (Bagian E). Sandi awal siswa = NIS, wajib diganti saat masuk pertama.
   - **Tambah siswa** satu per satu.
   - Bagikan **kode kelas** → siswa mendaftar sendiri lewat "Daftar dengan kode kelas" → Anda menyetujui di banner "pendaftaran menunggu persetujuan".
9. Unggah **Materi**, buat **Tugas**, isi **Bank Soal**, susun **Ujian/Latihan**.
10. Di kelas: **Sesi & Absensi → Buka sesi absensi**. Siswa menekan **Hadir** di berandanya selama sesi berlangsung. Siswa yang belum absen otomatis tercatat **alfa** saat sesi ditutup.

Bagikan kepada siswa: alamat situs, NIS sebagai username, dan sandi awal (NIS) atau kode kelas.

---

## Bagian D — Login dengan Google (opsional)

Siswa dan guru bisa masuk dengan akun Google **asalkan emailnya sudah terdaftar** di PhysicsLearn (diisi saat impor/tambah siswa, atau saat siswa mendaftar). Email yang tidak terdaftar ditolak dengan pesan "Akun belum terdaftar, hubungi guru."

### D1. Buat OAuth Client ID

1. Buka https://console.cloud.google.com → buat proyek baru, misalnya `PhysicsLearn`.
2. Menu **APIs & Services → OAuth consent screen** (di sebagian akun bernama **Google Auth Platform**):
   - User type: **External** → isi nama aplikasi dan email dukungan → simpan.
   - Pada bagian **Audience / Publishing status**, klik **Publish app** agar statusnya **In production**. Selama masih "Testing", hanya email yang didaftarkan sebagai *test user* yang bisa masuk. Login dasar (email & profil) tidak memerlukan verifikasi Google.
3. Menu **Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**.
   - **Authorized JavaScript origins**: `https://USERNAME.github.io`
     (hanya domain, **tanpa** `/physicslearn` dan tanpa garis miring di akhir).
   - Authorized redirect URIs: biarkan kosong.
4. **Create** → salin **Client ID** (berakhiran `.apps.googleusercontent.com`).

### D2. Simpan di aplikasi

Masuk sebagai guru → **Pengaturan → Keamanan** → tempel Client ID → **Simpan Client ID**. Tombol "Masuk dengan Google" langsung muncul di halaman masuk.

Client ID disimpan di Script Properties (bukan di kode atau spreadsheet). Layar hanya menampilkan versi tersamar. Untuk menghapusnya, ketik `__HAPUS__` lalu simpan.

---

## Bagian E — Memindahkan data siswa lama (impor)

Gunakan bagian ini bila Anda sudah punya daftar siswa di Excel, CSV, atau Google Sheets.

### E1. Siapkan data

Kolom yang dikenali (huruf besar/kecil tidak masalah, nama alternatif dalam kurung):

| Kolom | Wajib | Nama lain yang juga dikenali |
|---|---|---|
| **NIS** | ✅ | NISN, No Induk, Nomor Induk, Username |
| **Nama** | ✅ | Nama Lengkap, Nama Siswa |
| Email | – | E-mail, Email Google, Alamat Email |
| Kelas | – (bisa dipilih saat impor) | Nama Kelas, Rombel |

Unduh contoh dari tombol **Unduh templat CSV** di halaman Impor.

> NIS yang diawali angka nol (misalnya `0012345`) tetap terjaga. Di Excel, simpan kolom NIS sebagai **Text** agar nol di depan tidak hilang sebelum diimpor.

### E2. Jalankan impor

1. **Kelas & Siswa → Impor data**.
2. Pilih sumber: unggah berkas **CSV/Excel**, atau tempel **URL Google Spreadsheet** (spreadsheet harus dimiliki atau dibagikan ke akun pemilik aplikasi).
3. Klik **Pindai (tanpa menyimpan)** dahulu. Ini uji coba tanpa menulis apa pun: Anda melihat berapa siswa **baru**, **diperbarui**, **dilewati**, serta peringatan (NIS ganda, email ganda, nama kosong, dan lain-lain).
4. Bila hasil pindai sudah benar → **Jalankan impor**.

Aturan impor:
- **NIS adalah kunci.** Siswa yang NIS-nya sudah ada hanya diperbarui nama/email/kelasnya.
- **Aman diulang.** Menjalankan impor dua kali tidak membuat data ganda.
- **Tidak pernah menimpa** kata sandi atau status (aktif/nonaktif) siswa yang sudah ada.
- Kelas yang belum ada **dibuat otomatis** dari nama kelas.
- Siswa baru: sandi awal = NIS, wajib diganti saat masuk pertama.

### E3. Pindah ke aplikasi baru (cutover)

1. Impor seluruh data → periksa di Kelas & Siswa.
2. Coba masuk dengan 1–2 akun siswa.
3. Umumkan alamat situs dan tanggal mulai kepada siswa.
4. Sehari sebelum mulai, **jalankan impor sekali lagi** dari sumber yang sama untuk menangkap siswa yang baru ditambahkan (hanya data baru/berubah yang diproses).
5. Mulai hari H, hentikan pengisian di sistem lama agar tidak ada data yang tertinggal.

---

## Bagian F — Script Properties: mana yang otomatis, mana yang Anda isi

Semua ID dan rahasia aplikasi disimpan di **Script Properties** (Apps Script → ⚙️ Setelan proyek → Properti skrip). **Tidak ada** rahasia di kode, di spreadsheet, maupun di frontend.

| Properti | Diisi oleh | Keterangan |
|---|---|---|
| `SPREADSHEET_ID` | Otomatis (setup) | Database |
| `DRIVE_ROOT_FOLDER_ID` | Otomatis (setup) | Folder induk "PhysicsLearn" |
| `FOLDER_IDENTITAS`, `FOLDER_MATERI`, `FOLDER_TUGAS`, `FOLDER_PENGUMPULAN`, `FOLDER_SOAL`, `FOLDER_FOTO`, `FOLDER_CADANGAN` | Otomatis (setup) | Subfolder Drive |
| `SESSION_SECRET` | Otomatis (setup) | Kunci penanda login. **Jangan diubah/dihapus**: semua orang akan keluar |
| `EMERGENCY_USER`, `EMERGENCY_SALT`, `EMERGENCY_PASS_HASH` | Otomatis (setup) | Akses darurat; yang disimpan hanya hash, bukan sandi |
| `GOOGLE_CLIENT_ID` | **Anda**, lewat Pengaturan → Keamanan | Opsional, untuk login Google |
| `REV_…`, `DARURAT_KUNCI_SAMPAI` | Otomatis saat dipakai | Pencabutan sesi & penguncian akses darurat |
| `KEEP_WARM` | Otomatis bila Anda menjalankan `matikanKeepWarm` | Lihat Bagian H |

Anda **tidak perlu** mengetik apa pun di halaman Properti skrip. Satu-satunya nilai yang Anda isi (Client ID) dimasukkan dari dashboard.

Sheet `AppConfig` di spreadsheet hanya **catatan** ID folder/spreadsheet; mengubahnya tidak berpengaruh apa-apa.

**Jaga keamanan:**
- Jangan menambahkan orang lain sebagai **editor** proyek Apps Script. Editor dapat melihat Script Properties.
- Jangan membagikan spreadsheet database untuk diedit orang lain. Isinya memuat hash sandi (bukan sandi asli), tetapi tetap bersifat pribadi.
- Fungsi editor yang tersedia bila diperlukan:
  - `rotasiSecretSesi` → semua pengguna keluar dan harus masuk lagi.
  - `resetSandiGuru` → membuat sandi guru baru (tampil di log, wajib diganti).
  - `resetAksesDarurat` → membuat sandi darurat baru (tampil di log).

---

## Bagian G — Akses darurat

Halaman cadangan untuk masuk sebagai guru bila Anda lupa sandi atau login Google bermasalah.

- Alamat: `https://USERNAME.github.io/physicslearn/#/darurat` (tidak ditautkan dari halaman mana pun; simpan sendiri).
- Pengguna: `darurat`, sandi: dari log setup.
- Salah 5 kali → terkunci 15 menit. Setiap percobaan tercatat di sheet Log (tanpa sandi).
- Setelah dipakai, ganti sandinya di **Pengaturan → Keamanan → Ganti sandi darurat**. Sesi darurat lama otomatis dicabut.
- Lupa sandi darurat? Di editor Apps Script jalankan **`resetAksesDarurat`** → sandi baru muncul di log.

---

## Bagian H — Server tetap hangat (keepWarm) dan kuota

Setup memasang 3 jadwal otomatis (lihat ikon ⏰ **Pemicu** di Apps Script):

| Fungsi | Jadwal | Tugas |
|---|---|---|
| `keepWarm` | Tiap 5 menit | Menjaga cache server tetap terisi, menutup sesi yang lewat batas waktu (siswa yang belum absen dicatat alfa) |
| `tugasHarian` | Tiap hari ±01.00 WIB | Menutup sesi tertinggal, membersihkan pengingat lama |
| `cadanganMingguan` | Minggu ±02.00 WIB | Menyalin spreadsheet ke folder `07_Cadangan` (menyimpan 8 salinan terakhir) |

**Kuota:** akun Gmail biasa mendapat ±90 menit waktu jalan pemicu per hari (akun Google Workspace ±6 jam). `keepWarm` memakai ±10–20 menit per hari.

`keepWarm` menjamin **cache** tetap siap, tetapi tidak menjamin mesin Google selalu hangat. Permintaan pertama setelah lama tidak dipakai bisa butuh 2–5 detik.

Fungsi pengelola (jalankan dari editor):
- `matikanKeepWarm` → menghentikan keepWarm (misalnya saat libur panjang). Sesi yang kedaluwarsa tetap ditutup ketika data dibuka.
- `nyalakanKeepWarm` → menyalakan lagi.
- `cekPerforma` → menampilkan status cache (HANGAT/dingin), daftar pemicu, dan ukuran Script Properties.

---

## Bagian I — Cara memperbarui aplikasi

### Backend (Kode.gs baru)

1. Salin isi `Kode.gs` lama ke Notepad sebagai cadangan.
2. Tempel `Kode.gs` baru ke editor → **Simpan**.
3. Bila catatan rilis menyebutkannya, jalankan `setupAppEnvironment` sekali lagi (aman, tidak menghapus data).
4. **Terapkan → Kelola deployment → ✏️ Edit → Versi: Versi baru → Terapkan.**

> Jangan memilih "Deployment baru". Itu membuat URL `/exec` baru, sehingga frontend kehilangan sambungan.

### Frontend

1. Salin berkas baru ke folder `physicslearn-frontend` (timpa yang lama). **Jangan menimpa `js/config.js`** milik Anda.
2. Dari folder itu (bila pernah mengedit berkas langsung di github.com, jalankan `git pull` lebih dulu):

   ```bash
   git add .
   git commit -m "Update PhysicsLearn"
   git push
   ```

3. Tunggu 1–2 menit. Bila masih tampil versi lama, tekan **Ctrl+Shift+R** atau buka jendela Incognito.

---

## Kendala umum & solusinya

| Yang terlihat | Penyebab | Solusi |
|---|---|---|
| Layar "Alamat server belum diisi" (kode `CONTOH`/`KOSONG`) | `js/config.js` masih berisi `GANTI_DENGAN_ID_DEPLOYMENT` atau kosong | Isi URL `/exec` (B1). Paling cepat: edit `js/config.js` langsung di github.com (ikon pensil) |
| Layar "Berkas js/config.js tidak ditemukan" (kode `TIDAK_ADA`) | Berkas tidak ter-push, atau tercecer di luar folder `js` | Di github.com pastikan ada `js/config.js`. Bila berkas tercecer, push ulang dari folder `physicslearn-frontend` (B4–B5) |
| Layar "Memakai URL uji coba (/dev)" / "Ini bukan alamat Web App" | Yang ditempel URL `/dev`, alamat editor, atau alamat spreadsheet | Salin **URL aplikasi web** dari Terapkan → Kelola deployment (berakhiran `/exec`) |
| `git push` ditolak: `rejected … fetch first` | Ada perubahan yang dibuat langsung di github.com | Jalankan `git pull`, lalu `git push` lagi |
| "Aplikasi belum dipasang" | `setupAppEnvironment` belum dijalankan | Jalankan (A4) |
| "Server tidak merespons. Periksa koneksi lalu coba lagi." | Akses deployment bukan "Siapa saja", atau URL di `config.js` milik deployment lama | Periksa A7. Pastikan URL di `config.js` sama persis dengan Kelola deployment |
| Perubahan backend tidak muncul | Lupa membuat **Versi baru** | Bagian I langkah 4 |
| Situs GitHub "404 File not found" | Folder yang di-push salah (ada folder pembungkus) | Masuk ke folder yang berisi `index.html`, lalu `git init`, `git add .`, `git commit -m "Perbaiki"`, `git branch -M main`, `git remote add origin …`, `git push -u origin main --force` (menimpa isi repo yang salah) |
| Tampilan polos tanpa warna | Berkas CSS/JS tidak berada di folder `css/` dan `js/` | Unggah ulang lewat terminal dari folder yang strukturnya utuh |
| Tombol "Masuk dengan Google" tidak muncul | Client ID belum disimpan | Bagian D2 |
| Galat Google `origin_mismatch` | Origin belum didaftarkan atau salah tulis | Isi persis `https://USERNAME.github.io` (D1) |
| "Akun belum terdaftar, hubungi guru." | Email Google siswa belum ada di data | Tambahkan email siswa di Kelas & Siswa atau lewat impor |
| Hanya beberapa orang bisa login Google | OAuth consent screen masih "Testing" | **Publish app** (D1 langkah 2) |
| "Izin lokasi ditolak" | Browser memblokir lokasi | Ketuk ikon gembok di bilah alamat → Izinkan Lokasi → muat ulang |
| "Akurasi GPS terlalu rendah" | Di dalam ruangan / mode lokasi hemat daya | Aktifkan lokasi akurasi tinggi di HP, mendekat ke jendela, coba lagi |
| "Anda berada … m dari … (batas … m)" | Jarak melebihi radius lokasi | Periksa titik lokasi di Pengaturan → Lokasi, perbesar radius bila perlu |
| Unggah berkas ditolak | Melebihi batas ukuran (dokumen 10 MB, video 25 MB bawaan) | Kompres berkas, atau ubah batas di Pengaturan → Akademik (video maksimal sekitar 35 MB karena batas Apps Script) |
| Pratinjau materi tidak tampil untuk siswa | Domain sekolah (Google Workspace) melarang berbagi "siapa saja yang memiliki link" | Pakai akun Gmail pribadi sebagai pemilik aplikasi, atau minta admin domain mengizinkan |
| "Server sedang sibuk. Coba lagi beberapa detik lagi." | Banyak penyimpanan bersamaan | Tunggu beberapa detik lalu ulangi; jawaban ujian tetap tersimpan di perangkat |
| Siswa terkunci setelah salah sandi | 5× salah → kunci 15 menit | Tunggu, atau guru **Reset sandi** di Kelas & Siswa |

Untuk galat lain, buka browser → F12 → tab **Console**, dan di Apps Script buka menu **Eksekusi**. Pesan galat dari server memuat kode referensi pendek yang membantu pelacakan.

---

## Batasan yang perlu diketahui

- **GPS adalah bukti pendukung, bukan jaminan.** Aplikasi pemalsu lokasi (fake GPS) tetap mungkin dipakai. Server memeriksa jarak dan akurasi, tetapi guru tetap perlu memastikan kehadiran secara langsung.
- **Ujian online tidak bisa 100% mencegah kecurangan.** Aplikasi mengacak soal/opsi, menghitung waktu di server, dan mencatat berapa kali siswa berpindah tab, tetapi tidak dapat mengunci perangkat.
- **Kapasitas:** dirancang untuk satu guru dengan beberapa kelas ±45 siswa. Uji simulasi 45 siswa mengerjakan ujian bersamaan berjalan tanpa jawaban hilang. Google Sheets dibatasi 10 juta sel; untuk penggunaan satu guru, ini cukup untuk bertahun-tahun.
- **Waktu respons:** permintaan pertama setelah server lama tidak dipakai bisa 2–5 detik; berikutnya jauh lebih cepat berkat cache.
- **Berkas tugas siswa bersifat privat** (hanya pemilik aplikasi yang bisa membukanya). Materi dan lampiran tugas guru dibagikan "siapa saja yang memiliki link" agar bisa dipratinjau siswa.
- **Kuota harian Apps Script** (akun Gmail): ±20.000 panggilan layanan eksternal dan ±90 menit pemicu per hari. Penggunaan normal satu guru berada jauh di bawah batas ini.
