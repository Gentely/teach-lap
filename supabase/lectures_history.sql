-- ==============================================
-- الخطوة الثالثة: جدول سجل المحاضرات
-- شغّله في: Supabase Dashboard → SQL Editor → New query → Run
-- ==============================================

-- تأكد من وجود pgcrypto لتوليد UUID
create extension if not exists "pgcrypto";

-- 1) إنشاء الجدول
create table if not exists public.lectures_history (
  id                uuid primary key default gen_random_uuid(),
  professor_id      uuid not null references auth.users(id) on delete cascade,
  title             text check (char_length(title) <= 200),
  original_text     text not null check (char_length(original_text) >= 10),
  output_language   text not null check (output_language in ('en','ar','bilingual')) default 'en',
  generated_data    jsonb not null, -- JSON الكامل من Gemini (summary, core_concepts, ...)
  generated_markdown text not null, -- نسخة Markdown جاهزة للتصدير
  input_chars       integer not null default 0,
  files_meta        jsonb, -- [{fileName, fileType, chars}]
  model_used        text,
  created_at        timestamptz not null default now()
);

-- فهارس للسرعة
create index if not exists idx_lectures_history_professor on public.lectures_history(professor_id);
create index if not exists idx_lectures_history_created on public.lectures_history(created_at desc);
create index if not exists idx_lectures_history_prof_created on public.lectures_history(professor_id, created_at desc);

-- تفعيل RLS
alter table public.lectures_history enable row level security;

-- 2) سياسات RLS — كل أستاذ يرى ويعدّل سجله فقط
drop policy if exists "lectures_select_own" on public.lectures_history;
create policy "lectures_select_own"
  on public.lectures_history for select
  to authenticated
  using (professor_id = auth.uid());

drop policy if exists "lectures_insert_own" on public.lectures_history;
create policy "lectures_insert_own"
  on public.lectures_history for insert
  to authenticated
  with check (professor_id = auth.uid());

drop policy if exists "lectures_update_own" on public.lectures_history;
create policy "lectures_update_own"
  on public.lectures_history for update
  to authenticated
  using (professor_id = auth.uid())
  with check (professor_id = auth.uid());

drop policy if exists "lectures_delete_own" on public.lectures_history;
create policy "lectures_delete_own"
  on public.lectures_history for delete
  to authenticated
  using (professor_id = auth.uid());

-- 3) اختياري: دالة مساعدة لإحصائيات الأستاذ
create or replace function public.count_my_lectures()
returns integer
language sql
security definer
set search_path = public
as $$
  select count(*)::int from public.lectures_history where professor_id = auth.uid();
$$;

-- 4) مثال استعلام للاختبار (بعد تسجيل الدخول):
-- select id, title, created_at, input_chars from public.lectures_history order by created_at desc limit 5;
