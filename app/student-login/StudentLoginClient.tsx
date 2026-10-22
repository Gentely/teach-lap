"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n";

export default function StudentLoginClient() {
  const router = useRouter();
  const params = useSearchParams();
  const { locale } = useI18n();
  const isRTL = locale === "ar";
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setMsg(null);
    try {
      const res = await fetch("/api/auth/student-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.error?.message);
      router.replace(params.get("next") || "/student");
      router.refresh();
    } catch (e: any) { setMsg(e.message); } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-[#FBF8F3] p-4" dir={isRTL ? "rtl" : "ltr"}>
      <div className="w-full max-w-md bg-white rounded-[28px] shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-[#0B3C49] text-white p-7 text-center">
          <div className="w-12 h-12 bg-[#E3B23C] text-[#0B3C49] rounded-2xl grid place-items-center font-black mx-auto">S</div>
          <h1 className="mt-3 font-black">{isRTL ? "دخول الطالبة" : "Student Login"}</h1>
          <p className="text-xs text-white/70 mt-1">{isRTL ? "أدخلي بريدك المسجل عند أستاذتك — لا يمكنك توليد المحتوى، فقط المشاهدة والحفظ" : "Enter your registered email — view and save only, no generation"}</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-3">
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder={isRTL ? "بريدك المسجل" : "Your registered email"} className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#0B3C49]" />
          <input value={code} onChange={e => setCode(e.target.value)} placeholder={isRTL ? "الكود (اختياري حالياً)" : "Code (optional for now)"} type="password" className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#0B3C49]" />
          <button disabled={loading} className="w-full py-3 rounded-xl bg-[#0B3C49] text-white font-black disabled:opacity-60">{loading ? "..." : (isRTL ? "دخول" : "Sign in")}</button>
          {msg && <p className="text-xs text-center font-bold text-red-600 bg-red-50 rounded-xl p-2">{msg}</p>}
          <p className="text-[11px] text-slate-400 text-center">{isRTL ? "إذا لم تكوني مسجلة، تواصلي مع أ. إيناس لدعوتك حسب المادة" : "If not enrolled, contact Ms. Enas to be invited per subject"}</p>
        </form>
      </div>
    </div>
  );
}
