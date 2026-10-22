import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getAuthContext, requireTeacher } from "@/lib/server/role";

function getSupabase() {
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

function getSupabaseBypass() {
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

// نحاول جلب teacher_id الحقيقي للمقارنة عبر service_role إذا لزم
async function getTeacherIdForUsername(username: string): Promise<string | null> {
  try {
    const supabase = getSupabaseBypass();
    const { data } = (await supabase.from("courses").select("teacher_id").eq("teacher_username", username.toLowerCase()).limit(1).maybeSingle()) as any;
    if (data?.teacher_id) return data.teacher_id;
  } catch {}
  return null;
}

// GET /api/courses — قائمة المقررات حسب الدور
export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx.user) return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });

  // اختيار عميل مناسب: تجاوز RLS للأستاذة عبر teacher_session
  const supabase = (ctx as any).teacherUsername ? getSupabaseBypass() : getSupabase();

  if (ctx.isStudent) {
    // الطالب يرى فقط مقرراته المسجل بها
    const { data: enrolls } = await supabase.from("course_enrollments").select("course_id").eq("student_email", ctx.user.email.toLowerCase());
    const ids = (enrolls || []).map((e: any) => e.course_id);
    if (ids.length === 0) return NextResponse.json({ success: true, data: [] });
    const { data, error } = await supabase.from("courses").select("*, teacher:allowed_users!courses_teacher_id_fkey(email, full_name)").in("id", ids).order("created_at", { ascending: false });
    if (error) return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
    return NextResponse.json({ success: true, data, role: ctx.role });
  }

  // أستاذ/مشرف يرى مقرراته (المشرفة ترى الكل)
  // للأستاذة عبر teacher_session نفلتر بـ teacher_username بدلاً من teacher_id
  if ((ctx as any).teacherUsername) {
    const { data, error } = await supabase.from("courses").select("*").eq("teacher_username", (ctx as any).teacherUsername).order("created_at", { ascending: false });
    if (error) return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
    const withCounts = await Promise.all(
      (data || []).map(async (c: any) => {
        const { count } = await supabase.from("course_enrollments").select("id", { count: "exact", head: true }).eq("course_id", c.id);
        return { ...c, students_count: count || 0 };
      })
    );
    return NextResponse.json({ success: true, data: withCounts, role: ctx.role });
  }

  let query = supabase.from("courses").select("*").order("created_at", { ascending: false });
  if (!ctx.isAdmin) query = query.eq("teacher_id", ctx.user.id);
  const { data, error } = await query;
  if (error) return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });

  // إضافة عدد الطلاب لكل مقرر
  const withCounts = await Promise.all(
    (data || []).map(async (c: any) => {
      const { count } = await supabase.from("course_enrollments").select("id", { count: "exact", head: true }).eq("course_id", c.id);
      return { ...c, students_count: count || 0 };
    })
  );

  return NextResponse.json({ success: true, data: withCounts, role: ctx.role });
}

// POST /api/courses — إنشاء مقرر جديد (للأساتذة فقط)
export async function POST(req: NextRequest) {
  const check = await requireTeacher();
  if (!check.ok) return NextResponse.json({ success: false, error: { message: check.message } }, { status: check.status });

  const body = await req.json().catch(() => null);
  const title = String(body?.title || "").trim();
  const code = String(body?.code || "").trim().toUpperCase();
  const description = String(body?.description || "").trim() || null;

  if (title.length < 2 || title.length > 200) return NextResponse.json({ success: false, error: { message: "Title must be 2-200 chars / العنوان 2-200 حرف" } }, { status: 400 });
  if (code.length < 2 || code.length > 30) return NextResponse.json({ success: false, error: { message: "Code must be 2-30 chars / الرمز 2-30 حرف" } }, { status: 400 });

  // للجلسة الجديدة نستخدم service_role ونحاول الحفاظ على teacher_id إن وجد
  const supabase = (check.ctx as any).teacherUsername ? getSupabaseBypass() : getSupabase();
  let teacherId: string | null = check.ctx.user!.id;
  let teacherUsername: string | null = (check.ctx as any).teacherUsername || null;
  if (teacherUsername) {
    // حاول جلب teacher_id الحقيقي من مقرر موجود لنفس الأستاذة لتجاوز قيد FK
    const realId = await getTeacherIdForUsername(teacherUsername);
    if (realId) teacherId = realId;
    else {
      // لا يوجد مقرر سابق — اجعل teacher_id null (يتطلب أن يكون العمود nullable — شغّل supabase/enas_teacher_setup.sql المحدث)
      teacherId = null;
    }
  }
  const insertPayload: any = { title, code, description };
  if (teacherId) insertPayload.teacher_id = teacherId;
  if (teacherUsername) insertPayload.teacher_username = teacherUsername;
  // إذا لم يكن لدينا teacherUsername ولا teacherId صالح، استخدم الوضع القديم
  if (!teacherUsername && teacherId) insertPayload.teacher_id = teacherId;

  const { data, error } = await supabase
    .from("courses")
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    if (error.message.includes("duplicate") || error.code === "23505") {
      return NextResponse.json({ success: false, error: { message: "Code already exists for you / الرمز موجود مسبقاً لديك" } }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}
