-- ============================================================================
-- SABRATHA ELT Tech-Assistant — Database Upgrade v2 (Classroom Management)
-- مساعد التدريس التفاعلي — ترقية قاعدة البيانات (إدارة الصف)
-- ----------------------------------------------------------------------------
-- Adds: multi-course support (courses), students, attendance, gradebook
-- (grade_items + grades), and lecture scheduling columns.
--
-- HOW TO RUN (same as before):
--   1. Supabase Dashboard → SQL Editor → New query
--   2. Paste this whole file → Run
--   3. Expect: "Success. No rows returned"
--
-- Safe to run more than once (IF NOT EXISTS everywhere).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) courses — multiple subjects/courses (مقررات)
-- ----------------------------------------------------------------------------
create table if not exists public.courses (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 2) lectures — add course link + schedule (مسماها وتوقيتها)
-- ----------------------------------------------------------------------------
alter table public.lectures
  add column if not exists course_id uuid references public.courses(id) on delete set null;
alter table public.lectures
  add column if not exists lecture_date date;
alter table public.lectures
  add column if not exists lecture_time time;

-- ----------------------------------------------------------------------------
-- 3) students — student roster per course (أسماء الطلبة والطالبات)
-- ----------------------------------------------------------------------------
create table if not exists public.students (
  id             uuid primary key default gen_random_uuid(),
  course_id      uuid not null references public.courses(id) on delete cascade,
  full_name      text not null,
  student_number text,
  created_at     timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 4) attendance — presence/absence/late per session date (الحضور والغياب)
-- ----------------------------------------------------------------------------
create table if not exists public.attendance (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references public.students(id) on delete cascade,
  course_id    uuid not null references public.courses(id) on delete cascade,
  session_date date not null default current_date,
  status       text not null default 'present'
               check (status in ('present', 'absent', 'late')),
  created_at   timestamptz not null default now(),
  unique (student_id, course_id, session_date)
);

-- ----------------------------------------------------------------------------
-- 5) grade_items — assessments of the three categories
--    (أعمال السنة / الحضور والغياب / الاختبارات والامتحانات)
-- ----------------------------------------------------------------------------
create table if not exists public.grade_items (
  id         uuid primary key default gen_random_uuid(),
  course_id  uuid not null references public.courses(id) on delete cascade,
  category   text not null
             check (category in ('coursework', 'attendance', 'exam')),
  title      text not null,
  max_score  numeric not null default 100,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 6) grades — one score per student per grade item (الدرجات)
-- ----------------------------------------------------------------------------
create table if not exists public.grades (
  id         uuid primary key default gen_random_uuid(),
  item_id    uuid not null references public.grade_items(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  score      numeric,
  created_at timestamptz not null default now(),
  unique (item_id, student_id)
);

-- ----------------------------------------------------------------------------
-- Indexes
-- ----------------------------------------------------------------------------
create index if not exists idx_lectures_course     on public.lectures (course_id, created_at desc);
create index if not exists idx_students_course     on public.students (course_id, full_name);
create index if not exists idx_attendance_course   on public.attendance (course_id, session_date);
create index if not exists idx_attendance_student  on public.attendance (student_id);
create index if not exists idx_grade_items_course  on public.grade_items (course_id, category);
create index if not exists idx_grades_item         on public.grades (item_id);
create index if not exists idx_grades_student      on public.grades (student_id);

-- ----------------------------------------------------------------------------
-- Row Level Security — same classroom policy as schema.sql (anon access;
-- tighten with Supabase Auth later — see examples at the end of schema.sql)
-- ----------------------------------------------------------------------------
alter table public.courses     enable row level security;
alter table public.students    enable row level security;
alter table public.attendance  enable row level security;
alter table public.grade_items enable row level security;
alter table public.grades      enable row level security;

drop policy if exists "courses_anon_all"     on public.courses;
drop policy if exists "students_anon_all"    on public.students;
drop policy if exists "attendance_anon_all"  on public.attendance;
drop policy if exists "grade_items_anon_all" on public.grade_items;
drop policy if exists "grades_anon_all"      on public.grades;

create policy "courses_anon_all"
  on public.courses for all to anon using (true) with check (true);

create policy "students_anon_all"
  on public.students for all to anon using (true) with check (true);

create policy "attendance_anon_all"
  on public.attendance for all to anon using (true) with check (true);

create policy "grade_items_anon_all"
  on public.grade_items for all to anon using (true) with check (true);

create policy "grades_anon_all"
  on public.grades for all to anon using (true) with check (true);
