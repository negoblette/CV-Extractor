"use client";

import ScoreRing from "./ScoreRing";

const SUBSCORES = [
  ["kelengkapan", "Kelengkapan"],
  ["kejelasan", "Kejelasan"],
  ["dampak", "Pencapaian terukur"],
  ["keahlian", "Keahlian"],
];

const has = (arr) => Array.isArray(arr) && arr.length > 0;

function href(link) {
  if (!link) return null;
  if (/^https?:\/\//i.test(link)) return link;
  if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(link)) return `https://${link}`;
  return null;
}

function formatYears(n) {
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) return null;
  return `${v.toLocaleString("id-ID", { maximumFractionDigits: 1 })} thn pengalaman`;
}

function months(n) {
  const y = Math.floor(n / 12);
  const m = n % 12;
  return [y ? `${y} thn` : null, m ? `${m} bln` : null].filter(Boolean).join(" ") || "0 bln";
}

// Menjelaskan dari mana angka total pengalaman berasal.
function ExperienceMath({ r, years }) {
  if (!r) return null;
  const ranges = r.rentang || [];
  return (
    <div className="cv-math">
      <p className="cv-math__total">
        Total {years ? years.replace(" pengalaman", "") : months(r.totalBulan)}{" "}
        <span className="muted">({r.totalBulan} bln)</span>
      </p>
      <p className="cv-math__how">
        {ranges.map((x, i) => (
          <span key={i}>
            {i ? " + " : ""}
            {x.mulai} – {x.selesai} <span className="mono">({x.bulan} bln)</span>
          </span>
        ))}
        {ranges.length > 1 ? <> = {r.totalBulan} bln.</> : "."}
      </p>
      {r.tumpangTindihBulan > 0 ? (
        <p className="cv-math__note">
          Ada {r.tumpangTindihBulan} bln saat beberapa posisi berjalan bersamaan. Bulan itu dihitung sekali, jadi
          totalnya bukan {r.jumlahSemuaPosisiBulan} bln (jumlah durasi semua posisi).
        </p>
      ) : null}
      {ranges.length > 1 ? <p className="cv-math__note">Jeda di antara periode tidak dihitung.</p> : null}
    </div>
  );
}

function List({ items, variant, empty = "Tidak ada di CV." }) {
  if (!has(items)) return <p className="cv-empty">{empty}</p>;
  return (
    <ul className={`cv-list${variant ? ` cv-list--${variant}` : ""}`}>
      {items.map((t, i) => (
        <li key={i}>{t}</li>
      ))}
    </ul>
  );
}

function Chips({ items, accent }) {
  return (
    <div className="cv-chips">
      {items.map((t, i) => (
        <span key={i} className={`cv-chip${accent ? " cv-chip--accent" : ""}`}>
          {t}
        </span>
      ))}
    </div>
  );
}

export default function Results({ result, onReset, onDownload }) {
  const d = result.data || {};
  const p = d.profil || {};
  const skor = d.skor || {};
  const k = d.keahlian || {};
  const a = d.analisis || {};
  const match = d.kecocokan;
  const years = formatYears(d.totalPengalamanTahun);

  const skillGroups = [
    ["Teknis", k.teknis, true],
    ["Tools", k.tools, false],
    ["Soft skill", k.soft, false],
    ["Bahasa", k.bahasa, false],
  ].filter(([, items]) => has(items));

  return (
    <section className="section cv-results" id="hasil" aria-labelledby="hasil-h" tabIndex={-1}>
      <div className="wrap">
        {/* kepala: siapa kandidatnya */}
        <div className="cv-results__head">
          <div>
            <p className="cv-label">
              Hasil analisis · <span className="mono">{result.fileName}</span>
              {result.took ? ` · ${result.took} detik` : null}
            </p>
            <h2 id="hasil-h">{p.nama || "Nama tidak ditemukan"}</h2>
            {p.headline ? <p className="t-lead">{p.headline}</p> : null}
            <div className="cv-results__meta">
              {result.ats ? <span className="pill cv-chip--accent">Lolos ATS · skor {result.ats.skorAts}</span> : null}
              {d.tingkatKarier ? <span className="pill">{d.tingkatKarier}</span> : null}
              {years ? (
                <a className="pill cv-pill-link" href="#pengalaman" title="Lihat cara menghitungnya">
                  {years}
                </a>
              ) : null}
              {p.lokasi ? <span className="pill">{p.lokasi}</span> : null}
            </div>
            <div className="cv-contacts">
              {p.email ? <a href={`mailto:${p.email}`}>{p.email}</a> : null}
              {p.telepon ? <span>{p.telepon}</span> : null}
              {(p.tautan || []).map((l, i) => {
                const url = href(l);
                return url ? (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                    {l.replace(/^https?:\/\/(www\.)?/i, "")}
                  </a>
                ) : (
                  <span key={i}>{l}</span>
                );
              })}
            </div>
            {p.ringkasan ? <p className="cv-results__summary">{p.ringkasan}</p> : null}
          </div>
          <div className="cv-results__side">
            <ScoreRing value={skor.keseluruhan} size={148} font={48} label="skor CV" />
            <div className="btn-row">
              <button type="button" className="btn btn--secondary" onClick={onDownload}>
                Unduh JSON
              </button>
              <button type="button" className="btn btn--primary" onClick={onReset}>
                Unggah CV lain
              </button>
            </div>
          </div>
        </div>

        {/* skor per aspek */}
        <div className="cv-block">
          <h3>Skor per aspek</h3>
          <div className="cv-scores">
            {SUBSCORES.map(([key, label]) => {
              const s = skor[key] || {};
              const v = Math.max(0, Math.min(100, Math.round(Number(s.nilai) || 0)));
              return (
                <div className="card cv-score" key={key}>
                  <div className="cv-score__top">
                    <h4>{label}</h4>
                    <span className="cv-score__val">{v}</span>
                  </div>
                  <div className="cv-bar" aria-hidden="true">
                    <span style={{ width: `${v}%` }} />
                  </div>
                  {s.alasan ? <p>{s.alasan}</p> : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* kecocokan dengan posisi tujuan */}
        {match ? (
          <div className="cv-block">
            <h3>Kecocokan dengan posisi {match.posisi}</h3>
            <div className="card cv-match" style={{ padding: "var(--s-6)" }}>
              <ScoreRing value={match.nilai} size={112} font={34} label="cocok" />
              <div>
                <p className="t-lead">{match.kesimpulan}</p>
                <div className="cv-match__lists">
                  <div>
                    <span className="cv-label">Sudah sesuai</span>
                    <div style={{ marginTop: "var(--s-3)" }}>
                      <List items={match.sesuai} variant="plus" empty="Belum ada yang sesuai." />
                    </div>
                  </div>
                  <div>
                    <span className="cv-label">Masih kurang</span>
                    <div style={{ marginTop: "var(--s-3)" }}>
                      <List items={match.kurang} variant="minus" empty="Tidak ada catatan." />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* isi CV */}
        <div className="cv-cols">
          <div className="cv-block">
            <h3 id="pengalaman">Pengalaman kerja</h3>
            <ExperienceMath r={d.rincianPengalaman} years={years} />
            {has(d.pengalaman) ? (
              <ol className="cv-timeline">
                {d.pengalaman.map((x, i) => (
                  <li key={i}>
                    <h4>
                      {x.posisi} <span className="muted">di</span>{" "}
                      <span className="cv-timeline__org">{x.perusahaan}</span>
                    </h4>
                    <span className="cv-timeline__when">
                      {[x.periode, x.durasi].filter(Boolean).join(" · ")}
                    </span>
                    {has(x.poin) ? <List items={x.poin} /> : null}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="cv-empty">Tidak ada pengalaman kerja di CV.</p>
            )}
          </div>

          <div className="cv-stack">
            <div className="cv-block">
              <h3>Keahlian</h3>
              {skillGroups.length ? (
                skillGroups.map(([label, items, accent]) => (
                  <div className="cv-group" key={label}>
                    <span className="cv-label">{label}</span>
                    <Chips items={items} accent={accent} />
                  </div>
                ))
              ) : (
                <p className="cv-empty">Tidak ada keahlian di CV.</p>
              )}
            </div>

            <div className="cv-block">
              <h3>Pendidikan</h3>
              {has(d.pendidikan) ? (
                <ul className="cv-rows">
                  {d.pendidikan.map((x, i) => (
                    <li key={i}>
                      <span className="cv-rows__title">
                        {[x.gelar, x.jurusan].filter(Boolean).join(" ")}
                      </span>
                      <span>{x.institusi}</span>
                      <span className="cv-rows__sub">{[x.periode, x.nilai].filter(Boolean).join(" · ")}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="cv-empty">Tidak ada pendidikan di CV.</p>
              )}
            </div>

            {has(d.sertifikasi) ? (
              <div className="cv-block">
                <h3>Sertifikasi</h3>
                <ul className="cv-rows">
                  {d.sertifikasi.map((x, i) => (
                    <li key={i}>
                      <span className="cv-rows__title">{x.nama}</span>
                      <span className="cv-rows__sub">{[x.penerbit, x.tahun].filter(Boolean).join(" · ")}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {has(d.proyek) ? (
              <div className="cv-block">
                <h3>Proyek</h3>
                <ul className="cv-rows">
                  {d.proyek.map((x, i) => (
                    <li key={i}>
                      <span className="cv-rows__title">{x.nama}</span>
                      <span className="cv-rows__sub">{x.deskripsi}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>

        {/* analisis */}
        <div className="cv-block">
          <h3>Analisis dan saran</h3>
          <div className="cv-analysis">
            <div className="card">
              <h4>Kekuatan</h4>
              <List items={a.kekuatan} variant="plus" />
            </div>
            <div className="card">
              <h4>Perlu diperbaiki</h4>
              <List items={a.perluDiperbaiki} variant="minus" />
            </div>
            <div className="card">
              <h4>Saran perbaikan</h4>
              <List items={a.saran} variant="num" />
            </div>
          </div>
        </div>

        {has(a.posisiCocok) ? (
          <div className="cv-block">
            <h3>Posisi yang cocok</h3>
            <Chips items={a.posisiCocok} accent />
          </div>
        ) : null}

        <div className="cv-results__end">
          <p className="cv-note">Selesai membaca hasil ini? Unggah CV berikutnya untuk dianalisis.</p>
          <div className="btn-row">
            <button type="button" className="btn btn--primary" onClick={onReset}>
              Unggah CV lain
            </button>
            <button type="button" className="btn btn--secondary" onClick={onDownload}>
              Unduh JSON
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
