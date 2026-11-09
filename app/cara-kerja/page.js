import Link from "next/link";
import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";

export const metadata = {
  title: "Cara kerja CV Extractor: cek ATS lalu analisis isi CV",
  description: "Dua tahap analisis: format CV diperiksa dulu untuk sistem ATS, lalu isi CV yang lolos diekstrak dan dinilai.",
};

const CHECKS = [
  ["Teks terbaca mesin", "Bukan hasil scan, foto, atau teks yang diubah jadi gambar."],
  ["Satu kolom", "Urutan baca jelas dari atas ke bawah, tanpa kolom samping yang mengacak isi."],
  ["Tanpa tabel dan text box", "Pengalaman, pendidikan dan kontak tidak disimpan di tabel, text box, atau header."],
  ["Judul bagian standar", "Pengalaman, Pendidikan, Keahlian, atau padanan Inggrisnya."],
  ["Keahlian sebagai teks", "Tanpa bar, bintang, atau ikon sebagai pengganti tulisan."],
  ["Format file", "PDF berbasis teks atau DOCX. Gambar dan .doc lama langsung ditolak."],
];

export default function CaraKerja() {
  return (
    <>
      <SiteNav current="cara-kerja" />
      <main id="top" className="cv-page">
        <div className="wrap">
          <div className="cv-page__head">
            <h1>Dua tahap, dari file ke ringkasan</h1>
            <p>
              CV yang tidak bisa dibaca sistem ATS tidak akan sampai ke rekruter. Karena itu formatnya diperiksa
              dulu, dan hanya CV yang lolos yang lanjut dianalisis.
            </p>
          </div>

          <div className="cv-steps-grid">
            <div className="card">
              <span className="cv-step-num">Tahap 1</span>
              <h3>Cek format ATS</h3>
              <p>
                Teks diambil dari file seperti cara ATS membacanya, lalu tata letaknya dinilai. Skor di bawah 60 atau
                satu masalah berat membuat CV ditolak, lengkap dengan cara memperbaikinya.
              </p>
            </div>
            <div className="card">
              <span className="cv-step-num">Tahap 2</span>
              <h3>Ekstraksi isi CV</h3>
              <p>
                Profil, kontak, pengalaman, pendidikan, keahlian, sertifikasi dan proyek disusun ke format tetap yang
                bisa diunduh sebagai JSON.
              </p>
            </div>
            <div className="card">
              <span className="cv-step-num">Hasil</span>
              <h3>Skor dan saran</h3>
              <p>
                Empat skor aspek, kekuatan, kekurangan, saran perbaikan, dan kecocokan dengan posisi tujuan bila
                diisi.
              </p>
            </div>
          </div>

          <div className="cv-split">
            <div>
              <h2>Yang diperiksa di tahap 1</h2>
              <p>Kriteria ini mengikuti cara umum ATS membaca CV. Isi dan kualitas kandidat belum dinilai di sini.</p>
            </div>
            <ul className="cv-checks">
              {CHECKS.map(([t, d]) => (
                <li key={t}>
                  <strong>{t}</strong>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="btn-row">
            <Link className="btn btn--primary" href="/">
              Analisis CV
            </Link>
            <Link className="btn btn--secondary" href="/privasi">
              Baca kebijakan privasi
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
