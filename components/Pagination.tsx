"use client";
import { useI18n } from "@/lib/i18n";

type Props = {
  total: number;
  limit: number;
  offset: number;
  onChange: (newOffset: number) => void;
  loading?: boolean;
};

export default function Pagination({ total, limit, offset, onChange, loading }: Props) {
  const { locale } = useI18n();
  const isRTL = locale === "ar";
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.floor(offset / limit) + 1;
  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  if (total <= 0) return null;

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between px-4 py-3 bg-slate-50 border-t rounded-b-3xl" dir={isRTL ? "rtl" : "ltr"}>
      <div className="text-xs text-slate-600">
        {isRTL ? (
          <>
            <span className="font-bold text-[#0B3C49]">{total}</span> {total === 1 ? "عنصر" : "عناصر"} • الصفحة <b>{currentPage}</b> من <b>{totalPages}</b> • عرض {offset + 1}–{Math.min(offset + limit, total)}
          </>
        ) : (
          <>
            <span className="font-bold text-[#0B3C49]">{total}</span> items • Page <b>{currentPage}</b> of <b>{totalPages}</b> • showing {offset + 1}–{Math.min(offset + limit, total)}
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => canPrev && onChange(Math.max(0, offset - limit))}
          disabled={!canPrev || loading}
          className={`w-9 h-9 grid place-items-center rounded-xl border text-sm font-black transition ${canPrev && !loading ? "bg-white border-slate-200 text-[#0B3C49] hover:bg-[#0F4C5C] hover:text-white hover:border-[#0F4C5C]" : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60"}`}
          title={isRTL ? "السابق" : "Previous"}
          aria-label="Previous"
        >
          {isRTL ? "›" : "<"}
        </button>

        <div className="hidden sm:flex items-center gap-1.5">
          {Array.from({ length: totalPages }).slice(0, 7).map((_, i) => {
            // Show first, last, current window
            let pageNum: number | string | null = null;
            if (totalPages <= 7) pageNum = i + 1;
            else {
              if (i === 0) pageNum = 1;
              else if (i === 6) pageNum = totalPages;
              else if (i === 1 && currentPage > 3) pageNum = "…";
              else if (i === 5 && currentPage < totalPages - 2) pageNum = "…";
              else if (currentPage <= 3) pageNum = i + 1 < 6 ? i + 1 : null;
              else if (currentPage >= totalPages - 2) pageNum = totalPages - 6 + i;
              else pageNum = currentPage - 3 + i;
            }
            if (pageNum === null) return null;
            if (pageNum === "…") return <span key={`e-${i}`} className="px-1 text-slate-400 text-xs">…</span>;
            const p = pageNum as number;
            const isActive = p === currentPage;
            return (
              <button
                key={p}
                onClick={() => onChange((p - 1) * limit)}
                className={`w-8 h-8 rounded-lg text-xs font-bold ${isActive ? "bg-[#0F4C5C] text-white" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"}`}
              >
                {p}
              </button>
            );
          })}
        </div>

        <span className="sm:hidden text-xs font-bold text-slate-600 px-2">{currentPage} / {totalPages}</span>

        <button
          onClick={() => canNext && onChange(offset + limit)}
          disabled={!canNext || loading}
          className={`w-9 h-9 grid place-items-center rounded-xl border text-sm font-black transition ${canNext && !loading ? "bg-white border-slate-200 text-[#0B3C49] hover:bg-[#0F4C5C] hover:text-white hover:border-[#0F4C5C]" : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60"}`}
          title={isRTL ? "التالي" : "Next"}
          aria-label="Next"
        >
          {isRTL ? "‹" : ">"}
        </button>
      </div>
    </div>
  );
}
