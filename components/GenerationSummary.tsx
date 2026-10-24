"use client";
import { useI18n } from "@/lib/i18n";
import { useState } from "react";

type Props = {
  data: {
    summary: string;
    core_concepts: { term: string; definition: string; classroom_link: string }[];
    key_takeaways: string[];
    libyan_applications?: string[];
    course_applications?: string[];
    scenario_qa: { question: string; model_answer: string }[];
    reflection_tasks: { title: string; prompt: string; type: string }[];
    discussion_questions: string[];
  };
  title?: string;
  outputLanguage?: string;
};

export default function GenerationSummary({ data, title, outputLanguage }: Props) {
  const { locale } = useI18n();
  const isRTL = locale === "ar" || outputLanguage === "ar";
  const [copied, setCopied] = useState<string | null>(null);

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  const apps = data.libyan_applications || data.course_applications || [];

  return (
    <div className="space-y-4" dir={isRTL ? "rtl" : "ltr"}>
      {/* Summary */}
      <div className="rounded-2xl border border-[#0F4C5C]/20 bg-[#F2F9FB] overflow-hidden">
        <div className="px-4 py-3 bg-[#0F4C5C] text-white flex justify-between items-center">
          <h3 className="text-xs font-black">{isRTL ? "📝 الملخص التربوي" : "📝 Pedagogical Summary"}</h3>
          <button onClick={() => copy(data.summary, "summary")} className="text-[11px] bg-white/20 px-3 py-1 rounded-full hover:bg-white/30">
            {copied === "summary" ? (isRTL ? "✓ تم النسخ" : "✓ Copied") : isRTL ? "نسخ" : "Copy"}
          </button>
        </div>
        <div className="p-4">
          <p className="text-sm leading-7 text-slate-800 whitespace-pre-wrap">{data.summary}</p>
          {title && <p className="text-[11px] text-slate-500 mt-3 border-t pt-2">{isRTL ? "العنوان:" : "Title:"} {title} {outputLanguage && `• ${outputLanguage}`} </p>}
        </div>
      </div>

      {/* Core Concepts */}
      {data.core_concepts?.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b flex justify-between items-center">
            <h3 className="text-xs font-black text-[#0B3C49]">{isRTL ? "💡 المفاهيم الجوهرية" : "💡 Core Concepts"} <span className="font-normal text-slate-500">({data.core_concepts.length})</span></h3>
            <button onClick={() => copy(data.core_concepts.map(c => `${c.term}: ${c.definition} (${c.classroom_link})`).join("\n"), "concepts")} className="text-[11px] bg-white border border-slate-200 px-3 py-1 rounded-full">
              {copied === "concepts" ? (isRTL ? "✓ تم النسخ" : "✓ Copied") : isRTL ? "نسخ الكل" : "Copy all"}
            </button>
          </div>
          <div className="p-4 grid gap-3">
            {data.core_concepts.map((c, i) => (
              <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-sm font-bold text-[#0F4C5C]">{i + 1}. {c.term}</p>
                <p className="text-xs text-slate-700 mt-1 leading-6">{c.definition}</p>
                <p className="text-[11px] text-[#0B3C49] mt-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1">🔗 {c.classroom_link}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Takeaways */}
      {data.key_takeaways?.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 overflow-hidden">
          <div className="px-4 py-3 bg-amber-100 border-b flex justify-between items-center">
            <h3 className="text-xs font-black text-amber-800">{isRTL ? "⭐ أهم الاستنتاجات" : "⭐ Key Takeaways"} <span className="font-normal">({data.key_takeaways.length})</span></h3>
            <button onClick={() => copy(data.key_takeaways.join("\n• "), "takeaways")} className="text-[11px] bg-white border border-amber-200 px-3 py-1 rounded-full">{copied === "takeaways" ? (isRTL ? "✓ تم النسخ" : "✓ Copied") : isRTL ? "نسخ" : "Copy"}</button>
          </div>
          <ul className="p-4 space-y-2">
            {data.key_takeaways.map((k, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-800">
                <span className="shrink-0 w-6 h-6 rounded-full bg-amber-400 text-white grid place-items-center text-[11px] font-black">{i + 1}</span>
                <span className="leading-6">{k}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Applications */}
      {apps.length > 0 && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 overflow-hidden">
          <div className="px-4 py-3 bg-emerald-100 border-b">
            <h3 className="text-xs font-black text-emerald-800">{isRTL ? "🎯 تطبيقات الصف المعياري" : "🎯 Classroom Applications"} <span className="font-normal">({apps.length})</span></h3>
          </div>
          <ul className="p-4 space-y-2">
            {apps.map((a, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-800 bg-white border border-emerald-100 rounded-xl p-3">
                <span className="text-emerald-600">▸</span> <span className="leading-6">{a}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Scenario Q&A */}
      {data.scenario_qa?.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-4 py-3 bg-[#0B3C49] text-white">
            <h3 className="text-xs font-black">{isRTL ? "💬 سيناريوهات — أسئلة وأجوبة" : "💬 Scenarios — Q&A"} <span className="font-normal text-white/70">({data.scenario_qa.length})</span></h3>
          </div>
          <div className="p-4 space-y-3">
            {data.scenario_qa.map((qa, i) => (
              <div key={i} className="rounded-xl border border-slate-200 p-3">
                <p className="text-sm font-bold text-[#0B3C49]">Q{i + 1}: {qa.question}</p>
                <p className="text-xs text-slate-700 mt-2 leading-6 bg-[#F2F9FB] rounded-xl p-3 whitespace-pre-wrap"><b>{isRTL ? "إجابة نموذجية:" : "Model Answer:"}</b> {qa.model_answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reflection Tasks */}
      {data.reflection_tasks?.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b">
            <h3 className="text-xs font-black text-[#0B3C49]">{isRTL ? "🤔 مهام التأمل" : "🤔 Reflection Tasks"} <span className="font-normal text-slate-500">({data.reflection_tasks.length})</span></h3>
          </div>
          <div className="p-4 grid gap-3">
            {data.reflection_tasks.map((t, i) => (
              <div key={i} className="rounded-xl bg-[#F2F9FB] border border-[#E6F2F5] p-3">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-bold text-[#0F4C5C]">{t.title}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${t.type === "group" ? "bg-emerald-100 text-emerald-700" : t.type === "individual" ? "bg-amber-100 text-amber-700" : "bg-sky-100 text-sky-700"}`}>{t.type}</span>
                </div>
                <p className="text-xs text-slate-700 mt-1 leading-6">{t.prompt}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Discussion Questions */}
      {data.discussion_questions?.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b">
            <h3 className="text-xs font-black text-[#0B3C49]">{isRTL ? "💭 أسئلة النقاش" : "💭 Discussion Questions"} <span className="font-normal text-slate-500">({data.discussion_questions.length})</span></h3>
          </div>
          <ul className="p-4 space-y-2">
            {data.discussion_questions.map((q, i) => (
              <li key={i} className="text-sm text-slate-800 flex gap-2">
                <span className="text-[#0F4C5C] font-black">{i + 1}.</span> <span className="leading-6">{q}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
