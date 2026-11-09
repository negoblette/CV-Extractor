// Membaca file CV di server: ambil teksnya dan kumpulkan sinyal format yang penting untuk ATS.
// Hasilnya dipakai di tahap 1 (cek ATS) dan tahap 2 (ekstraksi).
import mammoth from "mammoth";
import JSZip from "jszip";
import { extractText, getDocumentProxy } from "unpdf";

export const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
export const PDF = "application/pdf";
export const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export class CvFileError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function detectType(file) {
  const name = (file.name || "").toLowerCase();
  if (file.type === PDF || name.endsWith(".pdf")) return PDF;
  if (file.type === DOCX || name.endsWith(".docx")) return DOCX;
  return null;
}

const count = (xml, re) => (xml.match(re) || []).length;

/**
 * @returns {Promise<{type: string, name: string, buffer: Buffer, text: string, signals: object, hardFails: string[]}>}
 */
export async function readCvFile(file) {
  if (!file || typeof file === "string") throw new CvFileError("Pilih file CV terlebih dulu.");
  if (file.size === 0) throw new CvFileError("File kosong. Pilih file CV yang lain.");
  if (file.size > MAX_BYTES) throw new CvFileError("File lebih dari 10 MB. Kecilkan ukurannya lalu coba lagi.", 413);

  const name = file.name || "cv";
  if (/\.(png|jpe?g|webp|gif|heic)$/i.test(name) || /^image\//.test(file.type || "")) {
    throw new CvFileError("CV berupa gambar tidak bisa dibaca sistem ATS. Unggah CV dalam PDF atau DOCX berbasis teks.", 415);
  }
  if (/\.doc$/i.test(name)) throw new CvFileError("File .doc lama tidak didukung ATS modern. Simpan ulang sebagai .docx atau PDF.", 415);

  const type = detectType(file);
  if (!type) throw new CvFileError("Format belum didukung. Unggah CV dalam PDF atau DOCX.", 415);

  const buffer = Buffer.from(await file.arrayBuffer());
  return type === PDF ? readPdf(name, buffer) : readDocx(name, buffer);
}

async function readPdf(name, buffer) {
  let pages = 0;
  let text = "";
  try {
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const out = await extractText(pdf, { mergePages: true });
    pages = out.totalPages;
    text = (out.text || "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  } catch {
    throw new CvFileError("PDF tidak bisa dibuka. Mungkin rusak atau dikunci kata sandi.", 422);
  }

  const words = text.split(/\s+/).filter(Boolean).length;
  const hardFails = [];
  if (words < 25) {
    hardFails.push(
      "Teks di PDF tidak bisa dibaca mesin (kemungkinan hasil scan, foto, atau teks diubah jadi gambar). ATS akan melihat CV ini kosong.",
    );
  }

  return {
    type: PDF,
    name,
    buffer,
    text,
    hardFails,
    signals: {
      format: "PDF",
      halaman: pages,
      jumlahKataTerbaca: words,
      kataPerHalaman: pages ? Math.round(words / pages) : 0,
    },
  };
}

async function readDocx(name, buffer) {
  let text = "";
  let doc = "";
  let headerFooter = "";
  try {
    text = (await mammoth.extractRawText({ buffer })).value.replace(/\n{3,}/g, "\n\n").trim();
    const zip = await JSZip.loadAsync(buffer);
    doc = (await zip.file("word/document.xml")?.async("string")) || "";
    const hf = zip.file(/^word\/(header|footer)\d*\.xml$/);
    headerFooter = (await Promise.all(hf.map((f) => f.async("string")))).join(" ");
  } catch {
    throw new CvFileError("File Word tidak bisa dibaca. Coba simpan ulang sebagai PDF.", 422);
  }

  const words = text.split(/\s+/).filter(Boolean).length;
  const hfText = headerFooter.replace(/<[^>]+>/g, " ");
  const hardFails = [];
  if (words < 25) hardFails.push("Hampir tidak ada teks yang bisa dibaca di file Word ini.");

  return {
    type: DOCX,
    name,
    buffer,
    text,
    hardFails,
    signals: {
      format: "DOCX",
      jumlahKataTerbaca: words,
      tabel: count(doc, /<w:tbl>/g),
      textBox: count(doc, /<w:txbxContent>/g),
      gambarAtauIkon: count(doc, /<w:drawing>|<w:pict>/g),
      kolomGanda: /<w:cols[^>]*w:num="[2-9]"/.test(doc),
      kontakDiHeaderFooter: /@|\+?\d[\d\s-]{8,}/.test(hfText),
    },
  };
}
