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

// GET /api/courses/:id/lectures — المحاضرات المنشورة في المقرر (للأستاذ وطلابه)
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext();
  if (!ctx.user) return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });

  const supabase = getSupabase();
  // تحقق الوصول
  const { data: course } = await supabase.from("courses").select("teacher_id").eq("id", params.id).maybeSingle();
  if (!course) return NextResponse.json({ success: false, error: { message: "Course not found" } }, { status: 404 });
  const isTeacher = course.teacher_id === ctx.user.id || ctx.isAdmin;
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

  const supabase = getSupabase();

  // تحقق أن المحاضرة يملكها الأستاذ نفسه
  const { data: lecture } = await supabase.from("lectures_history").select("id, professor_id").eq("id", lecture_id).maybeSingle();
  if (!lecture) return NextResponse.json({ success: false, error: { message: "Lecture not found" } }, { status: 404 });
  if (lecture.professor_id !== check.ctx.user!.id && !check.ctx.isAdmin) {
    return NextResponse.json({ success: false, error: { message: "You can only publish your own lectures" } }, { status: 403 });
  }

  const { data, error } = await supabase.from("course_lectures").insert({ course_id: params.id, lecture_id, published_by: check.ctx.user!.id }).select().single();
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

  const supabase = getSupabase();
  const { error } = await supabase.from("course_lectures").delete().eq("course_id", params.id).eq("lecture_id", lecture_id);
  if (error) return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ success: true });
}
