"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import ExportButtons from "./ExportButtons";

type Lecture = {
  id: string;
  title: string | null;
  output_language: string;
  input_chars: number;
  model_used: string | null;
  created_at: string;
  generated_markdown: string;
  generated_data: any;
  original_text: string;
  files_meta: any;
};

export default function HistoryPanel({ refreshKey }: { refreshKey?: number }) {
  const { locale, t } = useI18n();
  const isRTL = locale === "ar";
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  async function fetchHistory() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("limit", "20");
      params.set("offset", "0");
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/history?${params.toString()}`);
      const j = await res.json();
      if (!j.success) throw new Error(j.error?.message || "Failed to fetch");
      setLectures(j.data || []);
      setTotal(j.total || 0);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  async function handleDelete(id: string) {
    if (!confirm(isRTL ? "هل تريد حذف هذه المحاضرة؟" : "Delete this lecture?")) return;
    try {
      const res = await fetch(`/api/history/${id}`, { method: "DELETE" });
      const j = await res.json();
      if (!j.success) throw new Error(j.error?.message);
      setLectures((prev) => prev.filter((l) => l.id !== id));
      setTotal((n) => Math.max(0, n - 1));
    } catch (e: any) {
      alert(e.message);
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow border border-slate-100 overflow-hidden" dir={isRTL ? "rtl" : "ltr"}>
      <div className="px-6 py-4 border-b flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div>
          <h3 className="font-black text-[#0B3C49] text-sm">
            {isRTL ? "سجل محاضراتي" : "My Lecture History"} <span className="font-normal text-slate-500">({total})</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">{isRTL ? "محفوظ تلقائياً في Supabase ومرتبط بحسابك فقط" : "Auto-saved to Supabase, linked to your account only"}</p>
        </div>
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchHistory()}
            placeholder={isRTL ? "بحث في العنوان…" : "Search title…"}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#0F4C5C] w-40"
          />
          <button onClick={fetchHistory} className="px-4 py-2 rounded-xl bg-[#0F4C5C] text-white text-xs font-bold">
            {isRTL ? "بحث" : "Search"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-slate-500">{isRTL ? "جاري التحميل…" : "Loading…"}</div>
      ) : error ? (
        <div className="p-6 text-xs text-red-600 bg-red-50 m-4 rounded-xl">{error}</div>
      ) : lectures.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-sm text-slate-500">{isRTL ? "لا يوجد سجل بعد — ولّد أول محاضرة ليظهر هنا" : "No history yet — generate your first lecture to see it here"}</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {lectures.map((lec) => {
            const isExpanded = expanded === lec.id;
            return (
              <div key={lec.id} className="p-4 sm:p-5">
                <div className="flex flex-wrap gap-3 justify-between items-start">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-sm text-[#0B3C49] truncate">{lec.title || (isRTL ? "بدون عنوان" : "Untitled")}</h4>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {new Date(lec.created_at).toLocaleString(isRTL ? "ar-EG" : "en-US")} • {lec.output_language} • {lec.input_chars} {isRTL ? "حرف" : "chars"} {lec.model_used ? `• ${lec.model_used}` : ""}
                    </p>
                    {!isExpanded && <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">{lec.generated_data?.summary?.slice(0, 180)}…</p>}
                  </div>
                  <div className="flex flex-wrap gap-1.5 shrink-0">
                    <button onClick={() => setExpanded(isExpanded ? null : lec.id)} className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200">
                      {isExpanded ? (isRTL ? "إخفاء" : "Hide") : isRTL ? "عرض" : "View"}
                    </button>
                    <button onClick={() => handleDelete(lec.id)} className="px-3 py-1.5 rounded-xl bg-white border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50">
                      {isRTL ? "حذف" : "Delete"}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 space-y-4">
                    <div className="rounded-2xl bg-[#F2F9FB] border border-[#E6F2F5] p-4">
                      <p className="text-xs font-black text-[#0B3C49] mb-2">{isRTL ? "النص الأصلي (المُرسل إلى Gemini)" : "Original Text (sent to Gemini)"}</p>
                      <p className="text-xs leading-6 text-slate-700 max-h-40 overflow-auto whitespace-pre-wrap">{lec.original_text?.slice(0, 3000)}{(lec.original_text?.length || 0) > 3000 ? "…" : ""}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/50">
                      <p className="text-xs font-black text-[#0B3C49] mb-3">{isRTL ? "الملخص المُولد (Markdown)" : "Generated Summary (Markdown)"}</p>
                      <pre className="text-xs leading-6 text-slate-800 whitespace-pre-wrap break-words max-h-80 overflow-auto bg-white rounded-xl p-3 border border-slate-100">{lec.generated_markdown}</pre>
                      <div className="mt-3">
                        <ExportButtons markdown={lec.generated_markdown} title={lec.title || "lecture"} />
                      </div>
                    </div>

                    {lec.generated_data && (
                      <details className="rounded-2xl border border-slate-200 p-3 bg-white">
                        <summary className="text-xs font-bold text-slate-700 cursor-pointer">{isRTL ? "عرض JSON الكامل" : "Show full JSON"}</summary>
                        <pre className="text-[11px] bg-slate-50 p-3 rounded-xl overflow-auto max-h-64 mt-3 border border-slate-100">{JSON.stringify(lec.generated_data, null, 2)}</pre>
                      </details>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
