"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n";

export default function TeacherLoginClient() {
  const router = useRouter();
  const params = useSearchParams();
  const { locale } = useI18n();
  const isRTL = locale === "ar";

  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(params.get("error") ? (isRTL ? "بيانات الدخول غير صحيحة" : "Invalid credentials") : null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !code.trim()) {
      setMsg(isRTL ? "أدخل اسم المستخدم والكود" : "Enter username and code");
      return;
    }
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/auth/teacher-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), code: code.trim() }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.error?.message || "Login failed");
      // نجح — انتقل إلى صفحة الأستاذة الخاصة بها
      const next = params.get("next") || `/teacher/${j.username.toLowerCase()}`;
      router.replace(next);
      router.refresh();
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-[#FBF8F3] p-4" dir={isRTL ? "rtl" : "ltr"}>
      <div className="w-full max-w-md bg-white rounded-[28px] shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-[#0B3C49] text-white p-7 text-center">
          <div className="w-14 h-14 bg-[#E3B23C] text-[#0B3C49] rounded-2xl grid place-items-center font-black text-xl mx-auto shadow">S</div>
          <h1 className="mt-4 font-black text-lg">{isRTL ? "دخول الأستاذة" : "Teacher Login"}</h1>
          <p className="text-xs text-white/75 mt-2 leading-relaxed">
            {isRTL ? "أدخل اسم المستخدم والكود الدائم للدخول إلى صفحتك المستقلة" : "Enter your username and permanent code to access your private space"}
          </p>
          <div className="mt-4 inline-flex gap-2 text-[11px] bg-white/10 border border-white/20 rounded-full px-3 py-1.5">
            <span className="opacity-80">{isRTL ? "مثال:" : "Example:"}</span>
            <span className="font-bold">Enas / ENAS-7784</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 block">{isRTL ? "اسم المستخدم" : "Username"}</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={isRTL ? "مثال: Enas" : "e.g., Enas"}
              className="w-full rounded-xl border-2 border-slate-200 focus:border-[#0B3C49] outline-none px-4 py-3 text-sm"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 block">{isRTL ? "الكود الدائم" : "Permanent Code"}</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={isRTL ? "مثال: ENAS-7784" : "e.g., ENAS-7784"}
              type="password"
              className="w-full rounded-xl border-2 border-slate-200 focus:border-[#0B3C49] outline-none px-4 py-3 text-sm tracking-widest text-center font-mono"
              autoComplete="current-password"
            />
            <p className="text-[11px] text-slate-400 mt-1">{isRTL ? "الكود ثابت لا يتغير — احتفظي به" : "This code is permanent — keep it safe"}</p>
          </div>

          <button
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#0B3C49] text-white font-black text-sm disabled:opacity-60 disabled:cursor-not-allowed hover:bg-[#0F4C5C] transition"
          >
            {loading ? (isRTL ? "جاري الدخول…" : "Signing in…") : (isRTL ? "دخول" : "Sign in")}
          </button>

          {msg && <p className="text-xs text-center font-bold text-red-600 bg-red-50 rounded-xl p-3 border border-red-100">{msg}</p>}

          <div className="pt-2 text-center">
            <p className="text-[11px] text-slate-400">
              {isRTL ? "لكل أستاذة صفحة مستقلة بمحاضراتها وطلابها" : "Each teacher has an independent page with her lectures and students"}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
