-- جدول القائمة البيضاء — Supabase Auth Whitelist
-- شغّله في: Supabase Dashboard → SQL Editor → New query → Run

create extension if not exists "pgcrypto";

create table if not exists public.allowed_users (
  email       text primary key check (email ~* '^[^@]+@[^@]+\.[^@]+$'),
  role        text not null default 'teacher' check (role in ('admin','teacher')),
  full_name   text,
  added_by    uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_allowed_users_role on public.allowed_users(role);
alter table public.allowed_users enable row level security;

-- القراءة مسموحة لكل مسجل (للتحقق في Middleware)، الكتابة مقصورة على service_role
drop policy if exists "allowed_users_select_own" on public.allowed_users;
create policy "allowed_users_select_own" on public.allowed_users for select to authenticated using (true);
drop policy if exists "allowed_users_no_insert" on public.allowed_users;
create policy "allowed_users_no_insert" on public.allowed_users for insert to authenticated with check (false);
drop policy if exists "allowed_users_no_update" on public.allowed_users;
create policy "allowed_users_no_update" on public.allowed_users for update to authenticated using (false);
drop policy if exists "allowed_users_no_delete" on public.allowed_users;
create policy "allowed_users_no_delete" on public.allowed_users for delete to authenticated using (false);

-- بذرة المشرفة (غيّري البريد لبريدها الحقيقي)
insert into public.allowed_users (email, role, full_name)
values ('enas.mesbah@sabratha.edu.ly', 'admin', 'Enas Mesbah Omar — إيناس مصباح عمر')
on conflict (email) do nothing;

create or replace function public.is_allowed_user(check_email text)
returns boolean language sql stable as $$
  select exists (select 1 from public.allowed_users where lower(email)=lower(check_email));
$$;
