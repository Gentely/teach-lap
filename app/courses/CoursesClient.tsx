"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import Link from "next/link";

type Course = {
  id: string;
  teacher_id: string;
  title: string;
  code: string;
  description: string | null;
  created_at: string;
  students_count?: number;
};

export default function CoursesClient({ initialRole, currentEmail }: { initialRole: string | null; currentEmail: string }) {
  const { locale } = useI18n();
  const isRTL = locale === "ar";
  const [courses, setCourses] = useState<Course[]>([]);
  const [role, setRole] = useState<string | null>(initialRole);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [desc, setDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const isTeacher = role === "teacher" || role === "admin";

  async function fetchCourses() {
    setLoading(true);
    try {
      const res = await fetch("/api/courses");
      const j = await res.json();
      if (!j.success) throw new Error(j.error?.message);
      setCourses(j.data || []);
      if (j.role) setRole(j.role);
    } catch (e: any) {
      setMsg({ type: "error", text: e.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchCourses(); }, []);

  async function handleCreate() {
    if (!title.trim() || !code.trim()) return setMsg({ type: "error", text: isRTL ? "العنوان والرمز مطلوبان" : "Title and code required" });
    setCreating(true);
    setMsg(null);
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), code: code.trim(), description: desc.trim() || null }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.error?.message);
      setTitle(""); setCode(""); setDesc("");
      setMsg({ type: "success", text: isRTL ? "تم إنشاء المقرر" : "Course created" });
      await fetchCourses();
    } catch (e: any) {
      setMsg({ type: "error", text: e.message });
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(isRTL ? "حذف هذا المقرر وكل سجلاته؟" : "Delete this course and all its records?")) return;
    try {
      const res = await fetch(`/api/courses/${id}`, { method: "DELETE" });
      const j = await res.json();
      if (!j.success) throw new Error(j.error?.message);
      setCourses(prev => prev.filter(c => c.id !== id));
    } catch (e: any) {
      setMsg({ type: "error", text: e.message });
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir={isRTL ? "rtl" : "ltr"}>
      <div className="bg-gradient-to-br from-[#0B3C49] via-[#0F4C5C] to-[#14657A] text-white rounded-3xl p-8">
        <h1 className="text-2xl font-black">{isRTL ? "مقرراتي" : "My Courses"} <span className={`text-[10px] px-2 py-1 rounded-full font-black ms-2 ${isTeacher ? "bg-[#E3B23C] text-[#0B3C49]" : "bg-white/20 text-white border border-white/20"}`}>{isTeacher ? (isRTL ? "مساحة الأستاذ" : "Teacher space") : (isRTL ? "مساحة الطالب" : "Student space")}</span></h1>
        <p className="text-white/80 mt-2 text-sm leading-relaxed">
          {isTeacher
            ? (isRTL ? "أنشئ مقرراتك واربط طلابك — لكل مقرر مساحة خاصة للمحاضرات والحضور والدرجات." : "Create courses and link your students. Each course has its own space for lectures, attendance and grades.")
            : (isRTL ? "اعرض مقرراتك المسجل بها فقط — سترى محاضرات ودرجات أساتذتك دون القدرة على استخدام توليد Gemini." : "View your enrolled courses only — you will see lectures and grades from your teachers without Gemini generation access.")}
        </p>
        <p className="text-white/60 text-xs mt-1">Logged as: {currentEmail} • Role: {role || "unknown"}</p>
      </div>

      {isTeacher && (
        <div className="mt-6 bg-white rounded-3xl shadow border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="font-black text-[#0B3C49] text-sm">{isRTL ? "إنشاء مقرر جديد" : "Create new course"}</h2>
            <p className="text-xs text-slate-500 mt-1">{isRTL ? "لكل مقرر مساحته الخاصة للمحاضرات والحضور والدرجات." : "Each course has its own private space for lectures, attendance and grades."}</p>
          </div>
          <div className="p-6 grid sm:grid-cols-2 gap-3">
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder={isRTL ? "مثال: الصوتيات الإنجليزية 201" : "e.g., English Phonetics 201"} className="rounded-xl border-2 border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#0F4C5C] sm:col-span-2" />
            <input value={code} onChange={e => setCode(e.target.value)} placeholder={isRTL ? "مثال: PHON201" : "e.g., PHON201"} className="rounded-xl border-2 border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#0F4C5C]" />
            <input value={desc} onChange={e => setDesc(e.target.value)} placeholder={isRTL ? "وصف مختصر (اختياري)" : "Short description (optional)"} className="rounded-xl border-2 border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#0F4C5C]" />
            <button onClick={handleCreate} disabled={creating} className="sm:col-span-2 py-3 rounded-xl bg-[#0F4C5C] text-white font-black text-sm disabled:opacity-60">{creating ? (isRTL ? "جاري الإنشاء…" : "Creating…") : (isRTL ? "إنشاء المقرر" : "Create course")}</button>
            {msg && <p className={`sm:col-span-2 text-xs rounded-xl p-3 border ${msg.type === "success" ? "text-emerald-700 bg-emerald-50 border-emerald-100" : "text-red-600 bg-red-50 border-red-100"}`}>{msg.text}</p>}
          </div>
        </div>
      )}

      <div className="mt-6 bg-white rounded-3xl shadow border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="font-black text-[#0B3C49] text-sm">{isRTL ? "المقررات" : "Courses"} <span className="font-normal text-slate-500">({courses.length})</span></h2>
          <button onClick={fetchCourses} className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">↻ {isRTL ? "تحديث" : "Refresh"}</button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">{isRTL ? "جاري التحميل…" : "Loading…"}</div>
        ) : courses.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-500">{isTeacher ? (isRTL ? "لا يوجد مقررات بعد — أنشئ أول مقرر أعلاه" : "No courses yet — create your first course above") : (isRTL ? "لا يوجد مقررات مسجلة — سيضيفك أستاذك بالبريد" : "No enrolled courses — your teacher will add you by email")}</p>
            {!isTeacher && <Link href="/" className="mt-3 inline-block text-xs font-bold text-[#0F4C5C] underline">{isRTL ? "العودة للرئيسية" : "Back to home"}</Link>}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {courses.map(c => (
              <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-black text-[#0B3C49] text-sm truncate">{c.title}</h3>
                    <p className="text-xs font-bold text-[#0F4C5C] mt-1">{c.code}</p>
                    {c.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{c.description}</p>}
                    <p className="text-[11px] text-slate-400 mt-2">{new Date(c.created_at).toLocaleDateString(isRTL ? "ar-EG" : "en-US")} • {c.students_count ?? 0} {isRTL ? "طلاب" : "students"}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Link href={`/courses/${c.id}`} className="flex-1 text-center py-2 rounded-xl bg-[#0F4C5C] text-white text-xs font-black">{isRTL ? "فتح" : "Open"}</Link>
                  {isTeacher && <button onClick={() => handleDelete(c.id)} className="px-3 py-2 rounded-xl bg-white border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50">{isRTL ? "حذف" : "Delete"}</button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!isTeacher && (
        <div className="mt-6 rounded-2xl bg-amber-50 border border-amber-100 p-4">
          <p className="text-xs font-bold text-amber-800">{isRTL ? "ملاحظة للطالب" : "Note for students"}</p>
          <p className="text-xs text-amber-700 mt-1 leading-relaxed">{isRTL ? "لا يمكنك إنشاء مقررات أو استخدام توليد Gemini. سترى هنا فقط المقررات التي أضافك إليها أستاذك." : "You cannot create courses or use Gemini generation. You will only see courses your teacher has enrolled you in."}</p>
        </div>
      )}
    </div>
  );
}
