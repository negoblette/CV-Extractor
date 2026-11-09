"use client";

import { useEffect, useRef, useState } from "react";
import Results from "./Results";
import ScoreRing from "./ScoreRing";
import SiteNav from "./SiteNav";
import SiteFooter from "./SiteFooter";
import AtsTemplate from "./AtsTemplate";

const ACCEPT = ".pdf,.docx";
const MAX_BYTES = 10 * 1024 * 1024;

// phase: idle -> ats (tahap 1) -> extract (tahap 2) -> hasil menggantikan halaman upload
//                      \-> rejected (CV tidak ramah ATS)
const STEPS = [
  { key: "ats", label: "Cek format ATS" },
  { key: "extract", label: "Ekstraksi dan analisis isi" },
];

function ext(name = "") {
  const m = /\.([a-z0-9]+)$/i.exec(name);
  return m ? m[1].slice(0, 4) : "file";
}

function size(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toLocaleString("id-ID", { maximumFractionDigits: 1 })} MB`;
}

async function post(file, step, role, signal) {
  const body = new FormData();
  body.append("file", file);
  body.append("step", step);
  if (role) body.append("targetRole", role);
  const res = await fetch("/api/analyze", { method: "POST", body, signal });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Server menjawab ${res.status}.`);
  return json;
}

function UploadIcon() {
  return (
    <svg className="cv-drop__icon" viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <path d="M12 6h14l8 8v22a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M26 6v8h8" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M22 31V20m0 0-4.5 4.5M22 20l4.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Stepper({ phase }) {
  const state = (key) => {
    if (phase === "rejected") return key === "ats" ? "fail" : "skip";
    if (phase === key) return "now";
    if (phase === "extract" && key === "ats") return "done";
    return "wait";
  };
  const note = { done: "Selesai", now: "Berjalan", fail: "Ditolak", skip: "Dilewati", wait: "Menunggu" };
  return (
    <ol className="cv-stepper">
      {STEPS.map((s, i) => {
        const st = state(s.key);
        return (
          <li key={s.key} className={`is-${st}`}>
            <span className="cv-stepper__dot" aria-hidden="true">
              {st === "done" ? "✓" : st === "fail" ? "✕" : i + 1}
            </span>
            <span className="cv-stepper__label">
              Tahap {i + 1}: {s.label}
            </span>
            <span className="cv-stepper__state">{note[st]}</span>
          </li>
        );
      })}
    </ol>
  );
}

export default function CvApp() {
  const [file, setFile] = useState(null);
  const [role, setRole] = useState("");
  const [phase, setPhase] = useState("idle");
  const [error, setError] = useState("");
  const [ats, setAts] = useState(null);
  const [result, setResult] = useState(null);
  const [over, setOver] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const inputRef = useRef(null);
  const abortRef = useRef(null);
  const startRef = useRef(0);
  const busy = phase === "ats" || phase === "extract";

  // lapisan motion kit taste (entrance hero, hover) dimuat setelah hydration
  useEffect(() => {
    if (document.querySelector("script[data-kit-motion]")) return;
    const s = document.createElement("script");
    s.type = "module";
    s.src = "/assets/motion/motion.js";
    s.dataset.kitMotion = "";
    document.body.appendChild(s);
  }, []);

  // Landing satu layar tanpa scroll. Kunci hanya bila hero benar-benar muat di layar,
  // supaya tombol tidak pernah tersembunyi. Halaman hasil selalu bisa di-scroll.
  useEffect(() => {
    const root = document.documentElement;
    const hero = document.querySelector(".cv-hero");
    const update = () => {
      const fits = hero ? hero.scrollHeight <= window.innerHeight + 1 : false;
      root.classList.toggle("is-locked", !result && fits);
    };
    update();
    window.addEventListener("resize", update);
    // amati isi hero juga: tinggi hero tetap, tapi isinya bisa berubah (font dimuat, form berganti)
    const ro = hero ? new ResizeObserver(update) : null;
    if (hero) [hero, ...hero.querySelectorAll(".hero__text, .cv-frame")].forEach((el) => ro.observe(el));
    return () => {
      window.removeEventListener("resize", update);
      ro?.disconnect();
      root.classList.remove("is-locked");
    };
  }, [result]);

  // hitung detik selama menunggu
  useEffect(() => {
    if (!busy) return;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 500);
    return () => clearInterval(id);
  }, [busy]);

  // hasil muncul: halaman upload diganti hasil, mulai dari atas
  useEffect(() => {
    if (!result) return;
    window.scrollTo({ top: 0 });
    document.getElementById("hasil")?.focus({ preventScroll: true });
  }, [result]);

  function pick(f) {
    setError("");
    if (!f) return;
    if (/\.(png|jpe?g|webp|gif|heic)$/i.test(f.name)) {
      setError("CV berupa gambar tidak bisa dibaca sistem ATS. Unggah CV dalam PDF atau DOCX berbasis teks.");
      return;
    }
    if (!/\.(pdf|docx)$/i.test(f.name)) {
      setError("Format belum didukung. Unggah CV dalam PDF atau DOCX.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("File lebih dari 10 MB. Kecilkan ukurannya lalu coba lagi.");
      return;
    }
    setFile(f);
  }

  async function analyze(e) {
    e.preventDefault();
    if (!file || busy) return;
    setError("");
    setAts(null);
    setElapsed(0);
    startRef.current = Date.now();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const target = role.trim();

    try {
      // tahap 1: cek format ATS
      setPhase("ats");
      const check = await post(file, "ats", "", ctrl.signal);
      setAts(check.ats);
      if (!check.lolos) {
        setPhase("rejected");
        return;
      }

      // tahap 2: ekstraksi dan analisis
      setPhase("extract");
      const out = await post(file, "extract", target, ctrl.signal);
      const took = Math.round((Date.now() - startRef.current) / 1000);
      setResult({ fileName: out.fileName, data: out.data, ats: check.ats, took });
      setPhase("idle");
    } catch (err) {
      setPhase("idle");
      if (err.name !== "AbortError") setError(err.message || "Analisis gagal. Coba lagi.");
    } finally {
      abortRef.current = null;
    }
  }

  function reset() {
    abortRef.current?.abort();
    setFile(null);
    setRole("");
    setAts(null);
    setResult(null);
    setPhase("idle");
    setError("");
    if (inputRef.current) inputRef.current.value = "";
    window.scrollTo({ top: 0 });
  }

  function download() {
    if (!result) return;
    const payload = { ats: result.ats, ...result.data };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(result.fileName || "cv").replace(/\.[^.]+$/, "")}-analisis.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ---------------------------------------------------------------- halaman hasil
  if (result) {
    return (
      <>
        <SiteNav onHome={reset} />
        <main id="top">
          <Results result={result} onReset={reset} onDownload={download} />
        </main>
        <SiteFooter />
      </>
    );
  }

  // ---------------------------------------------------------------- halaman upload (satu layar)
  const title = { idle: "Analisis baru", ats: "Tahap 1 dari 2", extract: "Tahap 2 dari 2", rejected: "CV ditolak" }[phase];
  const meta = busy ? `${elapsed} dtk` : phase === "idle" ? "PDF · DOCX" : file?.name || "";

  return (
    <>
      <SiteNav onHome={reset} />
      <main id="top">
        <section className="hero hero--split cv-hero" data-enter aria-labelledby="hero-h">
          <div className="wrap">
            <div className="hero-text grid hero__grid">
              <div className="hero__text span-5">
                <p className="hero__kicker">
                  <span className="dot" aria-hidden="true"></span>Gratis, tanpa akun
                </p>
                <h1 id="hero-h">Analisis CV otomatis untuk rekruter</h1>
                <p className="hero__lead">
                  Tahap pertama memeriksa apakah CV bisa dibaca sistem ATS. CV yang lolos lalu dipecah menjadi
                  profil, pengalaman, pendidikan dan keahlian, lengkap dengan skor dan saran.
                </p>
                <AtsTemplate />
              </div>

              <div className="span-6 start-7 cv-frame-wrap">
                <div className="cv-frame">
                  <div className="cv-frame__bar">
                    <span className="cv-frame__title">{title}</span>
                    <span className="cv-frame__meta">{meta}</span>
                  </div>

                  <div className="cv-frame__body">
                    {phase === "idle" ? (
                      <form onSubmit={analyze} noValidate className="cv-form">
                        {file ? (
                          <div className="cv-file">
                            <span className="cv-file__type" aria-hidden="true">
                              {ext(file.name)}
                            </span>
                            <div className="cv-file__text">
                              <div className="cv-file__name">{file.name}</div>
                              <div className="cv-file__size">{size(file.size)}</div>
                            </div>
                            <button
                              type="button"
                              className="cv-icon-btn"
                              aria-label="Hapus file"
                              onClick={() => {
                                setFile(null);
                                if (inputRef.current) inputRef.current.value = "";
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                              </svg>
                            </button>
                          </div>
                        ) : null}

                        <label
                          className={`cv-drop${over ? " is-over" : ""}${file ? " is-compact" : ""}`}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setOver(true);
                          }}
                          onDragLeave={() => setOver(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setOver(false);
                            pick(e.dataTransfer.files?.[0]);
                          }}
                        >
                          <input
                            ref={inputRef}
                            type="file"
                            accept={ACCEPT}
                            onChange={(e) => pick(e.target.files?.[0])}
                            aria-describedby="drop-hint"
                          />
                          {!file ? <UploadIcon /> : null}
                          <span className="cv-drop__title">
                            {file ? "Ganti file CV" : "Tarik file CV ke sini atau klik untuk memilih"}
                          </span>
                          <span className="cv-drop__hint" id="drop-hint">
                            PDF atau DOCX berbasis teks, maksimal 10 MB
                          </span>
                        </label>

                        <div className="cv-field">
                          <label htmlFor="role">
                            Posisi tujuan <span className="muted">(opsional)</span>
                          </label>
                          <input
                            id="role"
                            name="role"
                            type="text"
                            maxLength={120}
                            autoComplete="off"
                            placeholder="Contoh: Product Analyst"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                          />
                        </div>

                        <button type="submit" className="btn btn--primary cv-submit" disabled={!file}>
                          Analisis CV
                          <svg className="m-arrow" viewBox="0 0 12 12" aria-hidden="true">
                            <path className="m-arrow__stem" d="M1 6h8" />
                            <path className="m-arrow__head" d="M4.5 2.5 8 6l-3.5 3.5" />
                          </svg>
                        </button>

                        {error ? (
                          <p className="cv-error" role="alert">
                            {error}
                          </p>
                        ) : (
                          <p className="cv-note">CV diproses oleh AI dan tidak disimpan di server ini.</p>
                        )}
                      </form>
                    ) : busy ? (
                      <div className="cv-busy" role="status" aria-live="polite">
                        <Stepper phase={phase} />
                        <p className="cv-busy__title">
                          {phase === "ats" ? "Memeriksa apakah CV bisa dibaca sistem ATS" : "Format lolos. AI sedang mengekstrak isi CV"}
                        </p>
                        <div className="cv-track" aria-hidden="true"></div>
                        <p className="cv-note">
                          {phase === "ats"
                            ? "Tata letak, tabel, kolom, judul bagian dan teks yang bisa dibaca mesin diperiksa lebih dulu."
                            : "Biasanya selesai dalam 10 sampai 40 detik. Hasilnya langsung tampil setelah selesai."}
                        </p>
                        <div className="btn-row">
                          <button type="button" className="btn btn--secondary" onClick={reset}>
                            Batalkan analisis
                          </button>
                        </div>
                      </div>
                    ) : phase === "rejected" && ats ? (
                      <div className="cv-reject" role="alert">
                        <Stepper phase={phase} />
                        <div className="cv-reject__head">
                          <ScoreRing value={ats.skorAts} size={88} font={28} label="ATS" />
                          <div>
                            <p className="cv-busy__title">
                              {ats.adalahCv === false ? "File ini bukan CV" : "CV belum ramah ATS"}
                            </p>
                            <p className="cv-note">{ats.ringkasan}</p>
                          </div>
                        </div>
                        <div className="btn-row">
                          <button type="button" className="btn btn--primary" onClick={reset}>
                            Unggah CV lain
                          </button>
                        </div>
                        {ats.masalah?.length ? (
                          <ul className="cv-issues" aria-label="Masalah format yang perlu diperbaiki">
                            {ats.masalah.map((m, i) => (
                              <li key={i}>
                                <span className={`cv-tag cv-tag--${m.tingkat}`}>{m.tingkat}</span>
                                <div>
                                  <p className="cv-issues__title">{m.judul}</p>
                                  <p className="cv-issues__fix">{m.saran}</p>
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
