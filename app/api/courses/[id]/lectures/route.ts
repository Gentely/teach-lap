import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, requireCourseTeacher, getSupabase, getSupabaseBypass } from "@/lib/server/role";

// GET /api/courses/:id/lectures — المحاضرات المنشورة في المقرر (للأستاذ وطلابه)
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext();
  if (!ctx.user) return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });

  const supabase = (ctx as any).teacherUsername ? getSupabaseBypass() : getSupabase();
  const { data: course } = await supabase.from("courses").select("teacher_id, teacher_username").eq("id", params.id).maybeSingle();
  if (!course) return NextResponse.json({ success: false, error: { message: "Course not found" } }, { status: 404 });
  const isTeacher = ((course as any).teacher_username && String((course as any).teacher_username).toLowerCase() === (ctx as any).teacherUsername) || (course as any).teacher_id === ctx.user.id || ctx.isAdmin;
  if (!isTeacher) {
    const { data: en } = await supabase.from("course_enrollments").select("id").eq("course_id", params.id).eq("student_email", ctx.user.email.toLowerCase()).maybeSingle();
    if (!en) return NextResponse.json({ success: false, error: { message: "Forbidden" } }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("course_lectures")
    .select("id, published_at, lecture:lectures_history(id, title, output_language, generated_markdown, generated_data, created_at, input_chars, professor_id)")
    .eq("course_id", params.id)
    .order("published_at", { ascending: false });

  if (error) return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

// POST /api/courses/:id/lectures — نشر محاضرة من سجل الأستاذ إلى المقرر (أستاذ فقط)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const check = await requireCourseTeacher(params.id);
  if (!check.ok) return NextResponse.json({ success: false, error: { message: check.message } }, { status: check.status });

  const body = await req.json().catch(() => null);
  const lecture_id = String(body?.lecture_id || "").trim();
  if (!lecture_id) return NextResponse.json({ success: false, error: { message: "lecture_id required" } }, { status: 400 });

  const supabase = (check.ctx as any).teacherUsername ? getSupabaseBypass() : getSupabase();

  // للأستاذة عبر teacher_session لا نتحقق من professor_id القديم (يستخدم service_role وتجاوز)
  if (!(check.ctx as any).teacherUsername) {
    const { data: lecture } = await supabase.from("lectures_history").select("id, professor_id").eq("id", lecture_id).maybeSingle();
    if (!lecture) return NextResponse.json({ success: false, error: { message: "Lecture not found" } }, { status: 404 });
    if ((lecture as any).professor_id !== check.ctx.user!.id && !check.ctx.isAdmin) {
      return NextResponse.json({ success: false, error: { message: "You can only publish your own lectures" } }, { status: 403 });
    }
  }

  const publishedBy = String(check.ctx.user!.id).startsWith("teacher:") ? null : check.ctx.user!.id;
  const payload: any = { course_id: params.id, lecture_id };
  if (publishedBy) payload.published_by = publishedBy;

  const { data, error } = await supabase.from("course_lectures").insert(payload).select().single();
  if (error) {
    if (error.code === "23505") return NextResponse.json({ success: false, error: { message: "Already published in this course" } }, { status: 409 });
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
  return NextResponse.json({ success: true, data });
}

// DELETE /api/courses/:id/lectures — إلغاء نشر محاضرة (أستاذ فقط)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const check = await requireCourseTeacher(params.id);
  if (!check.ok) return NextResponse.json({ success: false, error: { message: check.message } }, { status: check.status });

  const body = await req.json().catch(() => null);
  const lecture_id = String(body?.lecture_id || body?.id || "").trim();
  if (!lecture_id) return NextResponse.json({ success: false, error: { message: "lecture_id required" } }, { status: 400 });

  const supabase = (check.ctx as any).teacherUsername ? getSupabaseBypass() : getSupabase();
  const { error } = await supabase.from("course_lectures").delete().eq("course_id", params.id).eq("lecture_id", lecture_id);
  if (error) return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ success: true });
}
