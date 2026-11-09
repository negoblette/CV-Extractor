import Link from "next/link";

// Header tetap (kit taste: .nav). `current` menandai halaman aktif; `children` untuk tautan tambahan.
// `onHome`: dipakai di halaman utama. Link ke "/" dari "/" tidak mengubah state, jadi logo
// memanggil fungsi ini untuk kembali ke tampilan upload (hasil/penolakan dibuang).
export default function SiteNav({ current, children, onHome }) {
  const item = (href, label, key) => (
    <div className="nav__item">
      <Link className="nav__link" href={href} aria-current={current === key ? "page" : undefined}>
        {label}
      </Link>
    </div>
  );

  return (
    <header className="nav cv-nav">
      <div className="wrap nav__bar">
        <a className="skip-link" href="#top">
          Lewati ke konten
        </a>
        <Link
          className="nav__logo"
          href="/"
          aria-label="CV Extractor, kembali ke unggah CV"
          onClick={
            onHome
              ? (e) => {
                  e.preventDefault();
                  onHome();
                }
              : undefined
          }
        >
          <span className="mark" data-mark="arc" aria-hidden="true"></span>
          CV Extractor
        </Link>
        <nav className="nav__links" aria-label="Utama">
          {children}
          {item("/cara-kerja", "Cara kerja", "cara-kerja")}
          {item("/privasi", "Privasi", "privasi")}
        </nav>
      </div>
    </header>
  );
}
