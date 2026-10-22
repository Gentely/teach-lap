import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

// GET /api/history?limit=20&offset=0 — يرجع سجل الأستاذ الحالي فقط (محمي بـ RLS)
export async function GET(req: NextRequest) {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10) || 20, 1), 100);
  const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10) || 0, 0);
  const q = (searchParams.get("q") || "").trim();

  let query = supabase
    .from("lectures_history")
    .select("id,title,output_language,input_chars,model_used,created_at,generated_markdown,generated_data,original_text,files_meta", { count: "exact" })
    .eq("professor_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (q) {
    // بحث بسيط في العنوان أو النص الأصلي
    query = query.or(`title.ilike.%${q}%,original_text.ilike.%${q}%`);
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });

  return NextResponse.json({ success: true, data, total: count, limit, offset });
}
