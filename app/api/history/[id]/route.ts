import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, getSupabase, getSupabaseBypass } from "@/lib/server/role";

// GET /api/history/:id — تفاصيل محاضرة واحدة (يملكها الأستاذ فقط)
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext();
  if (!ctx.user) return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
  if (ctx.isStudent) return NextResponse.json({ success: false, error: { message: "Forbidden" } }, { status: 403 });
  const supabase = (ctx as any).teacherUsername ? getSupabaseBypass() : getSupabase();
  const teacherUsername = (ctx as any).teacherUsername as string | undefined;

  let q = supabase.from("lectures_history").select("*").eq("id", params.id);
  if (teacherUsername) q = q.eq("teacher_username", teacherUsername.toLowerCase());
  else q = q.eq("professor_id", ctx.user.id);
  const { data, error } = await q.single();

  if (error) return NextResponse.json({ success: false, error: { message: error.message } }, { status: 404 });
  return NextResponse.json({ success: true, data });
}

// DELETE /api/history/:id — حذف محاضرة من سجل الأستاذ
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext();
  if (!ctx.user) return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
  if (ctx.isStudent) return NextResponse.json({ success: false, error: { message: "Forbidden" } }, { status: 403 });
  const supabase = (ctx as any).teacherUsername ? getSupabaseBypass() : getSupabase();
  const teacherUsername = (ctx as any).teacherUsername as string | undefined;

  let del = supabase.from("lectures_history").delete().eq("id", params.id);
  if (teacherUsername) del = del.eq("teacher_username", teacherUsername.toLowerCase());
  else del = del.eq("professor_id", ctx.user.id);
  const { error } = await del;

  if (error) return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ success: true });
}
