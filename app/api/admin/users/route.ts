import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/server/adminCheck";

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

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function parseEmails(input: string): string[] {
  // يدعم فاصلة، فاصلة منقوطة، مسافة، سطر جديد
  return input
    .split(/[\n,;]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .filter((e, i, arr) => arr.indexOf(e) === i) // إزالة التكرار
    .filter((e) => EMAIL_RE.test(e));
}

// GET /api/admin/users?q=... — استعراض القائمة (للمشرفة فقط)
export async function GET(req: NextRequest) {
  const check = await requireAdmin();
  if (!check.ok) return NextResponse.json({ success: false, error: { message: check.message } }, { status: check.status });

  const supabase = getSupabase();
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim().toLowerCase();

  let query = supabase.from("allowed_users").select("email, role, full_name, created_at, added_by").order("created_at", { ascending: false });

  // بحث اختياري — نفلتر بعد الجلب لأن Supabase لا يدعم ilike على عدة حقول بسهولة مع RLS
  const { data, error } = await query;
  if (error) return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });

  let filtered = data || [];
  if (q) {
    filtered = filtered.filter((u: any) => u.email.toLowerCase().includes(q) || (u.full_name || "").toLowerCase().includes(q));
  }

  const stats = {
    total: filtered.length,
    teachers: filtered.filter((u: any) => u.role === "teacher").length,
    admins: filtered.filter((u: any) => u.role === "admin").length,
  };

  return NextResponse.json({ success: true, data: filtered, stats });
}

// POST /api/admin/users — إضافة بريد/بريدات جديدة (للمشرفة فقط)
export async function POST(req: NextRequest) {
  const check = await requireAdmin();
  if (!check.ok) return NextResponse.json({ success: false, error: { message: check.message } }, { status: check.status });

  const supabase = getSupabase();
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ success: false, error: { message: "Invalid JSON" } }, { status: 400 });

  // يدعم حقلين: email واحد أو emails متعدد
  let emails: string[] = [];
  let full_name: string | null = body.full_name?.trim() || null;
  let role: string = body.role === "admin" ? "admin" : "teacher";

  if (body.emails) {
    emails = parseEmails(String(body.emails));
  } else if (body.email) {
    emails = parseEmails(String(body.email));
  }

  if (emails.length === 0) {
    return NextResponse.json({ success: false, error: { message: "No valid emails provided. / لا يوجد بريد صالح" } }, { status: 400 });
  }

  // لو بريد واحد فقط نستخدم الاسم، لو متعدد نهمل الاسم
  if (emails.length > 1) full_name = null;

  const rows = emails.map((email) => ({
    email,
    role,
    full_name,
    added_by: check.user.id,
  }));

  // إدخال مع تجاهل الموجود (on conflict do nothing محاكى عبر upsert)
  const { data, error } = await supabase.from("allowed_users").upsert(rows, { onConflict: "email", ignoreDuplicates: false }).select();

  // في حالة الرغبة بتجاهل التكرار بدون تحديث، نستخدم insert مع handling
  // لكن upsert سيحدث role/full_name لو البريد موجود — وهو سلوك مفيد للمشرفة
  if (error) return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });

  return NextResponse.json({ success: true, data, added: emails.length });
}

// DELETE /api/admin/users — حذف بريد (للمشرفة فقط)
export async function DELETE(req: NextRequest) {
  const check = await requireAdmin();
  if (!check.ok) return NextResponse.json({ success: false, error: { message: check.message } }, { status: check.status });

  const body = await req.json().catch(() => null);
  const email = body?.email ? String(body.email).trim().toLowerCase() : "";

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ success: false, error: { message: "Valid email required" } }, { status: 400 });
  }

  // حماية: لا تحذف نفسك
  if (email === check.user.email.toLowerCase()) {
    return NextResponse.json({ success: false, error: { message: "Cannot remove yourself. / لا يمكنك حذف نفسك" } }, { status: 400 });
  }

  const supabase = getSupabase();
  const { error } = await supabase.from("allowed_users").delete().eq("email", email);

  if (error) return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });

  return NextResponse.json({ success: true, removed: email });
}
