import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export type UserRole = "admin" | "teacher" | "student" | null;

export type AuthContext = {
  user: { id: string; email: string } | null;
  role: UserRole;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
};

function getSupabase() {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
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

export async function getAuthContext(): Promise<AuthContext> {
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

// التحقق من أن المستخدم أستاذ هذا المقرر أو مشرف
export async function requireCourseTeacher(courseId: string): Promise<{ ok: true; ctx: AuthContext } | { ok: false; status: number; message: string }> {
  const auth = await getAuthContext();
  if (!auth.user) return { ok: false, status: 401, message: "Unauthorized" };
  if (auth.isAdmin) return { ok: true, ctx: auth }; // المشرفة تدير كل شيء
  const supabase = getSupabase();
  const { data: course } = await supabase.from("courses").select("teacher_id").eq("id", courseId).maybeSingle();
  if (!course) return { ok: false, status: 404, message: "Course not found / المقرر غير موجود" };
  if (course.teacher_id !== auth.user.id) return { ok: false, status: 403, message: "Forbidden — you are not the teacher of this course / لست أستاذ هذا المقرر" };
  return { ok: true, ctx: auth };
}

// التحقق من أن المستخدم له حق الوصول للمقرر (أستاذه أو طالب مسجل فيه أو مشرف)
export async function requireCourseAccess(courseId: string): Promise<{ ok: true; ctx: AuthContext } | { ok: false; status: number; message: string }> {
  const auth = await getAuthContext();
  if (!auth.user) return { ok: false, status: 401, message: "Unauthorized" };
  if (auth.isAdmin) return { ok: true, ctx: auth };
  const supabase = getSupabase();
  // هل هو أستاذ المقرر؟
  const { data: course } = await supabase.from("courses").select("teacher_id").eq("id", courseId).maybeSingle();
  if (course && course.teacher_id === auth.user.id) return { ok: true, ctx: auth };
  // هل هو طالب مسجل؟
  const { data: enrollment } = await supabase.from("course_enrollments").select("id").eq("course_id", courseId).eq("student_email", auth.user.email.toLowerCase()).maybeSingle();
  if (enrollment) return { ok: true, ctx: auth };
  return { ok: false, status: 403, message: "Forbidden — not enrolled in this course / غير مسجل في هذا المقرر" };
}
