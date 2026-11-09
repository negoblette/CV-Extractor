// Hitungan tanggal pengalaman dikerjakan kode, bukan AI, supaya hasilnya pasti dan konsisten.
// AI hanya mengembalikan `mulai` / `selesai` ("YYYY-MM", "YYYY", atau "sekarang").

function nowMonthIndex(now = new Date()) {
  // bulan berjalan di zona Asia/Jakarta
  const [y, m] = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit" })
    .format(now)
    .split("-")
    .map(Number);
  return y * 12 + (m - 1);
}

/** "2022-03" -> indeks bulan; "2022" -> Januari (awal) atau Desember (akhir); "sekarang" -> bulan ini. */
function parseMonth(value, isEnd, now) {
  if (value == null) return null;
  const v = String(value).trim().toLowerCase();
  if (!v) return null;
  if (/^(sekarang|present|now|current|saat ini|kini)$/.test(v)) return nowMonthIndex(now);
  let m = /^(\d{4})-(\d{1,2})$/.exec(v);
  if (m) {
    const month = Number(m[2]);
    if (month < 1 || month > 12) return null;
    return Number(m[1]) * 12 + (month - 1);
  }
  m = /^(\d{4})$/.exec(v);
  if (m) return Number(m[1]) * 12 + (isEnd ? 11 : 0);
  return null;
}

function formatDuration(months) {
  const y = Math.floor(months / 12);
  const m = months % 12;
  return [y ? `${y} thn` : null, m ? `${m} bln` : null].filter(Boolean).join(" ") || "< 1 bln";
}

/**
 * Lengkapi data hasil AI: `durasi` per pengalaman dan `totalPengalamanTahun`
 * (bulan dihitung inklusif, periode yang tumpang tindih tidak dihitung dua kali).
 */
export function applyExperienceMath(data, now = new Date()) {
  const current = nowMonthIndex(now);
  const ranges = [];

  const pengalaman = (data.pengalaman || []).map((item) => {
    const start = parseMonth(item.mulai, false, now);
    let end = parseMonth(item.selesai, true, now);
    if (start == null || end == null) return { ...item, durasi: null };
    end = Math.min(end, current);
    if (end < start) return { ...item, durasi: null };
    ranges.push([start, end]);
    return { ...item, durasi: formatDuration(end - start + 1) };
  });

  // gabungkan rentang yang tumpang tindih (atau bersambung)
  const sum = ranges.reduce((n, [s, e]) => n + (e - s + 1), 0);
  const merged = [];
  for (const [s, e] of [...ranges].sort((a, b) => a[0] - b[0])) {
    const last = merged[merged.length - 1];
    if (last && s <= last[1] + 1) last[1] = Math.max(last[1], e);
    else merged.push([s, e]);
  }
  const total = merged.reduce((n, [s, e]) => n + (e - s + 1), 0);

  return {
    ...data,
    pengalaman,
    totalPengalamanTahun: ranges.length ? Math.round((total / 12) * 10) / 10 : null,
    // rincian untuk ditampilkan: bagaimana total di atas didapat
    rincianPengalaman: ranges.length
      ? {
          totalBulan: total,
          jumlahSemuaPosisiBulan: sum,
          tumpangTindihBulan: sum - total,
          rentang: merged.map(([s, e]) => ({
            mulai: monthLabel(s),
            selesai: e === current ? "sekarang" : monthLabel(e),
            bulan: e - s + 1,
          })),
        }
      : null,
  };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
function monthLabel(index) {
  return `${MONTHS[index % 12]} ${Math.floor(index / 12)}`;
}

/** Skor keseluruhan = rata-rata empat skor aspek (bukan angka bebas dari AI). */
export function applyScoreMath(data) {
  const s = data.skor;
  if (!s) return data;
  const parts = ["kelengkapan", "kejelasan", "dampak", "keahlian"]
    .map((k) => Number(s[k]?.nilai))
    .filter((n) => Number.isFinite(n));
  if (!parts.length) return data;
  const avg = Math.round(parts.reduce((a, b) => a + b, 0) / parts.length);
  return { ...data, skor: { ...s, keseluruhan: avg } };
}
