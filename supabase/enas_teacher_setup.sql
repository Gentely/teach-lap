-- ============================================================
-- إعداد الأستاذة إيناس فقط — يُشغّل بعد ملفات الخطوات 1-5
-- ينشئ مقررات إيناس الثابتة حسب جدولها، ويربطها بها
-- ============================================================

-- نحتاج معرف ثابت لإيناس — نستخدم auth.users id إن وجد، أو ننشئ دخول وهمي
-- أسهل: نأخذ معرف المشرفة الحالية ونستخدمه كمدرس افتراضي، أو نستخدم username كنص
-- هنا نضيف عمود teacher_username اختياري لمقررات إيناس بدون كسر RLS الحالي

-- 1) إضافة عمود اختياري لربط المقرر بالأستاذة بالاسم (لا يلغي teacher_id القديم)
alter table public.courses add column if not exists teacher_username text;
create index if not exists idx_courses_teacher_username on public.courses(teacher_username);

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
  if enas_id is null then
    enas_id := gen_random_uuid();
  end if;

  -- 1) C A L L — سمستر 8 — الأحد 12:30
  insert into public.courses (teacher_id, teacher_username, title, code, description)
  values (enas_id, 'enas', 'C A L L', 'CALL-S8', 'C A L L — السمستر الثامن — الأحد المحاضرة الثالثة 12:30 ظهراً')
  on conflict (teacher_id, code) do nothing;

  -- 2) conversation2 listen & speaking — سمستر 2 — الإثنين 12:30 و 2:00
  insert into public.courses (teacher_id, teacher_username, title, code, description)
  values (enas_id, 'enas', 'conversation2 listen & speaking', 'CONV2-S2', 'conversation2 listen & speaking — السمستر الثاني — الإثنين المحاضرة الثالثة 12:30 والمحاضرة الرابعة 2:00 ظهراً')
  on conflict (teacher_id, code) do nothing;

  -- 3) technology in ELT — سمستر 7 — الأربعاء والخميس 12:30
  insert into public.courses (teacher_id, teacher_username, title, code, description)
  values (enas_id, 'enas', 'technology in ELT', 'TECH-ELT-S7', 'technology in ELT — السمستر السابع — الأربعاء والخميس المحاضرة الثالثة 12:30 ظهراً')
  on conflict (teacher_id, code) do nothing;

  -- 4) phonology — سمستر 4 — الأحد 10:30 و 2:00 + الأربعاء 2:00
  insert into public.courses (teacher_id, teacher_username, title, code, description)
  values (enas_id, 'enas', 'phonology', 'PHON-S4', 'phonology — السمستر الرابع — الأحد المحاضرة الثانية 10:30 والمحاضرة الرابعة 2:00 + الأربعاء المحاضرة الرابعة 2:00 ظهراً')
  on conflict (teacher_id, code) do nothing;
end $$;

-- 4) التحقق
-- select title, code, teacher_username, created_at from public.courses where teacher_username='enas' order by code;
