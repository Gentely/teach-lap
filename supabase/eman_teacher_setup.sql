-- ============================================================
-- إعداد الأستاذة إيمان — يُشغّل بعد enas_teacher_setup.sql
-- ينشئ 3 مقررات لإيمان حسب جدولها: writing1 S1 / Novel2 S7 / Microteaching S8
-- ============================================================

-- ضمان وجود فهرس فريد على teacher_username+code (للإدخال بدون teacher_id)
create unique index if not exists uniq_courses_username_code on public.courses(teacher_username, code);

do $$
declare
  eman_id uuid;
begin
  select id into eman_id from auth.users where lower(email) = lower('eman@sabratha.edu.ly') limit 1;
  if eman_id is null then
    select added_by into eman_id from public.allowed_users where lower(email)=lower('eman@sabratha.edu.ly') limit 1;
  end if;
  -- لا نولد UUID عشوائي — نترك teacher_id null لتجاوز FK (العمود أصبح nullable)
  -- 1) writing 1 — S1 — الثلاثاء 9:00+10:30 والخميس 9:00+10:30
  insert into public.courses (teacher_id, teacher_username, title, code, description)
  values (eman_id, 'eman', 'writing 1', 'WRITE1-S1', 'writing 1 — السمستر الأول — الثلاثاء المحاضرة الأولى 9:00 + الثانية 10:30، الخميس المحاضرة الأولى 9:00 + الثانية 10:30')
  on conflict (teacher_username, code) do nothing;

  -- 2) Novel 2 — S7 — الأربعاء 9:00 والخميس 12:30
  insert into public.courses (teacher_id, teacher_username, title, code, description)
  values (eman_id, 'eman', 'Novel 2', 'NOVEL2-S7', 'Novel 2 — السمستر السابع — الأربعاء المحاضرة الأولى 9:00، الخميس المحاضرة الثالثة 12:30')
  on conflict (teacher_username, code) do nothing;

  -- 3) Microteaching — S8 — الأربعاء 10:30
  insert into public.courses (teacher_id, teacher_username, title, code, description)
  values (eman_id, 'eman', 'Microteaching', 'MICRO-S8', 'Microteaching — السمستر الثامن — الأربعاء المحاضرة الثانية 10:30')
  on conflict (teacher_username, code) do nothing;
end $$;

-- تحقق:
-- select title, code, teacher_username, description from public.courses where teacher_username='eman' order by code;
