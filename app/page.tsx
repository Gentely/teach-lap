"use client";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";

export default function HomePage() {
  const { t } = useI18n();
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [lang, setLang] = useState("en");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  async function handleGenerate() {
    if (text.trim().length < 40) return setError("Text too short — minimum 40 characters.");
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, text, outputLanguage: lang }),
      });
      const j = await res.json();
      if (!res.ok || !j.success) throw new Error(j.error?.message || "Generation failed");
      setResult(j.data);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-gradient-to-br from-[#0B3C49] via-[#0F4C5C] to-[#14657A] text-white rounded-3xl p-8">
        <h2 className="text-3xl font-black">{t.heroTitle}</h2>
        <p className="text-white/80 mt-2 max-w-3xl">{t.heroSubtitle}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <section className="lg:col-span-2 bg-white rounded-3xl shadow border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h3 className="font-black text-[#0B3C49]">{t.inputTitle}</h3>
            <span className="text-xs text-slate-500">{text.length} {t.chars}</span>
          </div>
          <div className="p-6 space-y-3">
            <input value={title} onChange={e=>setTitle(e.target.value)} placeholder={t.lectureTitlePh} className="w-full rounded-xl border-2 border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#0F4C5C]" />
            <select value={lang} onChange={e=>setLang(e.target.value)} className="w-full rounded-xl border-2 border-slate-200 px-4 py-2.5 text-sm bg-white">
              <option value="en">English</option><option value="ar">العربية</option><option value="bilingual">Bilingual</option>
            </select>
            <textarea value={text} onChange={e=>setText(e.target.value)} rows={10} placeholder={t.lectureTextPh} className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm leading-7 min-h-[200px] outline-none focus:border-[#0F4C5C]" />
            <button onClick={handleGenerate} disabled={loading} className="w-full py-3 rounded-xl bg-[#0F4C5C] text-white font-black disabled:opacity-60">{loading ? "..." : t.generateBtn}</button>
            {error && <p className="text-xs text-red-600 bg-red-50 rounded-xl p-2">{error}</p>}
          </div>
        </section>
        <section className="bg-white rounded-3xl shadow border border-slate-100 p-6">
          <h4 className="font-black text-[#0B3C49]">{t.whatItProduces}</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>✓ {t.p1}</li><li>✓ {t.p2}</li><li>✓ {t.p3}</li><li>✓ {t.p4}</li><li>✓ {t.p5}</li>
          </ul>
        </section>
      </div>

      {result && (
        <section className="mt-6 bg-white rounded-3xl shadow border border-slate-100 p-6 space-y-4">
          <h3 className="font-black text-[#0B3C49]">{t.resultsTitle}</h3>
          <p className="text-sm leading-7 bg-[#F2F9FB] border border-[#E6F2F5] rounded-2xl p-4">{result.summary}</p>
          <pre className="text-xs bg-slate-50 p-4 rounded-xl overflow-auto max-h-[500px]">{JSON.stringify(result, null, 2)}</pre>
        </section>
      )}
    </div>
  );
}
