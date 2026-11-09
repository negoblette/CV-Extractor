# CV Extractor

Unggah CV (PDF atau DOCX berbasis teks, maks. 10 MB). Analisisnya berjalan dalam dua tahap:

1. **Cek format ATS.** CV yang tidak bisa dibaca sistem ATS ditolak, lengkap dengan daftar masalah
   dan cara memperbaikinya.
2. **Ekstraksi dan analisis.** Hanya untuk CV yang lolos. Isinya dipecah menjadi profil, pengalaman,
   pendidikan, keahlian, sertifikasi dan proyek, lengkap dengan skor per aspek, kekuatan, kekurangan,
   saran perbaikan dan kecocokan dengan posisi tujuan.

Di UI, nama penyedia dan model AI sengaja tidak disebut. Response API juga tidak membawa nama model.

## Setup

1. Buat API key gratis di <https://aistudio.google.com/app/apikey>.
2. Salin `.env.example` menjadi `.env.local`, lalu isi `GEMINI_API_KEY`.
3. Jalankan:

```bash
npm install
npm run dev
```

Buka <http://localhost:3000>.

## Cara kerja

- `app/api/analyze/route.js`: satu endpoint dengan `step=ats` (tahap 1) atau `step=extract`
  (tahap 2). Browser memanggil keduanya berurutan.
- `lib/cv-file.js`: membaca file dengan `unpdf` (PDF) atau `mammoth` + `jszip` (DOCX), lalu mengumpulkan
  sinyal format: jumlah kata yang terbaca mesin, tabel, text box, kolom ganda, dan kontak di header.
  PDF hasil scan langsung ditolak tanpa memanggil AI. PDF dikirim utuh ke AI supaya tata letaknya ikut
  dinilai.
- `lib/cv-schema.js`: skema JSON dan prompt untuk kedua tahap. Aturan lolos: skor ATS minimal 60 dan
  tidak ada masalah tingkat berat.
- `lib/gemini.js`: memanggil Gemini REST API dengan *structured output* (`lib/cv-schema.js`), jadi
  jawabannya selalu berupa JSON dengan bentuk yang tetap. Model default `gemini-3.5-flash` dengan thinking level `low` (sekitar 8 detik per CV). Kalau
  sibuk, kena batas kuota atau terlalu lama, aplikasi mencoba `gemini-3.1-flash-lite`, `gemini-2.5-flash`, lalu `gemini-flash-lite-latest`. Semuanya bisa diganti lewat
  `GEMINI_MODEL`, `GEMINI_FALLBACK_MODELS` dan `GEMINI_THINKING`. Tiap model dicoba ulang dengan jeda saat kena 503/429, lalu pindah ke model cadangan berikutnya.
- `app/components/`: UI (upload, status, hasil).

## Desain

Memakai skill **taste** (`.agents/skills/design-taste-frontend`). Hasil undiannya: palet
`charcoal-room-sage`, font Red Hat Display/Text + IBM Plex Mono, radius `soft`, tombol `tonal`, dan
hero `split`. File CSS/JS kit disalin ke `public/assets`. Token palet dan CSS halaman ada di
`app/globals.css`.

## Privasi

File tidak disimpan di server. Isinya hanya diteruskan ke Google Gemini. Pada paket gratis, Google
dapat memakai data yang dikirim untuk meningkatkan layanannya, jadi minta izin pemilik CV sebelum
mengunggah data orang lain.
