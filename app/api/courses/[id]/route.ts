import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getAuthContext, requireCourseTeacher } from "@/lib/server/role";

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

// GET /api/courses/:id — تفاصيل مقرر واحد (يجب أن يكون له حق الوصول)
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext();
  if (!ctx.user) return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });

  const supabase = getSupabase();
  const { data: course, error } = await supabase.from("courses").select("*").eq("id", params.id).maybeSingle();
  if (error || !course) return NextResponse.json({ success: false, error: { message: "Course not found" } }, { status: 404 });

  // التحقق من الوصول: أستاذه أو طالب مسجل أو مشرف
  const isTeacher = course.teacher_id === ctx.user.id || ctx.isAdmin;
  let isEnrolled = false;
  if (!isTeacher) {
    const { data: en } = await supabase.from("course_enrollments").select("id").eq("course_id", params.id).eq("student_email", ctx.user.email.toLowerCase()).maybeSingle();
    isEnrolled = !!en;
    if (!isEnrolled) return NextResponse.json({ success: false, error: { message: "Forbidden — not enrolled" } }, { status: 403 });
  }

  // إحصائيات سريعة
  const { count: students_count } = await supabase.from("course_enrollments").select("id", { count: "exact", head: true }).eq("course_id", params.id);
  const { count: lectures_count } = await supabase.from("course_lectures").select("id", { count: "exact", head: true }).eq("course_id", params.id);

  return NextResponse.json({ success: true, data: { ...course, students_count: students_count || 0, lectures_count: lectures_count || 0, role: ctx.role, isTeacher } });
}

// PATCH /api/courses/:id — تعديل مقرر (للأستاذ فقط)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const check = await requireCourseTeacher(params.id);
  if (!check.ok) return NextResponse.json({ success: false, error: { message: check.message } }, { status: check.status });

  const body = await req.json().catch(() => null);
  const updates: any = {};
  if (body?.title !== undefined) {
    const t = String(body.title).trim();
    if (t.length < 2 || t.length > 200) return NextResponse.json({ success: false, error: { message: "Invalid title" } }, { status: 400 });
    updates.title = t;
  }
  if (body?.code !== undefined) {
    const c = String(body.code).trim().toUpperCase();
    if (c.length < 2 || c.length > 30) return NextResponse.json({ success: false, error: { message: "Invalid code" } }, { status: 400 });
    updates.code = c;
  }
  if (body?.description !== undefined) updates.description = String(body.description).trim() || null;

  if (Object.keys(updates).length === 0) return NextResponse.json({ success: false, error: { message: "No fields to update" } }, { status: 400 });

  const supabase = getSupabase();
  const { data, error } = await supabase.from("courses").update(updates).eq("id", params.id).select().single();
  if (error) return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

// DELETE /api/courses/:id — حذف مقرر (للأستاذ فقط)
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const check = await requireCourseTeacher(params.id);
  if (!check.ok) return NextResponse.json({ success: false, error: { message: check.message } }, { status: check.status });

  const supabase = getSupabase();
  const { error } = await supabase.from("courses").delete().eq("id", params.id);
  if (error) return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ success: true });
}
