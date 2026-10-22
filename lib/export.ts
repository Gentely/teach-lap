// Client-only — تنزيل النص كملف .md أو .txt (زر Save As)

export function downloadTextFile(content: string, fileName: string, mime: string = "text/markdown;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  // تنظيف
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 1000);
}

export function triggerDownloadFromMarkdown(markdown: string, title: string, ext: "md" | "txt" = "md") {
  // نستورد الدالتين من markdown.ts بشكل ديناميكي لتجنب دورة استيراد
  let content = markdown;
  let mime = "text/markdown;charset=utf-8";
  if (ext === "txt") {
    // تحويل بسيط إلى نص عادي
    content = markdown
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .trim();
    mime = "text/plain;charset=utf-8";
  }
  const safe = (title || "lecture")
    .replace(/[^a-zA-Z0-9\u0600-\u06FF_\- ]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 60) || "lecture";
  const fileName = `${safe}_${new Date().toISOString().slice(0, 10)}.${ext}`;
  downloadTextFile(content, fileName, mime);
}
