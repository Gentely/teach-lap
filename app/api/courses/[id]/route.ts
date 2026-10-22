import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, requireCourseTeacher, getSupabase, getSupabaseBypass } from "@/lib/server/role";

// GET /api/courses/:id — تفاصيل مقرر واحد (يجب أن يكون له حق الوصول)
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext();
  if (!ctx.user) return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });

  const supabase = (ctx as any).teacherUsername ? getSupabaseBypass() : getSupabase();
  const { data: course, error } = await supabase.from("courses").select("*").eq("id", params.id).maybeSingle();
  if (error || !course) return NextResponse.json({ success: false, error: { message: "Course not found" } }, { status: 404 });

  // التحقق من الوصول: أستاذه أو طالب مسجل أو مشرف
  const isTeacher = ((course as any).teacher_username && String((course as any).teacher_username).toLowerCase() === (ctx as any).teacherUsername) || (course as any).teacher_id === ctx.user.id || ctx.isAdmin;
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

  const supabase = (check.ctx as any).teacherUsername ? getSupabaseBypass() : getSupabase();
  const { data, error } = await supabase.from("courses").update(updates).eq("id", params.id).select().single();
  if (error) return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

// DELETE /api/courses/:id — حذف مقرر (للأستاذ فقط)
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const check = await requireCourseTeacher(params.id);
  if (!check.ok) return NextResponse.json({ success: false, error: { message: check.message } }, { status: check.status });

  const supabase = (check.ctx as any).teacherUsername ? getSupabaseBypass() : getSupabase();
  const { error } = await supabase.from("courses").delete().eq("id", params.id);
  if (error) return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ success: true });
}
