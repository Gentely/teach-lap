import { requireAdmin } from "@/lib/server/adminCheck";
import AdminClient from "./AdminClient";
import Link from "next/link";

// هذه الصفحة محمية على مستويين: Middleware + فحص الخادم هنا
export default async function AdminPage() {
  const check = await requireAdmin();

  if (!check.ok) {
    const isUnauthorized = check.status === 401;
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-3xl shadow border border-slate-100 p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 text-red-500 grid place-items-center text-2xl mx-auto">🔒</div>
          <h1 className="mt-4 font-black text-[#0B3C49] text-xl">
            {isUnauthorized ? "Please sign in / الرجاء تسجيل الدخول" : "Access denied — admin only / الوصول مرفوض — للمشرفة فقط"}
          </h1>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            {isUnauthorized
              ? "You need to sign in first."
              : check.message}
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Your account must have <code>role = admin</code> in <code>allowed_users</code>. The supervisor is <code>enas.mesbah@sabratha.edu.ly</code>.
          </p>
          <div className="mt-6 flex gap-2 justify-center">
            <Link href={isUnauthorized ? "/login" : "/"} className="px-5 py-2.5 rounded-xl bg-[#0F4C5C] text-white text-sm font-black">
              {isUnauthorized ? "Go to Login" : "Back to home / العودة للرئيسية"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // مخوّل — اعرض لوحة التحكم
  return <AdminClient currentUserEmail={check.user.email} />;
}
