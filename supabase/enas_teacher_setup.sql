-- ============================================================
-- إعداد الأستاذة إيناس فقط — يُشغّل بعد ملفات الخطوات 1-5
-- ينشئ مقررات إيناس الثابتة حسب جدولها، ويربطها بها
-- ============================================================

-- نحتاج معرف ثابت لإيناس — نستخدم auth.users id إن وجد، أو ننشئ دخول وهمي
-- أسهل: نأخذ معرف المشرفة الحالية ونستخدمه كمدرس افتراضي، أو نستخدم username كنص
-- هنا نضيف عمود teacher_username اختياري لمقررات إيناس بدون كسر RLS الحالي

-- 1) ضمان وجود الجدول والأعمدة (يُصلح حالة فشل الملف الرابع step5_lms)
-- إذا كان الجدول غير موجود أصلاً (كما في خطأك الحالي teacher_id does not exist) ننشئه كاملاً
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references auth.users(id) on delete cascade,
  title text not null,
  code text not null,
  description text,
  teacher_username text,
  created_at timestamptz not null default now(),
  unique (teacher_id, code)
);
-- إذا كان الجدول موجوداً لكن بعض الأعمدة ناقصة، نضيفها
alter table public.courses add column if not exists teacher_id uuid;
alter table public.courses add column if not exists teacher_username text;
alter table public.courses add column if not exists code text;
alter table public.courses add column if not exists description text;
alter table public.courses add column if not exists title text;
alter table public.courses add column if not exists created_at timestamptz;
create index if not exists idx_courses_teacher_username on public.courses(teacher_username);
create index if not exists idx_courses_teacher on public.courses(teacher_id);
create index if not exists idx_courses_created on public.courses(created_at desc);
alter table public.courses enable row level security;
-- تعبئة code للصفوف القديمة التي كانت null
update public.courses set code = 'TMP-' || substr(id::text,1,8) where code is null;
-- السماح بإنشاء مقررات عبر teacher_username بدون teacher_id (للأستاذة عبر username+كود)
alter table public.courses alter column teacher_id drop not null;
do $$ begin
  alter table public.courses drop constraint if exists courses_teacher_id_fkey;
  alter table public.courses add constraint courses_teacher_id_fkey foreign key (teacher_id) references auth.users(id) on delete cascade not valid;
exception when others then null; end $$;
-- ضمان القيد الفريد teacher_id+code
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'courses_teacher_id_code_key') then
    begin
      alter table public.courses add constraint courses_teacher_id_code_key unique (teacher_id, code);
    exception when duplicate_table then null;
    end;
  end if;
end $$;

-- 2) سياسة إضافية للسماح للخدمة بالقراءة إذا تحقق teacher_username
-- نوسع سياسة courses_select لتشمل teacher_username
drop policy if exists "courses_select" on public.courses;
create policy "courses_select" on public.courses for select to authenticated using (
  teacher_id = auth.uid()
  or teacher_username = lower((auth.jwt() ->> 'email'))
  or teacher_username = 'enas'
  or teacher_username = 'eman'
  or public.is_admin()
  or public.is_enrolled_in_course(id)
  or public.is_enrolled_in_course(id) -- مكرر للتوضيح
);

-- نعيد إنشاء سياسات الإدخال لتسمح لـ Enas عبر service_role أو عبر teacher_username
drop policy if exists "courses_insert" on public.courses;
create policy "courses_insert" on public.courses for insert to authenticated with check (
  (teacher_id = auth.uid() and public.my_role() in ('teacher','admin'))
  or teacher_username in ('enas','eman')
);

-- 3) إدراج مقررات إيناس الثابتة (إن لم تكن موجودة)
-- نستخدم معرف المشرفة كـ teacher_id مؤقتاً — سيتم تحديثه عبر API لاحقاً بالخدمة
-- أو نضع teacher_username = 'enas' مباشرة

-- فهرس فريد جديد لمنع تكرار المواد عند teacher_id null
create unique index if not exists uniq_courses_username_code on public.courses(teacher_username, code);

-- نحاول جلب id للمشرفة (enas.mesbah@sabratha.edu.ly) لاستخدامه كـ teacher_id
do $$
declare
  enas_id uuid;
begin
  select id into enas_id from auth.users where lower(email) = lower('enas.mesbah@sabratha.edu.ly') limit 1;
  if enas_id is null then
    -- إذا لم يوجد مستخدم auth، نستخدم admin id من allowed_users
    select added_by into enas_id from public.allowed_users where lower(email)=lower('enas.mesbah@sabratha.edu.ly') limit 1;
  end if;
  -- لا نولّد UUID عشوائي يخرق المفتاح الخارجي؛ نترك teacher_id null وسيُقبل لأن العمود أصبح nullable
  -- إذا لم نجد معرفاً صالحاً، نُبقي enas_id null

  -- 1) C A L L — سمستر 8 — الأحد 12:30
  insert into public.courses (teacher_id, teacher_username, title, code, description)
  values (enas_id, 'enas', 'C A L L', 'CALL-S8', 'C A L L — السمستر الثامن — الأحد المحاضرة الثالثة 12:30 ظهراً')
  on conflict (teacher_username, code) do nothing;

  -- 2) conversation2 listen & speaking — سمستر 2 — الإثنين 12:30 و 2:00
  insert into public.courses (teacher_id, teacher_username, title, code, description)
  values (enas_id, 'enas', 'conversation2 listen & speaking', 'CONV2-S2', 'conversation2 listen & speaking — السمستر الثاني — الإثنين المحاضرة الثالثة 12:30 والمحاضرة الرابعة 2:00 ظهراً')
  on conflict (teacher_username, code) do nothing;

  -- 3) technology in ELT — سمستر 7 — الأربعاء والخميس 12:30
  insert into public.courses (teacher_id, teacher_username, title, code, description)
  values (enas_id, 'enas', 'technology in ELT', 'TECH-ELT-S7', 'technology in ELT — السمستر السابع — الأربعاء والخميس المحاضرة الثالثة 12:30 ظهراً')
  on conflict (teacher_username, code) do nothing;

  -- 4) phonology — سمستر 4 — الأحد 10:30 و 2:00 + الأربعاء 2:00
  insert into public.courses (teacher_id, teacher_username, title, code, description)
  values (enas_id, 'enas', 'phonology', 'PHON-S4', 'phonology — السمستر الرابع — الأحد المحاضرة الثانية 10:30 والمحاضرة الرابعة 2:00 + الأربعاء المحاضرة الرابعة 2:00 ظهراً')
  on conflict (teacher_username, code) do nothing;
end $$;

-- 4) التحقق
-- select title, code, teacher_username, created_at from public.courses where teacher_username='enas' order by code;
