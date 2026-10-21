'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [mode, setMode] = useState<'password' | 'magic'>('password');

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMsg(error.message);
      setLoading(false);
      return;
    }
    router.replace('/');
    router.refresh();
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    if (error) setMsg(error.message);
    else setMsg('تم إرسال رابط الدخول إلى بريدك — افتحه خلال 60 ثانية.');
    setLoading(false);
  }

  async function handleGoogle() {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  }

  return (
    <div className="min-h-screen grid place-items-center bg-[#FBF8F3] p-4" dir="rtl">
      <div className="w-full max-w-md bg-white rounded-[24px] shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-[#0F4C5C] text-white p-6 text-center">
          <div className="w-12 h-12 bg-[#E3B23C] text-[#0B3C49] rounded-2xl grid place-items-center font-black mx-auto">S</div>
          <h1 className="mt-3 font-black">تسجيل الدخول</h1>
          <p className="text-xs text-white/70 mt-1">الدخول مقصور على البريد المسموح (Whitelist)</p>
        </div>

        <div className="flex gap-2 p-4">
          <button onClick={() => setMode('password')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold ${mode==='password' ? 'bg-[#0F4C5C] text-white' : 'bg-slate-100'}`}>كلمة سر</button>
          <button onClick={() => setMode('magic')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold ${mode==='magic' ? 'bg-[#0F4C5C] text-white' : 'bg-slate-100'}`}>رابط سحري</button>
        </div>

        <form onSubmit={mode==='password' ? handlePasswordLogin : handleMagicLink} className="px-6 pb-6 space-y-3">
          <input
            type="email" required placeholder="البريد الجامعي"
            value={email} onChange={e=>setEmail(e.target.value)}
            className="w-full rounded-xl border-2 border-slate-200 focus:border-[#0F4C5C] outline-none px-4 py-3 text-sm"
          />
          {mode==='password' && (
            <input
              type="password" required placeholder="كلمة السر"
              value={password} onChange={e=>setPassword(e.target.value)}
              className="w-full rounded-xl border-2 border-slate-200 focus:border-[#0F4C5C] outline-none px-4 py-3 text-sm"
            />
          )}
          <button disabled={loading} className="w-full py-3 rounded-xl bg-[#0F4C5C] text-white font-black disabled:opacity-60">
            {loading ? 'جاري...' : mode==='password' ? 'دخول' : 'أرسل رابط الدخول'}
          </button>

          <button type="button" onClick={handleGoogle} className="w-full py-2.5 rounded-xl bg-white border-2 border-slate-200 font-bold text-sm">
            الدخول بـ Google
          </button>

          {msg && <p className="text-xs text-center font-bold text-red-600 bg-red-50 rounded-xl p-2">{msg}</p>}
          <p className="text-[11px] text-slate-500 text-center">إذا لم يكن بريدك في القائمة البيضاء سيتم رفض الدخول تلقائياً.</p>
        </form>
      </div>
    </div>
  );
}
