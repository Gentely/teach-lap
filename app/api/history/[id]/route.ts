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

// GET /api/history/:id — تفاصيل محاضرة واحدة (يملكها الأستاذ فقط)
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });

  const { data, error } = await supabase
    .from("lectures_history")
    .select("*")
    .eq("id", params.id)
    .eq("professor_id", user.id)
    .single();

  if (error) return NextResponse.json({ success: false, error: { message: error.message } }, { status: 404 });
  return NextResponse.json({ success: true, data });
}

// DELETE /api/history/:id — حذف محاضرة من سجل الأستاذ
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });

  const { error, count } = await supabase
    .from("lectures_history")
    .delete()
    .eq("id", params.id)
    .eq("professor_id", user.id);

  if (error) return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ success: true });
}
