import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireCourseTeacher, getAuthContext, getSupabase, getSupabaseBypass } from "@/lib/server/role";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function parseEmails(input: string): string[] {
  return input.split(/[\n,;]+/).map(s => s.trim().toLowerCase()).filter(Boolean).filter((e,i,arr)=>arr.indexOf(e)===i).filter(e=>EMAIL_RE.test(e));
}

// GET /api/courses/:id/enroll — قائمة الطلاب المسجلين
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext();
  if (!ctx.user) return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });

  const supabase = (ctx as any).teacherUsername ? getSupabaseBypass() : getSupabase();
  const { data: course } = await supabase.from("courses").select("teacher_id, teacher_username").eq("id", params.id).maybeSingle();
  if (!course) return NextResponse.json({ success: false, error: { message: "Course not found" } }, { status: 404 });

  const isTeacher = (course as any).teacher_username && String((course as any).teacher_username).toLowerCase() === (ctx as any).teacherUsername
    || (course as any).teacher_id === ctx.user.id
    || ctx.isAdmin;
  const { data: en } = await supabase.from("course_enrollments").select("id").eq("course_id", params.id).eq("student_email", ctx.user.email.toLowerCase()).maybeSingle();
  if (!isTeacher && !en && !ctx.isAdmin) return NextResponse.json({ success: false, error: { message: "Forbidden" } }, { status: 403 });

  const { data, error } = await supabase.from("course_enrollments").select("id, student_email, student_id, enrolled_at").eq("course_id", params.id).order("enrolled_at", { ascending: false });
  if (error) return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

// POST /api/courses/:id/enroll — إضافة طلاب (أستاذ فقط)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const check = await requireCourseTeacher(params.id);
  if (!check.ok) return NextResponse.json({ success: false, error: { message: check.message } }, { status: check.status });

  const body = await req.json().catch(() => null);
  const raw = String(body?.emails || body?.email || "").trim();
  const emails = parseEmails(raw);
  if (emails.length === 0) return NextResponse.json({ success: false, error: { message: "No valid emails / لا يوجد بريد صالح" } }, { status: 400 });

  const supabase = (check.ctx as any).teacherUsername ? getSupabaseBypass() : getSupabase();

  // 1) ضمن وجود الطلاب في allowed_users كـ student (نستخدم service_role لتجاوز RLS للأستاذة)
  for (const email of emails) {
    const { data: existing } = await supabase.from("allowed_users").select("email").eq("email", email).maybeSingle();
    if (!existing) {
      // للأستاذة عبر username+كود لا يوجد added_by uuid صالح، نضع null
      const addedBy = String(check.ctx.user!.id).startsWith("teacher:") ? null : check.ctx.user!.id;
      const payload: any = { email, role: "student", full_name: null };
      if (addedBy) payload.added_by = addedBy;
      await supabase.from("allowed_users").insert(payload);
    }
  }

  // 2) تسجيلهم في المقرر
  const rows = emails.map(email => ({ course_id: params.id, student_email: email, student_id: null }));
  const { data, error } = await supabase.from("course_enrollments").upsert(rows, { onConflict: "course_id,student_email", ignoreDuplicates: true }).select();
  if (error) return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });

  return NextResponse.json({ success: true, data, added: emails.length });
}

// DELETE /api/courses/:id/enroll — حذف طالب من المقرر (أستاذ فقط)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const check = await requireCourseTeacher(params.id);
  if (!check.ok) return NextResponse.json({ success: false, error: { message: check.message } }, { status: check.status });

  const body = await req.json().catch(() => null);
  const email = String(body?.email || "").trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) return NextResponse.json({ success: false, error: { message: "Valid email required" } }, { status: 400 });

  const supabase = (check.ctx as any).teacherUsername ? getSupabaseBypass() : getSupabase();
  const { error } = await supabase.from("course_enrollments").delete().eq("course_id", params.id).eq("student_email", email);
  if (error) return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ success: true, removed: email });
}
