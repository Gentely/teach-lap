import { NextRequest, NextResponse } from "next/server";
import { requireCourseTeacher, getAuthContext, getSupabase, getSupabaseBypass } from "@/lib/server/role";

// GET /api/courses/:id/records?type=attendance|coursework|exams&student_email=... (تصفية اختيارية)
// الأستاذ يرى كل الطلاب، الطالب يرى نفسه فقط
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext();
  if (!ctx.user) return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "attendance"; // attendance | coursework | exams
  const filterEmail = searchParams.get("student_email")?.trim().toLowerCase() || null;

  const supabase = (ctx as any).teacherUsername ? getSupabaseBypass() : getSupabase();

  // تحقق من الوصول للمقرر
  const { data: course } = await supabase.from("courses").select("teacher_id, teacher_username").eq("id", params.id).maybeSingle();
  if (!course) return NextResponse.json({ success: false, error: { message: "Course not found" } }, { status: 404 });
  const isTeacher = ((course as any).teacher_username && String((course as any).teacher_username).toLowerCase() === (ctx as any).teacherUsername) || (course as any).teacher_id === ctx.user.id || ctx.isAdmin;
  if (!isTeacher) {
    const { data: en } = await supabase.from("course_enrollments").select("id").eq("course_id", params.id).eq("student_email", ctx.user.email.toLowerCase()).maybeSingle();
    if (!en) return NextResponse.json({ success: false, error: { message: "Forbidden" } }, { status: 403 });
  }

  let table = "";
  if (type === "attendance") table = "attendance";
  else if (type === "coursework") table = "coursework_grades";
  else if (type === "exams") table = "exam_scores";
  else return NextResponse.json({ success: false, error: { message: "Invalid type" } }, { status: 400 });

  let query = supabase.from(table).select("*").eq("course_id", params.id).order("created_at", { ascending: false }).limit(200);

  // الطالب يرى نفسه فقط — نتجاهل filterEmail إذا كان طالب
  if (ctx.isStudent && !isTeacher) {
    query = query.eq("student_email", ctx.user.email.toLowerCase());
  } else if (filterEmail) {
    query = query.eq("student_email", filterEmail);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });

  return NextResponse.json({ success: true, data, type, role: ctx.role });
}

// POST /api/courses/:id/records — إضافة سجل جديد (أستاذ فقط)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const check = await requireCourseTeacher(params.id);
  if (!check.ok) return NextResponse.json({ success: false, error: { message: check.message } }, { status: check.status });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ success: false, error: { message: "Invalid JSON" } }, { status: 400 });

  const type = String(body.type || "").trim(); // attendance | coursework | exams
  const student_email = String(body.student_email || "").trim().toLowerCase();
  if (!student_email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(student_email)) {
    return NextResponse.json({ success: false, error: { message: "Valid student_email required" } }, { status: 400 });
  }

  const supabase = (check.ctx as any).teacherUsername ? getSupabaseBypass() : getSupabase();

  // تحقق أن الطالب مسجل في المقرر
  const { data: enrolled } = await supabase.from("course_enrollments").select("id").eq("course_id", params.id).eq("student_email", student_email).maybeSingle();
  if (!enrolled) return NextResponse.json({ success: false, error: { message: "Student not enrolled in this course / الطالب غير مسجل في المقرر" } }, { status: 400 });

  let table = "";
  let payload: any = { course_id: params.id, student_email };

  const byId = String(check.ctx.user!.id).startsWith("teacher:") ? null : check.ctx.user!.id;

  if (type === "attendance") {
    table = "attendance";
    const session_date = String(body.session_date || new Date().toISOString().slice(0,10)).trim();
    const status = String(body.status || "present").trim();
    if (!["present","absent","late","excused"].includes(status)) return NextResponse.json({ success: false, error: { message: "Invalid attendance status" } }, { status: 400 });
    payload.session_date = session_date;
    payload.status = status;
    payload.notes = body.notes ? String(body.notes).trim().slice(0,500) : null;
    if (byId) payload.recorded_by = byId;
  } else if (type === "coursework") {
    table = "coursework_grades";
    const title = String(body.title || "").trim();
    const score = Number(body.score);
    const max_score = body.max_score !== undefined ? Number(body.max_score) : 100;
    if (!title || title.length > 200) return NextResponse.json({ success: false, error: { message: "Title required 1-200 chars" } }, { status: 400 });
    if (isNaN(score) || score < 0) return NextResponse.json({ success: false, error: { message: "Invalid score" } }, { status: 400 });
    if (isNaN(max_score) || max_score <= 0) return NextResponse.json({ success: false, error: { message: "Invalid max_score" } }, { status: 400 });
    payload.title = title;
    payload.score = score;
    payload.max_score = max_score;
    payload.notes = body.notes ? String(body.notes).trim().slice(0,500) : null;
    if (byId) payload.graded_by = byId;
  } else if (type === "exams") {
    table = "exam_scores";
    const exam_title = String(body.exam_title || body.title || "").trim();
    const score = Number(body.score);
    const max_score = body.max_score !== undefined ? Number(body.max_score) : 100;
    const exam_date = body.exam_date ? String(body.exam_date).trim() : null;
    if (!exam_title || exam_title.length > 200) return NextResponse.json({ success: false, error: { message: "Exam title required" } }, { status: 400 });
    if (isNaN(score) || score < 0) return NextResponse.json({ success: false, error: { message: "Invalid score" } }, { status: 400 });
    payload.exam_title = exam_title;
    payload.score = score;
    payload.max_score = max_score;
    payload.exam_date = exam_date;
    if (byId) payload.graded_by = byId;
  } else {
    return NextResponse.json({ success: false, error: { message: "Invalid type" } }, { status: 400 });
  }

  const { data, error } = await supabase.from(table).insert(payload).select().single();
  if (error) return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

// DELETE /api/courses/:id/records — حذف سجل (أستاذ فقط) — body: {type, id}
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const check = await requireCourseTeacher(params.id);
  if (!check.ok) return NextResponse.json({ success: false, error: { message: check.message } }, { status: check.status });

  const body = await req.json().catch(() => null);
  const type = String(body?.type || "").trim();
  const recordId = String(body?.id || "").trim();
  if (!recordId) return NextResponse.json({ success: false, error: { message: "Record id required" } }, { status: 400 });

  let table = "";
  if (type === "attendance") table = "attendance";
  else if (type === "coursework") table = "coursework_grades";
  else if (type === "exams") table = "exam_scores";
  else return NextResponse.json({ success: false, error: { message: "Invalid type" } }, { status: 400 });

  const supabase = (check.ctx as any).teacherUsername ? getSupabaseBypass() : getSupabase();
  const { error } = await supabase.from(table).delete().eq("id", recordId).eq("course_id", params.id);
  if (error) return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ success: true });
}
