import { readCvFile, CvFileError, PDF } from "@/lib/cv-file";
import { generateJson, AiError } from "@/lib/gemini";
import { ATS_SCHEMA, CV_SCHEMA, buildAtsPrompt, buildPrompt } from "@/lib/cv-schema";
import { applyExperienceMath, applyScoreMath } from "@/lib/experience";
import { cacheGet, cacheKey, cacheSet, normalizeText } from "@/lib/cache";

// Naikkan bila skema atau prompt berubah, supaya hasil lama di cache tidak dipakai.
const VERSION = "3";

export const maxDuration = 120;

// Dua tahap, dipanggil berurutan oleh browser:
//   step=ats      tahap 1: apakah format CV bisa dibaca ATS? Bila tidak, CV ditolak.
//   step=extract  tahap 2: ekstraksi isi dan analisis (hanya untuk CV yang lolos tahap 1).

function fail(message, status = 400) {
  return Response.json({ error: message }, { status });
}

// Tahap 1: PDF dikirim utuh supaya AI bisa menilai tata letaknya (itu inti cek ATS).
// DOCX tidak bisa dilihat AI secara visual, jadi dinilai dari teks dan sinyal teknisnya.
function atsParts(cv) {
  if (cv.type === PDF) return [{ inlineData: { mimeType: PDF, data: cv.buffer.toString("base64") } }];
  return [{ text: `Isi CV (teks dari file Word):\n"""\n${cv.text.slice(0, 60_000)}\n"""` }];
}

// Tahap 2: PDF dan DOCX sama-sama dikirim sebagai teks hasil ekstraksi, jadi CV dengan isi yang sama
// mendapat input yang sama. Aman karena CV yang sampai sini sudah lolos tahap 1 (teksnya terbaca rapi).
function textParts(cv) {
  return [{ text: `Isi CV:\n"""\n${cv.text.slice(0, 60_000)}\n"""` }];
}

async function atsStep(cv) {
  // Gagal teknis yang pasti (teks tidak terbaca): langsung tolak tanpa memanggil AI.
  if (cv.hardFails.length) {
    return {
      lolos: false,
      ats: {
        adalahCv: true,
        skorAts: 0,
        ringkasan: "CV ini tidak bisa dibaca mesin, jadi sistem ATS akan menganggapnya kosong.",
        masalah: cv.hardFails.map((judul) => ({
          tingkat: "berat",
          judul,
          saran: "Ekspor ulang CV dari Word atau Google Docs sebagai PDF berbasis teks, bukan hasil scan atau foto.",
        })),
        sudahBaik: [],
      },
    };
  }

  const key = cacheKey("ats", VERSION, cv.buffer);
  const cached = cacheGet(key);
  if (cached) return cached;

  const ats = await generateJson({
    parts: atsParts(cv),
    prompt: buildAtsPrompt(cv.signals, cv.text),
    schema: ATS_SCHEMA,
  });

  const masalah = Array.isArray(ats.masalah) ? ats.masalah : [];
  const skor = Math.max(0, Math.min(100, Math.round(Number(ats.skorAts) || 0)));
  const lolos = Boolean(ats.adalahCv) && skor >= 60 && !masalah.some((m) => m.tingkat === "berat");

  const result = { lolos, ats: { ...ats, skorAts: skor, masalah, lolos } };
  cacheSet(key, result);
  return result;
}

async function extractStep(cv, targetRole) {
  if (cv.hardFails.length) throw new CvFileError(cv.hardFails[0], 422);
  const key = cacheKey("extract", VERSION, normalizeText(cv.text), targetRole.trim().toLowerCase());
  let raw = cacheGet(key);
  if (!raw) {
    raw = await generateJson({ parts: textParts(cv), prompt: buildPrompt(targetRole), schema: CV_SCHEMA });
    cacheSet(key, raw);
  }
  // hitungan dikerjakan kode setiap kali, jadi "sekarang" selalu memakai bulan berjalan
  return applyScoreMath(applyExperienceMath(raw));
}

export async function POST(request) {
  let form;
  try {
    form = await request.formData();
  } catch {
    return fail('Kirim file CV sebagai form-data dengan nama field "file".');
  }

  const step = String(form.get("step") || "ats");
  if (step !== "ats" && step !== "extract") return fail('Nilai "step" harus "ats" atau "extract".');
  const targetRole = String(form.get("targetRole") || "").slice(0, 120);

  try {
    const cv = await readCvFile(form.get("file"));
    if (step === "ats") {
      const { lolos, ats } = await atsStep(cv);
      return Response.json({ step, fileName: cv.name, lolos, ats });
    }
    const data = await extractStep(cv, targetRole);
    return Response.json({ step, fileName: cv.name, data });
  } catch (err) {
    if (err instanceof CvFileError || err instanceof AiError) return fail(err.message, err.status);
    console.error("[analyze]", err);
    return fail("Terjadi kesalahan di server. Coba lagi.", 500);
  }
}
