"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import Link from "next/link";

export default function Header() {
  const { locale, setLocale, t } = useI18n();
  const [role, setRole] = useState<string | null>(null);
  const [teacher, setTeacher] = useState<string | null>(null);
  const [student, setStudent] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      // اجعل تسجيل الخروج شاملاً — استدعِ كليهما ثم اذهب للصفحة المناسبة
      const resTeacher = await fetch("/api/auth/teacher-session").then(r=>r.json()).catch(()=>null);
      if (teacher || resTeacher?.success) {
        await fetch("/api/auth/teacher-logout", { method: "POST", headers: { accept: "application/json" } }).catch(()=>{});
        await fetch("/api/auth/student-logout", { method: "POST", headers: { accept: "application/json" } }).catch(()=>{});
        window.location.href = "/teacher-login";
        return;
      }
      // افترض طالبة
      await fetch("/api/auth/student-logout", { method: "POST", headers: { accept: "application/json" } }).catch(()=>{});
      await fetch("/api/auth/teacher-logout", { method: "POST", headers: { accept: "application/json" } }).catch(()=>{});
      window.location.href = "/student-login";
    } finally {
      setLoggingOut(false);
    }
  }

  useEffect(() => {
    // جرب Supabase أولاً
    fetch("/api/me").then(r => r.json()).then(j => { if (j.success) setRole(j.data.role); }).catch(()=>{});
    // ثم تحقق من جلسة الأستاذة الجديدة
    fetch("/api/auth/teacher-session").then(r => r.json()).then(j => { if (j.success) { setRole("teacher"); setTeacher(j.username); } }).catch(()=>{});
    // تحقق من جلسة الطالبة — إن فشلت، استخدم وجود student_session كإشارة ثانوية عبر محاولة قراءة بيانات الطالبة إن وُجدت
    fetch("/api/student/enrollments").then(r=>r.json()).then(j=>{
      if (j.success && (j.data?.enrollments?.length>0 || j.data?.student_email)) {
        setStudent(j.data.student_email || "طالبة");
        if (!role) setRole("student");
      }
    }).catch(()=>{});
  }, []);

  return (
    <header className="bg-[#0B3C49] text-white shadow">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E3B23C] text-[#0B3C49] grid place-items-center font-black text-xl">S</div>
          <div>
            <h1 className="font-extrabold leading-none text-sm sm:text-base">{t.siteTitle}</h1>
            <p className="text-[11px] text-white/70 hidden sm:block">{t.siteSubtitle}</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {teacher ? (
            <>
              <Link href={`/teacher/${teacher.toLowerCase()}`} className="hidden sm:inline-flex items-center gap-1.5 bg-[#E3B23C] text-[#0B3C49] rounded-xl px-3 py-2 text-xs font-black">
                {teacher} • {locale === "ar" ? "صفحتي" : "My Page"}
              </Link>
              <button onClick={handleLogout} disabled={loggingOut} className="inline-flex items-center gap-1.5 bg-white text-[#0B3C49] rounded-xl px-3 py-2 text-xs font-black disabled:opacity-60">
                {loggingOut ? "…" : (locale === "ar" ? "خروج" : "Logout")}
              </button>
            </>
          ) : student ? (
            <>
              <Link href="/student" className="hidden sm:inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-900 rounded-xl px-3 py-2 text-xs font-black">
                {locale === "ar" ? "صفحتي" : "My Page"}
              </Link>
              <button onClick={handleLogout} disabled={loggingOut} className="inline-flex items-center gap-1.5 bg-white text-[#0B3C49] rounded-xl px-3 py-2 text-xs font-black disabled:opacity-60">
                {loggingOut ? "…" : (locale === "ar" ? "خروج" : "Logout")}
              </button>
            </>
          ) : (
            <Link href="/teacher-login" className="hidden sm:inline-flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs font-bold">
              {locale === "ar" ? "دخول الأستاذة" : "Teacher Login"}
            </Link>
          )}

          <Link href="/courses" className="hidden sm:inline-flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs font-bold">
            {locale === "ar" ? "مقرراتي" : "My Courses"} {role && <span className="hidden lg:inline text-[10px] opacity-70">({role})</span>}
          </Link>

          <Link href="/student-login" className="hidden sm:inline-flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs">
            {locale === "ar" ? "دخول الطالبة" : "Student"}
          </Link>

          <label className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-3 py-2">
            <span className="text-xs hidden sm:inline opacity-80">Language</span>
            <select value={locale} onChange={(e) => setLocale(e.target.value as "en" | "ar")} className="bg-transparent text-sm font-bold outline-none cursor-pointer">
              <option value="en" className="text-black">English</option>
              <option value="ar" className="text-black">العربية</option>
            </select>
          </label>

          <span className="hidden lg:inline-flex text-xs bg-white/10 border border-white/20 rounded-full px-3 py-1.5">{t.headerBadge}</span>
        </div>
      </div>
    </header>
  );
}
