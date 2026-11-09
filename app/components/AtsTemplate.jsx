// Pratinjau template CV ramah ATS. Isinya sengaja diblur: yang dilihat adalah bentuknya
// (satu kolom, judul bagian standar, poin, tanpa tabel/ikon/foto), bukan teksnya.

const Lines = ({ widths }) =>
  widths.map((w, i) => <span key={i} className="cv-tpl__line" style={{ width: `${w}%` }} />);

export default function AtsTemplate() {
  return (
    <figure className="cv-tpl" aria-label="Contoh bentuk template CV ramah ATS: satu kolom, judul bagian standar, daftar poin, tanpa tabel atau ikon">
      <div className="cv-tpl__page" aria-hidden="true">
        <div className="cv-tpl__blur">
          <p className="cv-tpl__name">NAMA LENGKAP</p>
          <p className="cv-tpl__contact">Posisi · Kota · email@domain.com · linkedin.com/in/nama</p>

          <p className="cv-tpl__h">RINGKASAN</p>
          <Lines widths={[100, 94, 62]} />

          <p className="cv-tpl__h">PENGALAMAN KERJA</p>
          <div className="cv-tpl__row">
            <span className="cv-tpl__role">Jabatan, Nama Perusahaan</span>
            <span className="cv-tpl__date">Jan 2022 – Sekarang</span>
          </div>
          <ul className="cv-tpl__bullets">
            <li><Lines widths={[92]} /></li>
            <li><Lines widths={[84]} /></li>
            <li><Lines widths={[70]} /></li>
          </ul>
          <div className="cv-tpl__row">
            <span className="cv-tpl__role">Jabatan, Nama Perusahaan</span>
            <span className="cv-tpl__date">Jul 2019 – Des 2021</span>
          </div>
          <ul className="cv-tpl__bullets">
            <li><Lines widths={[88]} /></li>
            <li><Lines widths={[76]} /></li>
          </ul>

          <p className="cv-tpl__h">PENDIDIKAN</p>
          <div className="cv-tpl__row">
            <span className="cv-tpl__role">S1 Jurusan, Nama Universitas</span>
            <span className="cv-tpl__date">2015 – 2019</span>
          </div>

          <p className="cv-tpl__h">KEAHLIAN</p>
          <Lines widths={[96, 58]} />
        </div>
      </div>
      <figcaption className="cv-tpl__cap">
        <span className="cv-tpl__title">Contoh template CV ramah ATS</span>
        <ul className="cv-tpl__list">
          <li>Satu kolom</li>
          <li>Judul bagian standar</li>
          <li>Poin, bukan tabel</li>
          <li>Keahlian sebagai teks</li>
          <li>Tanpa foto dan ikon</li>
        </ul>
      </figcaption>
    </figure>
  );
}
