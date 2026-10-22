"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import Link from "next/link";

type UserRow = {
  email: string;
  role: "admin" | "teacher";
  full_name: string | null;
  created_at: string;
  added_by: string | null;
};

export default function AdminClient({ currentUserEmail }: { currentUserEmail: string }) {
  const { locale } = useI18n();
  const isRTL = locale === "ar";
  const t = (isRTL ? {
    title: "لوحة تحكم المشرفة",
    subtitle: "إدارة قائمة الدعوات — هذه الصفحة للمشرفة فقط",
    badge: "للمشرفة فقط",
    statsTotal: "إجمالي الدعوات",
    statsTeachers: "معلمون",
    statsAdmins: "مشرفون",
    addTitle: "إضافة أساتذة",
    addDesc: "أدخل بريداً واحداً أو عدة بريدات مفصولة بفاصلة أو سطر جديد. بضغطة زر يتم تفعيل الحسابات.",
    emailPh: "البريدات مفصولة بفاصلة أو سطر — مثال: ali@uni.ly, sara@uni.ly",
    namePh: "الاسم الكامل (اختياري، يُطبق عند بريد واحد فقط)",
    roleLabel: "الصلاحية",
    roleTeacher: "معلم",
    roleAdmin: "مشرفة",
    addBtn: "إضافة إلى القائمة البيضاء",
    adding: "جاري الإضافة…",
    listTitle: "القائمة البيضاء",
    searchPh: "بحث بالبريد أو الاسم…",
    empty: "لا يوجد مستخدمون بعد",
    tableEmail: "البريد",
    tableName: "الاسم",
    tableRole: "الصلاحية",
    tableDate: "تاريخ الإضافة",
    tableActions: "إجراءات",
    delete: "حذف",
    deleteConfirm: "هل تريد حذف هذا البريد من القائمة؟ سيفقد الوصول فوراً.",
    selfDeleteWarn: "لا يمكنك حذف نفسك.",
    successAdded: "تمت الإضافة بنجاح",
    successRemoved: "تم الحذف بنجاح",
    error: "خطأ",
    goHome: "العودة للرئيسية",
    you: "أنت",
  } : {
    title: "Admin Dashboard",
    subtitle: "Manage whitelist — only supervisor can access this page",
    badge: "Admin only",
    statsTotal: "Total invited",
    statsTeachers: "Teachers",
    statsAdmins: "Admins",
    addTitle: "Add professors",
    addDesc: "Enter one or many emails (comma or new line). One click activates accounts.",
    emailPh: "emails, separated by comma or new line — e.g. ali@uni.ly, sara@uni.ly",
    namePh: "Full name (optional, applied to single email)",
    roleLabel: "Role",
    roleTeacher: "Teacher",
    roleAdmin: "Admin",
    addBtn: "Add to whitelist",
    adding: "Adding…",
    listTitle: "Whitelist",
    searchPh: "Search email or name…",
    empty: "No users yet",
    tableEmail: "Email",
    tableName: "Name",
    tableRole: "Role",
    tableDate: "Added",
    tableActions: "Actions",
    delete: "Remove",
    deleteConfirm: "Remove this email from whitelist? They will lose access immediately.",
    selfDeleteWarn: "You cannot remove yourself.",
    successAdded: "Added successfully",
    successRemoved: "Removed successfully",
    error: "Error",
    goHome: "Back to home",
    you: "you",
  }) as any;

  const [users, setUsers] = useState<UserRow[]>([]);
  const [stats, setStats] = useState({ total: 0, teachers: 0, admins: 0 });
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [emailsInput, setEmailsInput] = useState("");
  const [fullNameInput, setFullNameInput] = useState("");
  const [roleInput, setRoleInput] = useState<"teacher" | "admin">("teacher");
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function fetchUsers() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const j = await res.json();
      if (!j.success) throw new Error(j.error?.message);
      setUsers(j.data || []);
      setStats(j.stats || { total: 0, teachers: 0, admins: 0 });
    } catch (e: any) {
      setMsg({ type: "error", text: e.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAdd() {
    if (!emailsInput.trim()) return setMsg({ type: "error", text: isRTL ? "أدخل بريداً واحداً على الأقل" : "Enter at least one email" });
    setAdding(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: emailsInput, full_name: fullNameInput.trim() || null, role: roleInput }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.error?.message);
      setMsg({ type: "success", text: `${t.successAdded} — ${j.added} ${isRTL ? "بريد" : "email(s)"}` });
      setEmailsInput("");
      setFullNameInput("");
      await fetchUsers();
    } catch (e: any) {
      setMsg({ type: "error", text: e.message });
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(email: string) {
    if (email.toLowerCase() === currentUserEmail.toLowerCase()) {
      setMsg({ type: "error", text: t.selfDeleteWarn });
      return;
    }
    if (!confirm(t.deleteConfirm)) return;
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.error?.message);
      setMsg({ type: "success", text: t.successRemoved });
      setUsers((prev) => prev.filter((u) => u.email.toLowerCase() !== email.toLowerCase()));
      setStats((s) => ({ ...s, total: Math.max(0, s.total - 1) }));
    } catch (e: any) {
      setMsg({ type: "error", text: e.message });
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir={isRTL ? "rtl" : "ltr"}>
      <div className="bg-gradient-to-br from-[#0B3C49] via-[#0F4C5C] to-[#14657A] text-white rounded-3xl p-8">
        <div className="flex flex-wrap gap-3 justify-between items-start">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              🛡️ {t.title} <span className="bg-[#E3B23C] text-[#0B3C49] text-[10px] px-2 py-1 rounded-full font-black">{t.badge}</span>
            </h1>
            <p className="text-white/80 mt-2 text-sm leading-relaxed">{t.subtitle}</p>
            <p className="text-white/60 text-xs mt-1">Logged as: {currentUserEmail}</p>
          </div>
          <Link href="/" className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-bold hover:bg-white/20">
            {t.goHome}
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="bg-white/10 border border-white/20 rounded-2xl p-4 text-center">
            <p className="text-2xl font-black">{stats.total}</p>
            <p className="text-xs text-white/70">{t.statsTotal}</p>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-2xl p-4 text-center">
            <p className="text-2xl font-black">{stats.teachers}</p>
            <p className="text-xs text-white/70">{t.statsTeachers}</p>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-2xl p-4 text-center">
            <p className="text-2xl font-black">{stats.admins}</p>
            <p className="text-xs text-white/70">{t.statsAdmins}</p>
          </div>
        </div>
      </div>

      {/* Add form */}
      <div className="mt-6 bg-white rounded-3xl shadow border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="font-black text-[#0B3C49] text-sm">{t.addTitle}</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{t.addDesc}</p>
        </div>
        <div className="p-6 space-y-3">
          <textarea
            value={emailsInput}
            onChange={(e) => setEmailsInput(e.target.value)}
            placeholder={t.emailPh}
            rows={3}
            className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#0F4C5C] leading-6"
          />
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              value={fullNameInput}
              onChange={(e) => setFullNameInput(e.target.value)}
              placeholder={t.namePh}
              className="w-full rounded-xl border-2 border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#0F4C5C]"
            />
            <label className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
              <span className="text-xs font-bold text-slate-700">{t.roleLabel}</span>
              <select value={roleInput} onChange={(e) => setRoleInput(e.target.value as any)} className="flex-1 bg-transparent text-sm font-bold outline-none">
                <option value="teacher">{t.roleTeacher}</option>
                <option value="admin">{t.roleAdmin}</option>
              </select>
            </label>
          </div>
          <button onClick={handleAdd} disabled={adding || !emailsInput.trim()} className="w-full py-3 rounded-xl bg-[#0F4C5C] text-white font-black text-sm disabled:opacity-60 disabled:cursor-not-allowed">
            {adding ? t.adding : t.addBtn}
          </button>
          {msg && <p className={`text-xs rounded-xl p-3 border ${msg.type === "success" ? "text-emerald-700 bg-emerald-50 border-emerald-100" : "text-red-600 bg-red-50 border-red-100"}`}>{msg.text}</p>}
        </div>
      </div>

      {/* List */}
      <div className="mt-6 bg-white rounded-3xl shadow border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b flex flex-wrap gap-3 justify-between items-center">
          <h2 className="font-black text-[#0B3C49] text-sm">
            {t.listTitle} <span className="font-normal text-slate-500">({users.length})</span>
          </h2>
          <div className="flex gap-2">
            <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && fetchUsers()} placeholder={t.searchPh} className="rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#0F4C5C] w-48" />
            <button onClick={fetchUsers} className="px-4 py-2 rounded-xl bg-[#0F4C5C] text-white text-xs font-bold">Search</button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">{isRTL ? "جاري التحميل…" : "Loading…"}</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">{t.empty}</div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="text-start px-4 py-3 font-bold">{t.tableEmail}</th>
                  <th className="text-start px-4 py-3 font-bold hidden sm:table-cell">{t.tableName}</th>
                  <th className="text-start px-4 py-3 font-bold">{t.tableRole}</th>
                  <th className="text-start px-4 py-3 font-bold hidden md:table-cell">{t.tableDate}</th>
                  <th className="text-end px-4 py-3 font-bold">{t.tableActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const isSelf = u.email.toLowerCase() === currentUserEmail.toLowerCase();
                  return (
                    <tr key={u.email} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-800 text-xs break-all">{u.email} {isSelf && <span className="ms-1 bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 rounded-full">{t.you}</span>}</div>
                        <div className="sm:hidden text-[11px] text-slate-500">{u.full_name || "—"}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 hidden sm:table-cell">{u.full_name || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-black px-2 py-1 rounded-full ${u.role === "admin" ? "bg-[#0B3C49] text-white" : "bg-slate-100 text-slate-700 border border-slate-200"}`}>
                          {u.role === "admin" ? t.roleAdmin : t.roleTeacher}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-slate-500 hidden md:table-cell">{new Date(u.created_at).toLocaleDateString(isRTL ? "ar-EG" : "en-US")}</td>
                      <td className="px-4 py-3 text-end">
                        <button
                          onClick={() => handleDelete(u.email)}
                          disabled={isSelf}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${isSelf ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed" : "bg-white text-red-600 border-red-200 hover:bg-red-50"}`}
                          title={isSelf ? t.selfDeleteWarn : t.delete}
                        >
                          {t.delete}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-[11px] text-slate-400 text-center mt-4 leading-relaxed">
        {isRTL ? "يتم حفظ added_by تلقائياً كهوية المشرفة التي أضافت البريد. الحذف فوري ويفقد الأستاذ الوصول." : "added_by is saved automatically as the supervisor who added the email. Removal is immediate — the professor loses access."}
      </p>
    </div>
  );
}
