import { cookies } from "next/headers";
import { verifyTeacherSessionValue } from "@/lib/server/teacherSession";
import { getTeacherByUsername } from "@/lib/teachers";
import Link from "next/link";
import { redirect } from "next/navigation";
import TeacherEnasDashboard from "./TeacherEnasDashboard";

export const dynamic = "force-dynamic";

export default function TeacherPage({ params }: { params: { username: string } }) {
  const cookieStore = cookies();
  const sessionVal = cookieStore.get("teacher_session")?.value;
  const loggedUsername = verifyTeacherSessionValue(sessionVal);

  // تحقق أن المستخدم مسجل دخول وبنفس الاسم المطلوب في المسار
  if (!loggedUsername) {
    redirect(`/teacher-login?next=/teacher/${params.username.toLowerCase()}`);
  }

  // لكل أستاذة صفحة مستقلة — لا يمكن لـ Enas دخول صفحة Eman والعكس
  if (loggedUsername.toLowerCase() !== params.username.toLowerCase()) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-3xl shadow border border-slate-100 p-8">
          <h1 className="font-black text-red-600">الوصول مرفوض — هذه صفحة أستاذة أخرى</h1>
          <p className="text-sm text-slate-500 mt-2">أنت مسجلة كـ {loggedUsername} — لا يمكنك دخول صفحة {params.username}</p>
          <Link href={`/teacher/${loggedUsername.toLowerCase()}`} className="mt-6 inline-block px-5 py-2.5 rounded-xl bg-[#0B3C49] text-white font-bold">الذهاب إلى صفحتي</Link>
        </div>
      </div>
    );
  }

  const teacher = getTeacherByUsername(params.username);
  if (!teacher) {
    return <div className="max-w-3xl mx-auto px-4 py-16 text-center text-red-600">الأستاذة غير موجودة</div>;
  }

  // إيناس + إيمان تستخدمان نفس لوحة التحكم — البيانات من lib/teachers.ts تحدد المواد والجدول
  return <TeacherEnasDashboard teacher={teacher} />;
}
