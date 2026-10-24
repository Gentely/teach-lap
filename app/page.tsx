"use client";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { generateMarkdown } from "@/lib/markdown";
import ExportButtons from "@/components/ExportButtons";
import HistoryPanel from "@/components/HistoryPanel";
import GenerationSummary from "@/components/GenerationSummary";
import Link from "next/link";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function HomePage() {
  const { t, locale } = useI18n();
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [lang, setLang] = useState("en");
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [resultMeta, setResultMeta] = useState<any>(null);
  const [error, setError] = useState("");
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [role, setRole] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isRTL = locale === "ar";

  useEffect(() => {
    fetch("/api/me").then(r => r.json()).then(j => { if (j.success) setRole(j.data.role); }).catch(()=>{});
  }, []);

  const isStudent = role === "student";

  function addFiles(newFiles: FileList | File[]) {
    const arr = Array.from(newFiles);
    const allowed = arr.filter((f) => {
      const n = f.name.toLowerCase();
      return n.endsWith(".pdf") || n.endsWith(".docx") || f.type.includes("pdf") || f.type.includes("wordprocessingml") || f.type.includes("officedocument");
    });
    if (allowed.length !== arr.length) {
      setError(locale === "ar" ? "تم تجاهل ملفات غير مدعومة — السماح فقط .pdf و .docx" : "Some files ignored — only .pdf and .docx are allowed");
    }
    setFiles((prev) => [...prev, ...allowed].slice(0, 10));
  }
  function removeFile(idx: number) { setFiles((prev) => prev.filter((_, i) => i !== idx)); }
  function handleDrop(e: React.DragEvent) { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files); }
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) { if (e.target.files?.length) addFiles(e.target.files); if (fileInputRef.current) fileInputRef.current.value = ""; }
  const totalPasted = text.length;
  const filesCount = files.length;

  async function handleGenerate() {
    if (isStudent) return setError(locale === "ar" ? "الطلاب لا يمكنهم استخدام التوليد — انتقل إلى مقرراتي" : "Students cannot generate — go to My Courses");
    if (text.trim().length === 0 && files.length === 0) return setError(locale === "ar" ? "الصق نصاً أو ارفع ملفاً واحداً على الأقل (الحد الأدنى 40 حرفاً)" : "Paste some text or upload at least one file (minimum 40 characters)");
    setLoading(true); setError(""); setResult(null); setResultMeta(null);
    try {
      const formData = new FormData();
      formData.set("title", title); formData.set("text", text); formData.set("outputLanguage", lang);
      for (const f of files) formData.append("files", f);
      const res = await fetch("/api/generate", { method: "POST", body: formData });
      const j = await res.json();
      if (!res.ok || !j.success) throw new Error(j.error?.message || (locale === "ar" ? "فشل التوليد" : "Generation failed"));
      setResult(j.data); setResultMeta(j.meta || null); setHistoryRefresh((k) => k + 1);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }
  function handleClear() { setTitle(""); setText(""); setFiles([]); setResult(null); setResultMeta(null); setError(""); }
  const currentMarkdown = result ? generateMarkdown(result, { title: title || text.slice(0, 60) || "lecture", createdAt: resultMeta?.generatedAt, model: resultMeta?.model, outputLanguage: lang }) : "";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir={isRTL ? "rtl" : "ltr"}>
      <div className="bg-gradient-to-br from-[#0B3C49] via-[#0F4C5C] to-[#14657A] text-white rounded-3xl p-8">
        <h2 className="text-3xl font-black">{t.heroTitle}</h2>
        <p className="text-white/80 mt-2 max-w-3xl leading-relaxed">{t.heroSubtitle}</p>
        {isStudent && (
          <div className="mt-4 rounded-2xl bg-amber-400 text-[#0B3C49] px-4 py-3 text-sm font-bold">
            {isRTL ? "أنت مسجل كطالب — لا يمكنك استخدام توليد Gemini. انتقل إلى مقرراتك لعرض مواد أساتذتك." : "You are registered as a student — you cannot use Gemini generation. Go to My Courses to view your teachers' materials."}
            <Link href="/courses" className="ms-3 underline font-black">{isRTL ? "الذهاب إلى مقرراتي →" : "Go to My Courses →"}</Link>
          </div>
        )}
        {!isStudent && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/courses" className="px-4 py-2 rounded-xl bg-white text-[#0B3C49] text-xs font-black">{isRTL ? "مقرراتي — مساحتي الخاصة" : "My Courses — my private space"}</Link>
            <span className="px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs">Role: {role || "…"}</span>
          </div>
        )}
      </div>

      {/* --- Teacher generation UI — hidden/disabled for students --- */}
      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <section className={`lg:col-span-2 bg-white rounded-3xl shadow border border-slate-100 overflow-hidden ${isStudent ? "opacity-60 pointer-events-none" : ""}`}>
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h3 className="font-black text-[#0B3C49]">{t.inputTitle}</h3>
            <span className="text-xs text-slate-500">{totalPasted} {t.chars} {filesCount > 0 && `+ ${filesCount} ${isRTL ? "ملفات" : "files"}`}</span>
          </div>
          <div className="p-6 space-y-4">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t.lectureTitlePh} className="w-full rounded-xl border-2 border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#0F4C5C]" />
            <select value={lang} onChange={(e) => setLang(e.target.value)} className="w-full rounded-xl border-2 border-slate-200 px-4 py-2.5 text-sm bg-white">
              <option value="en">English</option><option value="ar">العربية</option><option value="bilingual">Bilingual — ثنائي اللغة</option>
            </select>
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">{t.lectureTextLabel}</label>
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} placeholder={t.lectureTextPh} className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm leading-7 min-h-[160px] outline-none focus:border-[#0F4C5C]" />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 block">{t.uploadLabel}</label>
              <p className="text-[11px] text-slate-500 leading-relaxed">{t.uploadDesc}</p>
              <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()} className={`relative rounded-2xl border-2 border-dashed px-6 py-8 text-center cursor-pointer transition ${dragOver ? "border-[#0F4C5C] bg-[#F2F9FB]" : "border-slate-200 bg-slate-50 hover:bg-white hover:border-[#0F4C5C]/40"}`}>
                <input ref={fileInputRef} type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" multiple onChange={handleInputChange} className="hidden" />
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-[#0F4C5C] text-white grid place-items-center text-lg">📎</div>
                  <p className="text-sm font-bold text-[#0B3C49]">{dragOver ? t.uploadDropActive : t.uploadBrowse}</p>
                  <p className="text-[11px] text-slate-500">{t.uploadHint}</p>
                </div>
              </div>
              {files.length > 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                  <p className="text-xs font-black text-[#0B3C49] mb-2">{t.filesSelected} ({files.length})</p>
                  <ul className="space-y-2">
                    {files.map((f, idx) => {
                      const isPdf = f.name.toLowerCase().endsWith(".pdf");
                      return (
                        <li key={`${f.name}-${idx}`} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span className={`shrink-0 text-[10px] font-black px-2 py-1 rounded-lg text-white ${isPdf ? "bg-red-500" : "bg-blue-600"}`}>{isPdf ? t.fileTypePdf : t.fileTypeDocx}</span>
                            <div className="min-w-0"><p className="text-xs font-bold text-slate-800 truncate max-w-[200px] sm:max-w-[320px]">{f.name}</p><p className="text-[10px] text-slate-500">{formatBytes(f.size)}</p></div>
                          </div>
                          <button type="button" onClick={(e) => { e.stopPropagation(); removeFile(idx); }} className="shrink-0 text-[11px] font-bold text-red-600 hover:text-red-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1">{t.removeFile}</button>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">{t.pastedAndFilesHint}</p>
                </div>
              ) : <p className="text-[11px] text-slate-400 text-center py-1">{t.noFiles}</p>}
            </div>
            <div className="flex gap-2">
              <button onClick={handleGenerate} disabled={loading || isStudent} className="flex-1 py-3 rounded-xl bg-[#0F4C5C] text-white font-black disabled:opacity-60 disabled:cursor-not-allowed">{loading ? t.uploading : t.generateBtn}</button>
              <button onClick={handleClear} disabled={loading} className="px-5 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm">{t.clearBtn}</button>
            </div>
            {error && <p className="text-xs text-red-600 bg-red-50 rounded-xl p-3 border border-red-100 leading-relaxed">{error}</p>}
          </div>
        </section>

        <section className="bg-white rounded-3xl shadow border border-slate-100 p-6">
          <h4 className="font-black text-[#0B3C49]">{t.whatItProduces}</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-700"><li>✓ {t.p1}</li><li>✓ {t.p2}</li><li>✓ {t.p3}</li><li>✓ {t.p4}</li><li>✓ {t.p5}</li></ul>
          <div className="mt-6 rounded-2xl bg-[#F2F9FB] border border-[#E6F2F5] p-4">
            <p className="text-xs font-bold text-[#0B3C49]">🔒 {isRTL ? "الخصوصية" : "Privacy"}</p>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{isRTL ? "يتم استخراج النص من PDF/Word على الخادم فقط — لا تُرسل الملفات ثنائياً إلى Gemini، بل النص المستخرج فقط، ومفتاح API يبقى مخفياً." : "PDF/Word text is extracted server-side only — only extracted text is sent to Gemini, API key stays hidden."}</p>
          </div>
          <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-100 p-4">
            <p className="text-xs font-bold text-amber-800">{isRTL ? "الحفظ التلقائي" : "Auto-save"}</p>
            <p className="text-[11px] text-amber-700 mt-1 leading-relaxed">{isRTL ? "كل توليد ناجح يُحفظ تلقائياً في سجلك (lectures_history) ومرتبط بحسابك فقط." : "Every successful generation is auto-saved to your history, linked to your account only."}</p>
          </div>
          <Link href="/courses" className="mt-4 block text-center py-2.5 rounded-xl bg-[#0B3C49] text-white text-xs font-black">{isRTL ? "إدارة مقرراتي →" : "Manage my courses →"}</Link>
        </section>
      </div>

      {result && (
        <section className="mt-6 space-y-4">
          <div className="bg-white rounded-3xl shadow border border-slate-100 p-6">
            <div className="flex flex-wrap gap-3 justify-between items-start">
              <h3 className="font-black text-[#0B3C49]">{t.resultsTitle}</h3>
              {resultMeta?.savedLectureId && <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1">{t.currentResultSavedNote}</span>}
            </div>

            {/* === الملخصات الجديدة === */}
            <div className="mt-4">
              <GenerationSummary data={result} title={title || text.slice(0, 60)} outputLanguage={lang} />
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black text-[#0B3C49] mb-3">{t.currentResultExportTitle}</p>
              <ExportButtons markdown={currentMarkdown} title={title || text.slice(0, 30) || "lecture"} />
            </div>
            <details className="mt-4 rounded-2xl border border-slate-100 bg-white">
              <summary className="px-4 py-3 text-xs font-bold text-slate-700 cursor-pointer">{isRTL ? "معاينة Markdown الكامل" : "Preview full Markdown"}</summary>
              <pre className="text-xs leading-6 p-4 bg-slate-50 rounded-xl overflow-auto max-h-96 whitespace-pre-wrap break-words m-3 border border-slate-100">{currentMarkdown}</pre>
            </details>
          </div>

          {/* Page navigation < > */}
          <div className="flex justify-between items-center">
            <button onClick={() => { setResult(null); setResultMeta(null); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5">
              <span className="text-base leading-none">{isRTL ? "›" : "<"}</span> {isRTL ? "إنشاء جديد" : "New generation"}
            </button>
            <Link href="/courses" className="px-5 py-2.5 rounded-xl bg-[#0B3C49] text-white text-xs font-black hover:bg-[#0F4C5C] flex items-center gap-1.5">
              {isRTL ? "مقرراتي" : "My courses"} <span className="text-base leading-none">{isRTL ? "‹" : ">"}</span>
            </Link>
          </div>
        </section>
      )}

      <div className="mt-8">
        <HistoryPanel refreshKey={historyRefresh} />
      </div>

      {/* Bottom page navigation < > */}
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/courses" className="px-6 py-3 rounded-xl bg-white border border-slate-200 text-[#0B3C49] text-xs font-black hover:bg-slate-50 flex items-center gap-2">
          <span>{isRTL ? "‹" : "<"}</span> {isRTL ? "السابق: مقرراتي" : "Prev: My Courses"}
        </Link>
        <span className="px-4 py-3 rounded-xl bg-slate-100 text-slate-500 text-xs font-bold">{isRTL ? "الرئيسية" : "Home"} • {historyRefresh > 0 ? `${historyRefresh} ${isRTL ? "محاضرة مولدة" : "generated"}` : isRTL ? "ابدأ التوليد" : "Start generating"}</span>
        <Link href="/courses" className="px-6 py-3 rounded-xl bg-[#0F4C5C] text-white text-xs font-black hover:bg-[#0B3C49] flex items-center gap-2">
          {isRTL ? "التالي: مقرراتي" : "Next: My Courses"} <span>{isRTL ? "›" : ">"}</span>
        </Link>
      </div>
    </div>
  );
}
