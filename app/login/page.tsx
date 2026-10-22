"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useI18n } from "@/lib/i18n";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useSearchParams();
  const { t, locale } = useI18n();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(params.get("error") === "not_allowed" ? t.notAllowed : null);
  const [mode, setMode] = useState<"password" | "magic">("password");

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setMsg(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setMsg(error.message); setLoading(false); return; }
    router.replace(params.get("next") || "/"); router.refresh();
  }
  async function handleMagic(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setMsg(null);
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${location.origin}/auth/callback` } });
    setMsg(error ? error.message : "Check your email for the magic link (60s).");
    setLoading(false);
  }
  async function handleGoogle() {
    setLoading(true);
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${location.origin}/auth/callback` } });
  }

  return (
    <div className="min-h-screen grid place-items-center bg-[#FBF8F3] p-4" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="w-full max-w-md bg-white rounded-[24px] shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-[#0F4C5C] text-white p-6 text-center">
          <div className="w-12 h-12 bg-[#E3B23C] text-[#0B3C49] rounded-2xl grid place-items-center font-black mx-auto">S</div>
          <h1 className="mt-3 font-black">{t.loginTitle}</h1>
          <p className="text-xs text-white/70 mt-1">{t.loginSubtitle}</p>
        </div>
        <div className="flex gap-2 p-4">
          <button onClick={() => setMode("password")} className={`flex-1 py-2.5 rounded-xl text-sm font-bold ${mode==="password" ? "bg-[#0F4C5C] text-white" : "bg-slate-100"}`}>{t.switchToPassword}</button>
          <button onClick={() => setMode("magic")} className={`flex-1 py-2.5 rounded-xl text-sm font-bold ${mode==="magic" ? "bg-[#0F4C5C] text-white" : "bg-slate-100"}`}>{t.switchToMagic}</button>
        </div>
        <form onSubmit={mode==="password" ? handlePassword : handleMagic} className="px-6 pb-6 space-y-3">
          <input type="email" required placeholder={t.emailPh} value={email} onChange={e=>setEmail(e.target.value)} className="w-full rounded-xl border-2 border-slate-200 focus:border-[#0F4C5C] outline-none px-4 py-3 text-sm" />
          {mode==="password" && <input type="password" required placeholder={t.passwordPh} value={password} onChange={e=>setPassword(e.target.value)} className="w-full rounded-xl border-2 border-slate-200 focus:border-[#0F4C5C] outline-none px-4 py-3 text-sm" />}
          <button disabled={loading} className="w-full py-3 rounded-xl bg-[#0F4C5C] text-white font-black disabled:opacity-60">{loading ? "..." : mode==="password" ? t.signIn : t.sendMagic}</button>
          <button type="button" onClick={handleGoogle} className="w-full py-2.5 rounded-xl bg-white border-2 border-slate-200 font-bold text-sm">{t.googleBtn}</button>
          {msg && <p className="text-xs text-center font-bold text-red-600 bg-red-50 rounded-xl p-2">{msg}</p>}
        </form>
      </div>
    </div>
  );
}
