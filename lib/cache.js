import { createHash } from "node:crypto";

// Cache sederhana di memori server: isi CV yang sama tidak dianalisis ulang, jadi hasilnya identik.
// Hilang saat server restart. Tidak menyimpan file, hanya hasil JSON, dan dibatasi jumlah + umurnya.
const MAX_ENTRIES = 200;
const TTL_MS = 24 * 60 * 60 * 1000;
const store = globalThis.__cvCache || (globalThis.__cvCache = new Map());

export function cacheKey(...parts) {
  const h = createHash("sha256");
  for (const p of parts) h.update(typeof p === "string" ? p : Buffer.from(p)).update("\u0000");
  return h.digest("hex");
}

export function cacheGet(key) {
  const hit = store.get(key);
  if (!hit) return undefined;
  if (Date.now() - hit.at > TTL_MS) {
    store.delete(key);
    return undefined;
  }
  // segarkan urutan (LRU)
  store.delete(key);
  store.set(key, hit);
  return hit.value;
}

export function cacheSet(key, value) {
  store.set(key, { at: Date.now(), value });
  while (store.size > MAX_ENTRIES) store.delete(store.keys().next().value);
}

/** Teks CV dinormalisasi supaya PDF dan DOCX dengan isi sama menghasilkan kunci yang sama. */
export function normalizeText(text) {
  return String(text || "")
    .normalize("NFKC")
    .replace(/[•●▪■◦·∙•●]/g, " ")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
