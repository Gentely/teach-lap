"use client";
import { downloadTextFile } from "@/lib/export";
import { safeFileName } from "@/lib/markdown";
import { useI18n } from "@/lib/i18n";

export default function ExportButtons({ markdown, title }: { markdown: string; title: string }) {
  const { locale } = useI18n();

  const handleDownload = (ext: "md" | "txt") => {
    const base = safeFileName(title, locale === "ar" ? "محاضرة" : "lecture");
    const fileName = `${base}_${new Date().toISOString().slice(0, 10)}.${ext}`;
    const mime = ext === "md" ? "text/markdown;charset=utf-8" : "text/plain;charset=utf-8";
    let content = markdown;
    if (ext === "txt") {
      content = markdown.replace(/^#{1,6}\s+/gm, "").replace(/\*\*(.+?)\*\*/g, "$1");
    }
    downloadTextFile(content, fileName, mime);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => handleDownload("md")}
        className="px-3 py-2 rounded-xl bg-[#0F4C5C] text-white text-xs font-black hover:bg-[#0B3C49] transition"
        title={locale === "ar" ? "تنزيل كـ Markdown" : "Download as Markdown"}
      >
        ⬇ {locale === "ar" ? "حفظ كـ .md" : "Save as .md"}
      </button>
      <button
        onClick={() => handleDownload("txt")}
        className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
        title={locale === "ar" ? "تنزيل كـ نص" : "Download as Text"}
      >
        ⬇ {locale === "ar" ? "حفظ كـ .txt" : "Save as .txt"}
      </button>
      <button
        onClick={() => navigator.clipboard.writeText(markdown).then(() => alert(locale === "ar" ? "تم النسخ" : "Copied"))}
        className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition"
      >
        {locale === "ar" ? "نسخ Markdown" : "Copy Markdown"}
      </button>
    </div>
  );
}
