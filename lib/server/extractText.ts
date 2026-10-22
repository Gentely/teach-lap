// Server-only — استخراج النص من PDF و Word قبل إرساله إلى Gemini
// يبقى GEMINI_API_KEY مخفياً تماماً على الخادم

// ملاحظة: نستخدم import ديناميكي حتى لا يتم تحزيم هذه المكتبات في client

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB لكل ملف
export const MAX_TOTAL_CHARS = 80000;
export const MIN_CHARS_PER_FILE = 10;

export type ExtractResult = {
  fileName: string;
  fileType: string;
  text: string;
  chars: number;
};

function detectType(file: File): "pdf" | "docx" | "unsupported" {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  if (name.endsWith(".pdf") || type === "application/pdf" || type.includes("pdf")) return "pdf";
  if (
    name.endsWith(".docx") ||
    type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    type.includes("wordprocessingml") ||
    type.includes("officedocument.word")
  )
    return "docx";
  return "unsupported";
}

async function extractPdf(buffer: Buffer): Promise<string> {
  // pdf-parse تعمل فقط على الخادم (Node)
  // نستوردها ديناميكياً لتجنب تضمينها في client
  const pdfParse = (await import("pdf-parse")).default as (data: Buffer) => Promise<{ text: string }>;
  const data = await pdfParse(buffer);
  return (data.text || "").trim();
}

async function extractDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return (result.value || "").trim();
}

export async function extractTextFromFile(file: File): Promise<ExtractResult> {
  const kind = detectType(file);

  if (kind === "unsupported") {
    throw new Error(`نوع الملف غير مدعوم: ${file.name} — السماح فقط .pdf و .docx / Unsupported file type: ${file.name} — only .pdf and .docx allowed`);
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`الملف كبير جداً: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB) — الحد 10 MB / File too large: ${file.name}`);
  }

  if (file.size === 0) {
    throw new Error(`الملف فارغ: ${file.name} / Empty file: ${file.name}`);
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let text = "";
  if (kind === "pdf") {
    text = await extractPdf(buffer);
  } else if (kind === "docx") {
    text = await extractDocx(buffer);
  }

  if (!text || text.trim().length < MIN_CHARS_PER_FILE) {
    throw new Error(`تعذر استخراج نص قابل للقراءة من: ${file.name} — قد يكون الملف صوراً ممسوحة بدون OCR / Could not extract readable text from: ${file.name}`);
  }

  return {
    fileName: file.name,
    fileType: kind,
    text,
    chars: text.length,
  };
}

export async function extractTextsFromFiles(files: File[]): Promise<{ combinedText: string; results: ExtractResult[] }> {
  const results: ExtractResult[] = [];

  for (const file of files) {
    // نتخطى العناصر غير-الملفات التي قد تأتي من FormData (مثلاً حقل نص فارغ)
    if (!(file instanceof File) || !file.name) continue;
    const r = await extractTextFromFile(file);
    results.push(r);
  }

  if (results.length === 0) {
    return { combinedText: "", results: [] };
  }

  // دمج النصوص مع عناوين الملفات حتى يعرف Gemini مصدر كل جزء
  const combinedText = results.map((r) => `--- ملف / File: ${r.fileName} ---\n${r.text}`).join("\n\n");

  return { combinedText, results };
}
