import Link from "next/link";
import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";

export const metadata = {
  title: "Privasi CV Extractor: apa yang terjadi pada file CV",
  description: "File CV tidak disimpan di server CV Extractor. Isinya hanya diteruskan ke layanan AI untuk dianalisis.",
};

export default function Privasi() {
  return (
    <>
      <SiteNav current="privasi" />
      <main id="top" className="cv-page">
        <div className="wrap">
          <div className="cv-page__head">
            <h1>Privasi data CV</h1>
            <p>CV berisi data pribadi. Ini yang terjadi pada file sejak diunggah sampai hasilnya tampil.</p>
          </div>

          <div className="cv-prose">
            <section>
              <h2>File tidak disimpan</h2>
              <p>
                File dibaca di memori server untuk satu kali analisis, lalu dibuang. Tidak ada database, riwayat, atau
                salinan file di server ini. Hasil analisis hanya ada di browser kamu sampai halaman ditutup atau
                dimuat ulang.
              </p>
            </section>
            <section>
              <h2>Diteruskan ke layanan AI</h2>
              <p>
                Untuk dianalisis, isi CV dikirim ke penyedia layanan AI pihak ketiga. Layanan ini memakai paket gratis,
                dan pada paket gratis <strong>penyedia dapat memakai data yang dikirim untuk meningkatkan
                layanannya</strong>. Jangan unggah CV yang berisi data sangat sensitif seperti NIK, nomor rekening,
                atau data kesehatan.
              </p>
            </section>
            <section>
              <h2>CV milik orang lain</h2>
              <p>
                Bila kamu rekruter, minta izin kandidat sebelum mengunggah CV mereka, sesuai UU Pelindungan Data
                Pribadi.
              </p>
            </section>
            <section>
              <h2>Hasil AI bisa keliru</h2>
              <p>
                Skor dan saran dibuat otomatis. Pakai sebagai bahan pertimbangan, bukan satu-satunya dasar untuk
                menerima atau menolak kandidat.
              </p>
            </section>
          </div>

          <div className="btn-row">
            <Link className="btn btn--primary" href="/">
              Analisis CV
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
