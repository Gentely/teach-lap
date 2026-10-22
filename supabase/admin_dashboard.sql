-- ==============================================
-- الخطوة الرابعة: لوحة تحكم المشرفة
-- شغّله في: Supabase Dashboard → SQL Editor → New query → Run
-- بعد تشغيل supabase/whitelist.sql و supabase/lectures_history.sql
-- ==============================================

create extension if not exists "pgcrypto";

-- 1) دالة مساعدة: هل المستخدم الحالي مشرفة؟
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.allowed_users
    where lower(email) = lower((auth.jwt() ->> 'email'))
      and role = 'admin'
  );
$$;

-- السماح للجميع باستدعاء الدالة لفحص الصلاحية
grant execute on function public.is_admin() to authenticated;

-- 2) تحديث سياسات جدول allowed_users للسماح للمشرفة بالإدارة
-- نحذف السياسات القديمة المانعة للكتابة
drop policy if exists "allowed_users_no_insert" on public.allowed_users;
drop policy if exists "allowed_users_no_update" on public.allowed_users;
drop policy if exists "allowed_users_no_delete" on public.allowed_users;

-- سياسة القراءة تبقى مفتوحة لكل المسجلين (للميدلوير)
-- allowed_users_select_own موجودة بالفعل: using (true) for authenticated

-- سياسات جديدة: فقط المشرفة تستطيع الإضافة/التعديل/الحذف
create policy "allowed_users_admin_insert"
  on public.allowed_users for insert
  to authenticated
  with check (public.is_admin());

create policy "allowed_users_admin_update"
  on public.allowed_users for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "allowed_users_admin_delete"
  on public.allowed_users for delete
  to authenticated
  using (public.is_admin());

-- 3) ضمان وجود المشرفة الأساسية (إيناس مصباح عمر)
insert into public.allowed_users (email, role, full_name)
values ('enas.mesbah@sabratha.edu.ly', 'admin', 'Enas Mesbah Omar — إيناس مصباح عمر')
on conflict (email) do update set role = 'admin', full_name = excluded.full_name;

-- 4) اختبار (اختياري بعد تسجيل دخول المشرفة):
-- select public.is_admin(); -- يجب أن ترجع true للمشرفة
-- select * from public.allowed_users order by created_at desc;
