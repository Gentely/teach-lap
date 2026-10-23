import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, getSupabase, getSupabaseBypass } from "@/lib/server/role";

// GET /api/history?limit=20&offset=0 — يرجع سجل الأستاذ الحالي فقط (يدعم teacher_session + Supabase القديم)
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx.user) return NextResponse.json({ success: false, error: { message: "Unauthorized — please sign in / الرجاء تسجيل الدخول" } }, { status: 401 });
  // الطلاب لا يملكون سجلاً — نمنعهم
  if (ctx.isStudent || (ctx as any).studentEmail) {
    return NextResponse.json({ success: false, error: { message: "Forbidden — students have no history / الطلاب ليس لهم سجل" } }, { status: 403 });
  }
  // استخدام bypass للأستاذة عبر teacher_session (يتجاوز RLS)
  const supabase = (ctx as any).teacherUsername ? getSupabaseBypass() : getSupabase();

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10) || 20, 1), 100);
  const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10) || 0, 0);
  const q = (searchParams.get("q") || "").trim();

  // للأستاذة عبر teacher_session نستخدم teacher_username، وإلا professor_id
  const teacherUsername = (ctx as any).teacherUsername as string | undefined;
  const useTeacherUsername = !!teacherUsername;

  let query = supabase
    .from("lectures_history")
    .select("id,title,output_language,input_chars,model_used,created_at,generated_markdown,generated_data,original_text,files_meta,teacher_username,professor_id", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (useTeacherUsername) {
    query = query.eq("teacher_username", teacherUsername!.toLowerCase());
  } else {
    query = query.eq("professor_id", ctx.user!.id);
  }

  if (q) {
    // بحث بسيط في العنوان أو النص الأصلي
    query = query.or(`title.ilike.%${q}%,original_text.ilike.%${q}%`);
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });

  return NextResponse.json({ success: true, data, total: count, limit, offset });
}
