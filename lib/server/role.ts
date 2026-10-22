import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export type UserRole = "admin" | "teacher" | "student" | null;

export type AuthContext = {
  user: { id: string; email: string } | null;
  role: UserRole;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  teacherUsername?: string | null;
  studentEmail?: string | null;
};

export function getSupabase() {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://placeholder.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key-for-build";
  return createServerClient(url, key, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet) {
        try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
      },
    },
  });
}

// للقراءة مع تجاوز RLS عند جلسة الأستاذة/الطالبة (service_role) — يُصدّر للاستخدام في الـ API
export function getSupabaseBypass() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://placeholder.supabase.co";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key-for-build";
  const cookieStore = cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet) {
        try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
      },
    },
  });
}

export function getSupabaseForContext(ctx: AuthContext) {
  if ((ctx as any).teacherUsername || (ctx as any).studentEmail) return getSupabaseBypass();
  return getSupabase();
}

function getTeacherSessionContext(): AuthContext | null {
  try {
    const cookieStore = cookies();
    const val = cookieStore.get("teacher_session")?.value;
    if (!val) return null;
    // استيراد متأخر لتجنب circular
    const { verifyTeacherSessionValue } = require("@/lib/server/teacherSession");
    const { getTeacherByUsername } = require("@/lib/teachers");
    const username = verifyTeacherSessionValue(val) as string | null;
    if (!username) return null;
    const teacher = getTeacherByUsername(username);
    if (!teacher) return null;
    const lower = teacher.username.toLowerCase();
    return {
      user: { id: `teacher:${lower}`, email: teacher.email },
      role: "teacher",
      isAdmin: lower === "enas", // إيناس مشرفة
      isTeacher: true,
      isStudent: false,
      teacherUsername: lower,
      studentEmail: null,
    };
  } catch {
    return null;
  }
}

function getStudentSessionContext(): AuthContext | null {
  try {
    const cookieStore = cookies();
    const val = cookieStore.get("student_session")?.value;
    if (!val) return null;
    const email = val.trim().toLowerCase();
    if (!email || !email.includes("@")) return null;
    return {
      user: { id: `student:${email}`, email },
      role: "student",
      isAdmin: false,
      isTeacher: false,
      isStudent: true,
      teacherUsername: null,
      studentEmail: email,
    };
  } catch {
    return null;
  }
}

export async function getAuthContext(): Promise<AuthContext> {
  // 1) تحقق من جلسة الأستاذة أولاً (Enas/EMAN عبر username+كود)
  const teacherCtx = getTeacherSessionContext();
  if (teacherCtx) return teacherCtx;

  // 2) تحقق من جلسة الطالبة
  const studentCtx = getStudentSessionContext();
  if (studentCtx) return studentCtx;

  // 3) fallback إلى Supabase القديم
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email || !user.id) {
    return { user: null, role: null, isAdmin: false, isTeacher: false, isStudent: false };
  }
  const email = user.email.toLowerCase();
  const { data: row } = await supabase.from("allowed_users").select("role").eq("email", email).maybeSingle();
  const role = (row?.role as UserRole) || null;
  return {
    user: { id: user.id, email: user.email! },
    role,
    isAdmin: role === "admin",
    isTeacher: role === "teacher" || role === "admin",
    isStudent: role === "student",
  };
}

export async function requireRole(allowed: UserRole[]): Promise<{ ok: true; ctx: AuthContext } | { ok: false; status: number; message: string }> {
  const ctx = await getAuthContext();
  if (!ctx.user) return { ok: false, status: 401, message: "Unauthorized — please sign in / الرجاء تسجيل الدخول" };
  if (!ctx.role || !allowed.includes(ctx.role)) {
    return { ok: false, status: 403, message: `Forbidden — required role: ${allowed.join("/")} / صلاحية غير كافية` };
  }
  return { ok: true, ctx };
}

export async function requireTeacher() {
  return requireRole(["teacher", "admin"]);
}

export async function requireAdmin() {
  return requireRole(["admin"]);
}

// التحقق من أن المستخدم أستاذ هذا المقرر أو مشرف — يدعم جلسة الأستاذة عبر teacher_username
export async function requireCourseTeacher(courseId: string): Promise<{ ok: true; ctx: AuthContext } | { ok: false; status: number; message: string }> {
  const auth = await getAuthContext();
  if (!auth.user) return { ok: false, status: 401, message: "Unauthorized" };
  if (auth.isAdmin) return { ok: true, ctx: auth }; // المشرفة تدير كل شيء
  // للجلسة الجديدة نحتاج تجاوز RLS لقراءة المقرر
  const supabase = auth.teacherUsername ? getSupabaseBypass() : getSupabase();
  const { data: course } = await supabase.from("courses").select("teacher_id, teacher_username").eq("id", courseId).maybeSingle();
  if (!course) return { ok: false, status: 404, message: "Course not found / المقرر غير موجود" };
  if (auth.teacherUsername && (course as any).teacher_username && String((course as any).teacher_username).toLowerCase() === auth.teacherUsername) return { ok: true, ctx: auth };
  if ((course as any).teacher_id === auth.user.id) return { ok: true, ctx: auth };
  // توافق: إذا المقرر بدون teacher_username لكن الطلب عبر جلسة الأستاذة، نحاول مطابقة teacherUsername مع المالك عبر service_role
  if (auth.teacherUsername) {
    // كحل أخير: إذا كان المقرر يخص نفس الأستاذة لكن teacher_username قديم null، نسمح إذا كان teacher_id يطابق أحد مقرراتها السابقة
    // للتبسيط نرفض هنا وسيُعالج عبر تطبيع البيانات لاحقاً
  }
  return { ok: false, status: 403, message: "Forbidden — you are not the teacher of this course / لست أستاذ هذا المقرر" };
}

// التحقق من أن المستخدم له حق الوصول للمقرر (أستاذه أو طالب مسجل فيه أو مشرف)
export async function requireCourseAccess(courseId: string): Promise<{ ok: true; ctx: AuthContext } | { ok: false; status: number; message: string }> {
  const auth = await getAuthContext();
  if (!auth.user) return { ok: false, status: 401, message: "Unauthorized" };
  if (auth.isAdmin) return { ok: true, ctx: auth };
  const supabase = auth.teacherUsername ? getSupabaseBypass() : getSupabase();
  // هل هو أستاذ المقرر؟
  const { data: course } = await supabase.from("courses").select("teacher_id, teacher_username").eq("id", courseId).maybeSingle();
  if (course) {
    if (auth.teacherUsername && (course as any).teacher_username && String((course as any).teacher_username).toLowerCase() === auth.teacherUsername) return { ok: true, ctx: auth };
    if ((course as any).teacher_id === auth.user.id) return { ok: true, ctx: auth };
  }
  // هل هو طالب مسجل؟
  const supabase2 = auth.teacherUsername ? getSupabaseBypass() : getSupabase();
  const { data: enrollment } = await supabase2.from("course_enrollments").select("id").eq("course_id", courseId).eq("student_email", auth.user.email.toLowerCase()).maybeSingle();
  if (enrollment) return { ok: true, ctx: auth };
  return { ok: false, status: 403, message: "Forbidden — not enrolled in this course / غير مسجل في هذا المقرر" };
}
