import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export type AdminCheckResult =
  | { ok: true; user: { id: string; email: string }; role: string; isAdmin: boolean }
  | { ok: false; status: number; message: string };

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

export async function requireAdmin(): Promise<AdminCheckResult> {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email || !user.id) {
    return { ok: false, status: 401, message: "Unauthorized — please sign in." };
  }

  const email = user.email.toLowerCase();
  const { data: row, error } = await supabase
    .from("allowed_users")
    .select("email, role")
    .eq("email", email)
    .maybeSingle();

  if (error) return { ok: false, status: 500, message: error.message };
  if (!row) return { ok: false, status: 403, message: `Email ${email} is not on the whitelist.` };

  const isAdmin = row.role === "admin";
  if (!isAdmin) return { ok: false, status: 403, message: "Forbidden — admin only. هذه الصفحة للمشرفة فقط." };

  return { ok: true, user: { id: user.id, email }, role: row.role, isAdmin: true };
}

// للاستخدام في الصفحات التي تعرض محتوى مختلف حسب الصلاحية (بدون منع)
export async function getCurrentUserRole(): Promise<{ user: { id: string; email: string } | null; role: string | null; isAdmin: boolean }> {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { user: null, role: null, isAdmin: false };
  const { data: row } = await supabase.from("allowed_users").select("role").eq("email", user.email.toLowerCase()).maybeSingle();
  return { user: { id: user.id, email: user.email }, role: row?.role || null, isAdmin: row?.role === "admin" };
}
