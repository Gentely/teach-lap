"use client";
import { useEffect, useState } from "react";
import { Teacher } from "@/lib/teachers";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function TeacherEnasDashboard({ teacher }: { teacher: Teacher }) {
  const { locale } = useI18n();
  const isRTL = locale === "ar";
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubject, setActiveSubject] = useState<string | null>(null);

  useEffect(() => {
    // جلب مقررات الأستاذة الحالية — فلترة حسب teacher_username الخاص بها
    const myUser = teacher.username.toLowerCase();
    fetch("/api/courses").then(r => r.json()).then(j => {
      if (j.success) {
        const filtered = (j.data || []).filter((c: any) => (c.teacher_username || "").toLowerCase() === myUser);
        setCourses(filtered);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir={isRTL ? "rtl" : "ltr"}>
      <div className="bg-gradient-to-br from-[#0B3C49] via-[#0F4C5C] to-[#14657A] text-white rounded-3xl p-8">
        <div className="flex flex-wrap gap-4 justify-between items-start">
          <div>
            <h1 className="text-2xl font-black">{isRTL ? `مرحباً ${teacher.displayNameAr}` : `Welcome ${teacher.displayName}`}</h1>
            <p className="text-white/80 mt-2 text-sm">@{teacher.username} • {teacher.email} — {isRTL ? "صفحتك المستقلة بمحاضراتك وطلابك" : "Your independent page with your lectures and students"}</p>
            <div className="mt-3 inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1.5 text-xs">
              <span>📚 {teacher.subjects.length} {isRTL ? "مواد" : "subjects"}</span>
              <span>•</span>
              <span>{isRTL ? "طريقة الدخول: اسم المستخدم + كود دائم" : "Login: username + permanent code"}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/teacher-login" className="px-4 py-2 rounded-xl bg-white text-[#0B3C49] text-xs font-black">تغيير الحساب</Link>
            <form action="/api/auth/teacher-logout" method="post">
              <button className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-bold">تسجيل خروج</button>
            </form>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl shadow border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b bg-slate-50">
              <h2 className="font-black text-[#0B3C49]">{isRTL ? "موادي الدراسية — حسب السمستر والتوقيت" : "My Subjects — by semester and schedule"}</h2>
              <p className="text-xs text-slate-500 mt-1">{isRTL ? "كل مادة لها صفحتها التفاعلية الخاصة لطلابها" : "Each subject has its own interactive page for its students"}</p>
            </div>
            <div className="p-6 grid gap-4">
              {teacher.subjects.map((subj) => (
                <div key={subj.name} className={`rounded-2xl border-2 p-5 cursor-pointer transition ${activeSubject === subj.name ? "border-[#0B3C49] bg-[#F2F9FB]" : "border-slate-200 bg-white hover:border-[#0F4C5C]/30"}`} onClick={() => setActiveSubject(activeSubject === subj.name ? null : subj.name)}>
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1">
                      <h3 className="font-black text-[#0B3C49]">{subj.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">{subj.semester} {subj.yearLabel ? `• ${subj.yearLabel}` : ""}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {subj.schedule.map((s, i) => (
                          <span key={i} className="inline-flex items-center gap-1.5 bg-[#0B3C49] text-white rounded-full px-3 py-1 text-[11px] font-bold">
                            📅 {isRTL ? s.dayAr : s.day} — {s.lecture} — {s.time}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="shrink-0 bg-[#E3B23C] text-[#0B3C49] rounded-xl px-3 py-1 text-xs font-black">{subj.semester}</span>
                  </div>
                  {activeSubject === subj.name && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {isRTL ? "سيتم هنا عرض صفحة المادة التفاعلية الخاصة بطلابك لهذا السمستر — دعوة الطلاب، نشر المحاضرات، الحضور والدرجات." : "This will be the interactive page for this subject — invite students, publish lectures, track attendance and grades."}
                      </p>
                      <div className="flex gap-2">
                        <Link href={`/courses?subject=${encodeURIComponent(subj.name)}`} className="px-4 py-2 rounded-xl bg-[#0B3C49] text-white text-xs font-black">فتح صفحة المادة</Link>
                        <button className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold">دعوة طلاب</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow border border-slate-100 p-6">
            <h3 className="font-black text-[#0B3C49]">{isRTL ? "مقرراتي المنشأة" : "My Created Courses"}</h3>
            {loading ? <p className="text-sm text-slate-500 mt-3">Loading…</p> : courses.length === 0 ? (
              <p className="text-sm text-slate-500 mt-3">{isRTL ? "لا يوجد مقررات بعد — سننشئها لك تلقائياً حسب موادك أعلاه" : "No courses yet — we will auto-create them from your subjects above"}</p>
            ) : (
              <div className="mt-4 grid sm:grid-cols-2 gap-3">
                {courses.map((c: any) => (
                  <Link key={c.id} href={`/courses/${c.id}`} className="rounded-2xl border border-slate-200 p-4 hover:shadow-md bg-white">
                    <h4 className="font-bold text-sm text-[#0B3C49]">{c.title}</h4>
                    <p className="text-xs text-[#0F4C5C] font-bold mt-1">{c.code}</p>
                    <p className="text-[11px] text-slate-400 mt-2">{c.students_count ?? 0} طلاب • {c.description?.slice(0, 80) || ""}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-3xl shadow border border-slate-100 p-6">
            <h4 className="font-black text-[#0B3C49]">{isRTL ? "دعوة الطلاب" : "Invite Students"}</h4>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              {isRTL ? "لكل مادة حسب السنة — أضيفي طالباتك حسب المادة لصفحتها التفاعلية. الطالبة ترى محاضراتك وملخصاتك وتقييماتها فقط، لا تولد Gemini." : "Per subject/year — invite your students to their interactive page. Students can only view/save lectures and see grades, no Gemini generation."}
            </p>
            <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-100 p-4">
              <p className="text-xs font-bold text-amber-800">{isRTL ? "كيف؟" : "How?"}</p>
              <p className="text-xs text-amber-700 mt-1">ادخلي إلى أي مقرر أعلاه → تبويب الطلاب → أضيفي بريد/اسم الطالبة → ستظهر لها المقرر في حسابها</p>
            </div>
            <Link href="/courses" className="mt-4 block text-center py-2.5 rounded-xl bg-[#0B3C49] text-white text-xs font-black">إدارة الطالبات →</Link>
          </div>

          <div className="bg-white rounded-3xl shadow border border-slate-100 p-6">
            <h4 className="font-black text-[#0B3C49]">{isRTL ? "أدوات سريعة" : "Quick Tools"}</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/" className="text-[#0F4C5C] font-bold hover:underline">توليد محاضرة جديدة (Gemini) →</Link> <span className="text-xs text-slate-400">— للأساتذة فقط</span></li>
              <li><Link href="/courses" className="text-[#0F4C5C] font-bold hover:underline">إدارة المقررات →</Link></li>
              <li><Link href="/admin" className="text-slate-500 hover:underline text-xs">لوحة المشرفة (لإيناس وإيمان فقط)</Link></li>
            </ul>
          </div>

          <div className="bg-[#F2F9FB] border border-[#E6F2F5] rounded-2xl p-4">
            <p className="text-xs font-bold text-[#0B3C49]">🔒 {isRTL ? "الخصوصية" : "Privacy"}</p>
            <p className="text-[11px] text-slate-600 mt-1">صفحتك مستقلة تماماً — لا ترى إيمان مقرراتك والعكس. الطالبات يرين فقط مواد أستاذتهن حسب السنة.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
