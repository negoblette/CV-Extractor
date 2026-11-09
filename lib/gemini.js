// Hanya dipakai di server (route handler): API key dan nama model tidak pernah sampai ke browser.
// Pesan error untuk pengguna sengaja tidak menyebut penyedia AI.

const API = "https://generativelanguage.googleapis.com/v1beta/models";

// Model gratis (free tier Google AI Studio). Bisa diganti lewat GEMINI_MODEL.
// Diuji Nov 2026: gemini-3.5-flash + thinking "low" ~8 dtk per CV dan teliti; gemini-flash-latest
// (3.8) sering 503 "high demand" dan bisa >200 dtk dengan skema ini.
// Model free tier sering kena lonjakan "503 high demand" sesaat. Karena itu tiap model dicoba ulang
// dengan jeda, lalu pindah ke rantai model cadangan (bisa diganti lewat GEMINI_FALLBACK_MODELS,
// dipisah koma). Semua percobaan dibatasi DEADLINE_MS supaya tetap di bawah maxDuration route.
const PRIMARY = process.env.GEMINI_MODEL || "gemini-3.5-flash";
const FALLBACKS = (process.env.GEMINI_FALLBACK_MODELS || "gemini-3.1-flash-lite,gemini-2.5-flash,gemini-flash-lite-latest")
  .split(",")
  .map((s) => s.trim())
  .filter((m) => m && m !== PRIMARY);
// "low" | "medium" | "high" | "none" (tanpa thinkingConfig, untuk model lama seperti 2.5)
const THINKING = process.env.GEMINI_THINKING || "low";
const CALL_TIMEOUT_MS = 45_000;
const DEADLINE_MS = 100_000;
// jeda sebelum percobaan ulang pada model yang sama (ms)
const PRIMARY_RETRIES = [1_500, 4_000];
const FALLBACK_RETRIES = [2_000];
const RETRYABLE = [429, 500, 502, 503, 504];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class AiError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}

/**
 * Minta jawaban JSON dengan bentuk `schema`.
 * @param {{ parts: object[], prompt: string, schema: object }} input
 *   parts: bagian konten berisi CV (inlineData untuk PDF, atau text)
 */
export async function generateJson({ parts, prompt, schema }) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new AiError("Layanan AI belum dikonfigurasi di server (API key kosong).", 500);
  }

  const body = {
    contents: [{ role: "user", parts: [...parts, { text: prompt }] }],
    // temperature 0 + seed tetap: input yang sama sebisa mungkin menghasilkan jawaban yang sama
    generationConfig: { temperature: 0, seed: 7, responseMimeType: "application/json", responseSchema: schema },
  };

  const deadline = Date.now() + DEADLINE_MS;
  const plan = [
    { model: PRIMARY, thinking: THINKING, retries: PRIMARY_RETRIES },
    ...FALLBACKS.map((model) => ({ model, thinking: "none", retries: FALLBACK_RETRIES })),
  ];
  let lastError;

  for (const { model, thinking, retries } of plan) {
    for (let attempt = 0; attempt <= retries.length; attempt++) {
      const left = deadline - Date.now();
      if (left < 5_000) throw lastError || aiError("AI terlalu lama menjawab. Coba lagi sebentar lagi.", 504);
      try {
        const data = await callModel(model, key, body, thinking, Math.min(CALL_TIMEOUT_MS, left));
        console.info(`[ai] ${model} ok${attempt ? ` (percobaan ${attempt + 1})` : ""}`);
        return data;
      } catch (err) {
        lastError = err;
        console.warn(`[ai] ${model} gagal (percobaan ${attempt + 1}): ${err.detail || err.message}`);
        // Error yang bukan soal kapasitas (API key salah, permintaan ditolak) tidak dicoba ulang.
        if (!(err instanceof AiError) || !RETRYABLE.includes(err.status)) throw err;
        // Model hilang/terlalu lama: langsung ke model berikutnya, jangan tunggu ulang.
        if (err.status === 504 || err.status === 500 || err.status === 502) break;
        if (attempt < retries.length) await sleep(Math.min(retries[attempt], Math.max(0, deadline - Date.now() - 5_000)));
      }
    }
  }
  throw lastError;
}

function aiError(message, status, detail) {
  const e = new AiError(message, status);
  e.detail = detail;
  return e;
}

async function callModel(model, key, body, thinking, timeoutMs = CALL_TIMEOUT_MS) {
  const withThinking =
    thinking && thinking !== "none"
      ? { ...body, generationConfig: { ...body.generationConfig, thinkingConfig: { thinkingLevel: thinking } } }
      : body;

  let res;
  try {
    res = await fetch(`${API}/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify(withThinking),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    const timedOut = err?.name === "TimeoutError";
    throw aiError(
      timedOut ? "AI terlalu lama menjawab. Coba lagi sebentar lagi." : "Server tidak bisa menghubungi layanan AI. Coba lagi.",
      504,
      err?.message,
    );
  }

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = json?.error?.message || res.statusText;
    // Model yang tidak mendukung thinkingLevel: ulangi tanpa thinkingConfig.
    if (res.status === 400 && thinking !== "none" && /thinking/i.test(msg)) {
      return callModel(model, key, body, "none", timeoutMs);
    }
    if (res.status === 400 && /api key/i.test(msg)) throw aiError("API key layanan AI tidak valid.", 401, msg);
    if (res.status === 403) throw aiError("API key tidak punya akses ke layanan AI.", 403, msg);
    if (res.status === 404) throw aiError("Model AI yang diatur di server tidak ditemukan.", 500, msg);
    if (res.status === 429) throw aiError("Batas pemakaian AI sedang habis. Tunggu satu menit lalu coba lagi.", 429, msg);
    if (res.status >= 500) throw aiError("Layanan AI sedang sibuk. Coba lagi sebentar lagi.", 503, msg);
    throw aiError("Permintaan ditolak layanan AI. Coba file lain.", 400, msg);
  }

  const candidate = json?.candidates?.[0];
  const text = candidate?.content?.parts?.map((p) => p.text || "").join("");
  if (!text) {
    const reason = json?.promptFeedback?.blockReason || candidate?.finishReason || "kosong";
    throw aiError("AI tidak mengembalikan hasil. Coba lagi.", 502, reason);
  }

  try {
    return JSON.parse(text);
  } catch {
    throw aiError("Jawaban AI tidak bisa dibaca. Coba lagi.", 502, "invalid json");
  }
}
