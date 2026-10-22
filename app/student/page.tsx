import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTeacherByUsername } from "@/lib/teachers";

export const dynamic = "force-dynamic";

export default function StudentPage() {
  const cookieStore = cookies();
  const studentSession = cookieStore.get("student_session")?.value;
  const teacherSession = cookieStore.get("teacher_session")?.value;

  // الطالبة لها جلسة خاصة، الأستاذة لها جلسة أخرى
  const isStudent = !!studentSession;
  const isTeacher = !!teacherSession;

  if (!isStudent && !isTeacher) {
    redirect("/student-login");
  }

  // إذا كانت أستاذة تحاول دخول صفحة الطالبة، اعرض لها معاينة
  const email = studentSession || "teacher-preview";
  const isPreview = isTeacher && !isStudent;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir="rtl">
      <div className="bg-gradient-to-br from-[#0B3C49] via-[#0F4C5C] to-[#14657A] text-white rounded-3xl p-8">
        <h1 className="text-2xl font-black">مساحة الطالبة التفاعلية</h1>
        <p className="text-white/80 mt-2 text-sm">مرحباً {email} — يمكنك مشاهدة محاضرات أستاذتك وحفظ ملخصاتها ورؤية تقييماتك فقط</p>
        {isPreview && <p className="mt-3 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs">أنتِ أستاذة — هذه معاينة لما تراه الطالبة. لا يمكنك توليد Gemini هنا.</p>}
        <div className="mt-4 flex gap-2">
          <Link href="/courses" className="px-4 py-2 rounded-xl bg-white text-[#0B3C49] text-xs font-black">مقرراتي</Link>
          <span className="px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs">بدون توليد Gemini</span>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-3xl shadow border border-slate-100 p-6">
        <h2 className="font-black text-[#0B3C49]">محاضراتك</h2>
        <p className="text-xs text-slate-500 mt-1">سيظهر هنا كل المحاضرات التي نشرتها أ. إيناس لموادك حسب السمستر — مع إمكانية الحفظ كـ .md/.txt</p>
        <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center text-sm text-slate-500">
          لا يوجد محاضرات منشورة بعد — عندما تنشر أ. إيناس محاضرة لمقررك ستظهر هنا
        </div>
        <div className="mt-4 flex gap-2">
          <Link href="/courses" className="px-4 py-2 rounded-xl bg-[#0B3C49] text-white text-xs font-black">الذهاب إلى مقرراتي</Link>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-3xl shadow border border-slate-100 p-6">
        <h3 className="font-black text-[#0B3C49]">تقييماتي</h3>
        <p className="text-xs text-slate-500 mt-1">أعمال السنة والاختبارات والحضور — القراءة فقط</p>
        <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center text-sm text-slate-500">
          ستظهر تقييماتك من كل مقرر هنا — الأستاذة هي من تدير الدرجات
        </div>
      </div>
    </div>
  );
}
