# PhysicsLearn — LMS Pembelajaran Fisika

Frontend PhysicsLearn v1.0.0: aplikasi web statis (HTML/CSS/JavaScript tanpa framework) yang memanggil backend Google Apps Script sebagai REST API JSON.

Panduan pemasangan lengkap: **[PANDUAN-INSTALASI.md](PANDUAN-INSTALASI.md)**.

## Fitur

| Guru (admin) | Siswa |
|---|---|
| Dashboard ringkasan + grafik | Beranda: sesi berjalan, tombol Hadir, tenggat dekat, progres |
| Sesi & absensi berbasis GPS (radius + akurasi diverifikasi server) | Absen hadir saat sesi berlangsung |
| Kelas & siswa, persetujuan pendaftaran, reset sandi | Daftar dengan kode kelas atau masuk dengan Google |
| Impor data siswa (CSV/Excel/Google Sheets) dengan pindai uji coba | Pengingat tugas & materi baru |
| Materi (PDF, video, gambar, tautan, simulasi) per topik | Materi dengan pratinjau dan rumus (KaTeX) |
| Tugas/LKPD + pemeriksaan & penilaian berdampingan | Unggah jawaban (PDF, gambar, Word, video) dengan progres |
| Bank soal (PG, isian, uraian) + impor | Ujian/latihan bertimer, tersimpan otomatis |
| Ujian: penyusun 3 langkah, pantau langsung, koreksi uraian, rilis nilai | Hasil ujian & rapor nilai |
| Laporan: grafik, rekap nilai, ekspor CSV | Profil, foto, ganti sandi |
| Pengaturan: nama, logo, tema warna, lokasi, akademik, keamanan, sistem | Tema mengikuti pengaturan guru (termasuk mode gelap) |

## Struktur

```
index.html          ← halaman tunggal (router hash: #/beranda, #/g/beranda, …)
css/style.css       ← sistem desain "Orbit Blue"
js/config.js        ← URL Web App /exec (satu-satunya yang Anda ubah)
js/api.js           ← klien API: cache lokal, penggabung batch, unggah dengan progres
js/ui.js            ← komponen UI (modal, toast, kartu, format, GPS)
js/icons.js         ← ikon SVG
js/charts.js        ← grafik SVG
js/app.js           ← router, shell, tema, login
js/siswa.js         ← halaman siswa
js/guru.js, guru2.js← halaman guru
```

## Keamanan

- `js/config.js` hanya berisi URL `/exec`. Tidak ada token, sandi, atau kunci di frontend.
- Semua rahasia (kunci sesi, hash sandi darurat, Client ID Google) ada di Script Properties di server.
- Login memakai token bertanda tangan HMAC, berlaku 7 hari, dan bisa dicabut ("Keluar dari semua perangkat").

## Hasil uji (simulator Apps Script di Node.js + Chromium)

Angka di bawah diukur di simulator, bukan di server Google sungguhan.

- **Backend: 121/121 lulus**, meliputi setup idempoten, login & penguncian, impor (aman diulang, nol di depan NIS terjaga), GPS di luar radius/akurasi rendah ditolak, ujian, laporan, pengaturan, dan audit "tidak ada rahasia di spreadsheet".
- **45 siswa ujian bersamaan:** 225 simpan otomatis tanpa satu pun penulisan ke Sheets, tidak ada jawaban hilang.
- **Browser: 39/39 lulus, 0 galat JavaScript**, untuk guru (desktop & HP) dan siswa (HP & desktop), termasuk buka sesi via GPS, unggah tugas, mengerjakan & mengirim ujian, dan tema gelap.

## Memperbarui

```bash
git add .
git commit -m "Update PhysicsLearn"
git push
```

Lalu tekan Ctrl+Shift+R di browser bila tampilan lama masih muncul.
