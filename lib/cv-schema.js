// Struktur JSON yang wajib dikembalikan Gemini (structured output).
// Format: subset OpenAPI 3.0 yang didukung `generationConfig.responseSchema`.

const str = { type: "STRING" };
const strList = { type: "ARRAY", items: str };
const nullableStr = { type: "STRING", nullable: true };

const subScore = {
  type: "OBJECT",
  properties: {
    nilai: { type: "INTEGER", description: "0 sampai 100" },
    alasan: { type: "STRING", description: "Satu kalimat pendek." },
  },
  required: ["nilai", "alasan"],
  propertyOrdering: ["nilai", "alasan"],
};

export const CV_SCHEMA = {
  type: "OBJECT",
  properties: {
    profil: {
      type: "OBJECT",
      properties: {
        nama: nullableStr,
        headline: { type: "STRING", description: "Peran atau posisi utama kandidat, singkat." },
        lokasi: nullableStr,
        email: nullableStr,
        telepon: nullableStr,
        tautan: { ...strList, description: "LinkedIn, GitHub, portofolio, situs pribadi." },
        ringkasan: { type: "STRING", description: "Ringkasan profil 2 sampai 3 kalimat." },
      },
      required: ["nama", "headline", "ringkasan", "tautan"],
      propertyOrdering: ["nama", "headline", "lokasi", "email", "telepon", "tautan", "ringkasan"],
    },
    tingkatKarier: {
      type: "STRING",
      enum: ["Fresh graduate", "Junior", "Menengah", "Senior", "Lead / Manajer", "Eksekutif"],
    },
    // totalPengalamanTahun dan durasi TIDAK diminta dari AI: dihitung di kode (lib/experience.js)
    // dari `mulai` dan `selesai`, karena AI tidak konsisten saat berhitung.
    pengalaman: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          posisi: str,
          perusahaan: str,
          periode: { type: "STRING", description: "Periode persis seperti tertulis di CV. Contoh: Jan 2021 – Sekarang" },
          mulai: { type: "STRING", nullable: true, description: 'Bulan mulai, format "YYYY-MM" (atau "YYYY" bila bulan tidak ditulis). null bila tidak ada.' },
          selesai: { type: "STRING", nullable: true, description: 'Bulan selesai, format "YYYY-MM" atau "YYYY". Tulis "sekarang" bila masih berjalan (Sekarang / Present / Now). null bila tidak ada.' },
          poin: { ...strList, description: "Tanggung jawab dan pencapaian utama, maksimal 4." },
        },
        required: ["posisi", "perusahaan", "periode", "mulai", "selesai", "poin"],
        propertyOrdering: ["posisi", "perusahaan", "periode", "mulai", "selesai", "poin"],
      },
    },
    pendidikan: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          institusi: str,
          gelar: str,
          jurusan: nullableStr,
          periode: nullableStr,
          nilai: { type: "STRING", nullable: true, description: "IPK atau nilai bila ada." },
        },
        required: ["institusi", "gelar"],
        propertyOrdering: ["institusi", "gelar", "jurusan", "periode", "nilai"],
      },
    },
    keahlian: {
      type: "OBJECT",
      properties: {
        teknis: strList,
        tools: strList,
        soft: strList,
        bahasa: { ...strList, description: "Bahasa beserta tingkatnya, contoh: Inggris (aktif)." },
      },
      required: ["teknis", "tools", "soft", "bahasa"],
      propertyOrdering: ["teknis", "tools", "soft", "bahasa"],
    },
    sertifikasi: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: { nama: str, penerbit: nullableStr, tahun: nullableStr },
        required: ["nama"],
        propertyOrdering: ["nama", "penerbit", "tahun"],
      },
    },
    proyek: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: { nama: str, deskripsi: str },
        required: ["nama", "deskripsi"],
        propertyOrdering: ["nama", "deskripsi"],
      },
    },
    skor: {
      type: "OBJECT",
      properties: {
        keseluruhan: { type: "INTEGER", description: "0 sampai 100" },
        kelengkapan: subScore,
        kejelasan: subScore,
        dampak: { ...subScore, description: "Seberapa banyak pencapaian yang terukur (angka, hasil)." },
        keahlian: subScore,
      },
      required: ["keseluruhan", "kelengkapan", "kejelasan", "dampak", "keahlian"],
      propertyOrdering: ["keseluruhan", "kelengkapan", "kejelasan", "dampak", "keahlian"],
    },
    analisis: {
      type: "OBJECT",
      properties: {
        kekuatan: { ...strList, description: "3 sampai 5 poin." },
        perluDiperbaiki: { ...strList, description: "3 sampai 5 poin." },
        saran: { ...strList, description: "3 sampai 5 saran konkret untuk memperbaiki CV." },
        posisiCocok: { ...strList, description: "3 sampai 5 posisi yang cocok." },
      },
      required: ["kekuatan", "perluDiperbaiki", "saran", "posisiCocok"],
      propertyOrdering: ["kekuatan", "perluDiperbaiki", "saran", "posisiCocok"],
    },
    kecocokan: {
      type: "OBJECT",
      nullable: true,
      description: "Isi hanya bila posisi tujuan diberikan; selain itu null.",
      properties: {
        posisi: str,
        nilai: { type: "INTEGER", description: "0 sampai 100" },
        kesimpulan: { type: "STRING", description: "Satu sampai dua kalimat." },
        sesuai: strList,
        kurang: strList,
      },
      required: ["posisi", "nilai", "kesimpulan", "sesuai", "kurang"],
      propertyOrdering: ["posisi", "nilai", "kesimpulan", "sesuai", "kurang"],
    },
  },
  required: [
    "profil",
    "tingkatKarier",
    "pengalaman",
    "pendidikan",
    "keahlian",
    "sertifikasi",
    "proyek",
    "skor",
    "analisis",
  ],
  propertyOrdering: [
    "profil",
    "tingkatKarier",
    "pengalaman",
    "pendidikan",
    "keahlian",
    "sertifikasi",
    "proyek",
    "skor",
    "analisis",
    "kecocokan",
  ],
};

// ---------------------------------------------------------------- tahap 1: cek format ATS

export const ATS_SCHEMA = {
  type: "OBJECT",
  properties: {
    adalahCv: { type: "BOOLEAN", description: "Apakah dokumen ini benar-benar CV / resume." },
    skorAts: { type: "INTEGER", description: "0 sampai 100: seberapa mudah CV ini dibaca sistem ATS." },
    lolos: { type: "BOOLEAN", description: "true hanya bila adalahCv, skorAts >= 60, dan tidak ada masalah tingkat berat." },
    ringkasan: { type: "STRING", description: "Satu sampai dua kalimat kesimpulan untuk pemilik CV." },
    masalah: {
      type: "ARRAY",
      description: "Masalah format yang menghambat ATS, dari yang paling berat. Kosong bila tidak ada.",
      items: {
        type: "OBJECT",
        properties: {
          tingkat: { type: "STRING", enum: ["berat", "sedang", "ringan"] },
          judul: { type: "STRING", description: "Nama masalah, singkat." },
          saran: { type: "STRING", description: "Satu kalimat cara memperbaikinya." },
        },
        required: ["tingkat", "judul", "saran"],
        propertyOrdering: ["tingkat", "judul", "saran"],
      },
    },
    sudahBaik: { type: "ARRAY", items: { type: "STRING" }, description: "Hal format yang sudah ramah ATS, maksimal 4." },
  },
  required: ["adalahCv", "skorAts", "lolos", "ringkasan", "masalah", "sudahBaik"],
  propertyOrdering: ["adalahCv", "skorAts", "lolos", "ringkasan", "masalah", "sudahBaik"],
};

export function buildAtsPrompt(signals, extractedText) {
  return [
    "Kamu adalah spesialis rekrutmen yang paham cara kerja Applicant Tracking System (ATS).",
    "Nilai apakah FORMAT CV terlampir bisa dibaca ATS dengan benar. Jangan menilai kualitas isi atau kandidatnya.",
    "",
    "Kriteria CV ramah ATS:",
    "- Teks bisa dipilih dan dibaca mesin, bukan gambar atau hasil scan.",
    "- Tata letak satu kolom atau sederhana; urutan baca jelas dari atas ke bawah.",
    "- Informasi penting (pengalaman, pendidikan, keahlian, kontak) tidak disimpan di tabel, text box, kolom samping, header/footer, atau gambar.",
    "- Judul bagian standar, misalnya Pengalaman / Experience, Pendidikan / Education, Keahlian / Skills.",
    "- Tidak memakai grafik, bar atau bintang untuk tingkat keahlian, ikon sebagai pengganti teks, atau foto yang menutupi teks.",
    "- Tanggal dan jabatan ditulis konsisten dan bisa dibaca sebagai teks.",
    "- Font standar dan kontak ditulis sebagai teks biasa.",
    "",
    "Tingkat masalah:",
    "- berat: membuat ATS kehilangan atau salah membaca informasi inti (dua kolom yang mengacak urutan, pengalaman di dalam tabel/text box, teks sebagai gambar, tidak ada judul bagian sama sekali).",
    "- sedang: mengurangi akurasi (ikon/bar keahlian, judul bagian tidak standar, kontak di header).",
    "- ringan: kosmetik.",
    "",
    `Data teknis hasil pemeriksaan file (fakta, pakai sebagai bukti): ${JSON.stringify(signals)}`,
    "Berikut teks yang berhasil diambil mesin dari file. Bila urutannya acak atau informasi yang terlihat di dokumen tidak muncul di sini, itu tanda ATS akan salah membaca:",
    '"""',
    (extractedText || "(kosong)").slice(0, 12_000),
    '"""',
    "",
    "Tulis semua teks dalam Bahasa Indonesia yang lugas. Bila dokumen bukan CV, isi adalahCv false dan lolos false.",
  ].join("\n");
}

// ---------------------------------------------------------------- tahap 2: ekstraksi dan analisis

export function buildPrompt(targetRole) {
  const role = targetRole?.trim();
  return [
    "Kamu adalah rekruter senior yang membaca CV dengan teliti.",
    "Ekstrak isi CV terlampir ke dalam struktur JSON yang diminta, lalu beri analisis singkat.",
    "",
    "Aturan:",
    "- Tulis semua teks analisis dalam Bahasa Indonesia yang jelas dan lugas.",
    "- Nama orang, nama perusahaan, nama institusi, judul jabatan dan nama tools ditulis persis seperti di CV.",
    "- Jangan mengarang data. Bila sebuah informasi tidak ada di CV, isi null atau array kosong.",
    "- Urutkan pengalaman dan pendidikan dari yang terbaru.",
    "- Untuk tiap pengalaman, isi mulai dan selesai dari tanggal yang tertulis. Jangan menghitung durasi atau total tahun.",
    "",
    "Rubrik skor (ikuti persis supaya CV yang sama selalu mendapat skor yang sama, kelipatan 5):",
    "- kelengkapan: mulai 0, tambah 20 bila ada email atau telepon, 10 bila ada ringkasan profil, 30 bila ada pengalaman lengkap dengan tanggal, 20 bila ada pendidikan, 20 bila ada daftar keahlian.",
    "- kejelasan: 90 bila semua bagian berjudul jelas dan poin ringkas; 75 bila ada sedikit poin yang panjang atau kabur; 60 bila banyak paragraf panjang; 40 bila sulit diikuti.",
    "- dampak: hitung persentase poin pengalaman yang memuat angka atau hasil terukur. 0% = 30, 1-24% = 50, 25-49% = 65, 50-74% = 80, 75% ke atas = 90.",
    "- keahlian: 85 bila keahlian spesifik (nama tools/teknologi) dan terlihat dipakai di pengalaman atau proyek; 70 bila spesifik tapi tidak terlihat dipakai; 50 bila umum; 30 bila hampir tidak ada.",
    "- keseluruhan: rata-rata keempat skor di atas, dibulatkan.",
    "- tingkatKarier: berdasarkan tanggal pengalaman dan jabatan. Belum ada pengalaman kerja penuh waktu = Fresh graduate; kurang dari 2 tahun = Junior; 2-5 tahun = Menengah; lebih dari 5 tahun = Senior; memimpin tim = Lead / Manajer.",
    "",
    "- Saran harus konkret dan bisa langsung dikerjakan, bukan nasihat umum.",
    role
      ? `- Posisi tujuan: "${role.slice(0, 120)}". Isi bagian "kecocokan" untuk posisi ini.`
      : '- Tidak ada posisi tujuan. Isi "kecocokan" dengan null.',
    "- Bila file ternyata bukan CV, isi profil.headline dengan \"Bukan CV\" dan jelaskan di profil.ringkasan.",
  ].join("\n");
}
