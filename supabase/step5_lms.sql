-- ============================================================
-- الخطوة الخامسة والأخيرة: نظام LMS مصغر متعدد المستأجرين
-- شغّله في: Supabase Dashboard → SQL Editor → New query → Run
-- ترتيب التشغيل: whitelist.sql → lectures_history.sql → admin_dashboard.sql → هذا الملف
-- ============================================================

create extension if not exists "pgcrypto";

-- 1) توسيع جدول allowed_users ليشمل دور الطالب
-- أولاً نحذف القيد القديم ثم نضيف الجديد
alter table public.allowed_users drop constraint if exists allowed_users_role_check;
alter table public.allowed_users add constraint allowed_users_role_check
  check (role in ('admin','teacher','student'));

-- 2) جدول المقررات — كل أستاذ له مساحته الخاصة
create table if not exists public.courses (
  id          uuid primary key default gen_random_uuid(),
  teacher_id  uuid not null references auth.users(id) on delete cascade,
  title       text not null check (char_length(title) between 2 and 200),
  code        text not null check (char_length(code) between 2 and 30),
  description text,
  created_at  timestamptz not null default now(),
  unique (teacher_id, code)
);
create index if not exists idx_courses_teacher on public.courses(teacher_id);
create index if not exists idx_courses_created on public.courses(created_at desc);
alter table public.courses enable row level security;

-- 3) جدول ربط الطلاب بالمقررات (التسجيل)
create table if not exists public.course_enrollments (
  id            uuid primary key default gen_random_uuid(),
  course_id     uuid not null references public.courses(id) on delete cascade,
  student_email text not null check (student_email ~* '^[^@]+@[^@]+\.[^@]+$'),
  student_id    uuid references auth.users(id) on delete set null,
  enrolled_at   timestamptz not null default now(),
  unique (course_id, student_email)
);
create index if not exists idx_enrollments_course on public.course_enrollments(course_id);
create index if not exists idx_enrollments_email on public.course_enrollments(student_email);
create index if not exists idx_enrollments_student on public.course_enrollments(student_id);
alter table public.course_enrollments enable row level security;

-- 4) جدول نشر المحاضرات في المقررات (Junction)
create table if not exists public.course_lectures (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid not null references public.courses(id) on delete cascade,
  lecture_id   uuid not null references public.lectures_history(id) on delete cascade,
  published_by uuid references auth.users(id) on delete set null,
  published_at timestamptz not null default now(),
  unique (course_id, lecture_id)
);
create index if not exists idx_course_lectures_course on public.course_lectures(course_id);
create index if not exists idx_course_lectures_lecture on public.course_lectures(lecture_id);
alter table public.course_lectures enable row level security;

-- 5) سجل الحضور والغياب
create table if not exists public.attendance (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid not null references public.courses(id) on delete cascade,
  student_email text not null,
  session_date date not null,
  status       text not null check (status in ('present','absent','late','excused')),
  notes        text,
  recorded_by  uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  unique (course_id, student_email, session_date)
);
create index if not exists idx_attendance_course on public.attendance(course_id);
create index if not exists idx_attendance_student on public.attendance(student_email);
alter table public.attendance enable row level security;

-- 6) درجات أعمال السنة والأنشطة
create table if not exists public.coursework_grades (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid not null references public.courses(id) on delete cascade,
  student_email text not null,
  title        text not null check (char_length(title) between 1 and 200),
  score        numeric not null check (score >= 0),
  max_score    numeric not null default 100 check (max_score > 0),
  notes        text,
  graded_by    uuid references auth.users(id) on delete set null,
  graded_at    timestamptz not null default now()
);
create index if not exists idx_coursework_course on public.coursework_grades(course_id);
create index if not exists idx_coursework_student on public.coursework_grades(student_email);
alter table public.coursework_grades enable row level security;

-- 7) درجات الاختبارات
create table if not exists public.exam_scores (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid not null references public.courses(id) on delete cascade,
  student_email text not null,
  exam_title   text not null check (char_length(exam_title) between 1 and 200),
  score        numeric not null check (score >= 0),
  max_score    numeric not null default 100 check (max_score > 0),
  exam_date    date,
  graded_by    uuid references auth.users(id) on delete set null,
  graded_at    timestamptz not null default now()
);
create index if not exists idx_exam_course on public.exam_scores(course_id);
create index if not exists idx_exam_student on public.exam_scores(student_email);
alter table public.exam_scores enable row level security;

-- ============================================================
-- دوال مساعدة للصلاحيات
-- ============================================================

-- هل المستخدم الحالي مسجل في المقرر كطالب؟
create or replace function public.is_enrolled_in_course(cid uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.course_enrollments
    where course_id = cid
      and lower(student_email) = lower((auth.jwt() ->> 'email'))
  );
$$;
grant execute on function public.is_enrolled_in_course(uuid) to authenticated;

-- هل المستخدم الحالي أستاذ هذا المقرر؟
create or replace function public.is_teacher_of_course(cid uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.courses
    where id = cid and teacher_id = auth.uid()
  );
$$;
grant execute on function public.is_teacher_of_course(uuid) to authenticated;

-- هل المستخدم طالب في أي مقرر؟ (للتحقق العام)
create or replace function public.my_role()
returns text language sql security definer set search_path = public as $$
  select role from public.allowed_users where lower(email)=lower((auth.jwt() ->> 'email')) limit 1;
$$;
grant execute on function public.my_role() to authenticated;

-- ============================================================
-- سياسات RLS — المقررات
-- ============================================================

drop policy if exists "courses_select" on public.courses;
create policy "courses_select" on public.courses for select to authenticated using (
  teacher_id = auth.uid()
  or public.is_admin()
  or public.is_enrolled_in_course(id)
);

drop policy if exists "courses_insert" on public.courses;
create policy "courses_insert" on public.courses for insert to authenticated with check (
  teacher_id = auth.uid() and public.my_role() in ('teacher','admin')
);

drop policy if exists "courses_update" on public.courses;
create policy "courses_update" on public.courses for update to authenticated using (
  teacher_id = auth.uid() or public.is_admin()
) with check (
  teacher_id = auth.uid() or public.is_admin()
);

drop policy if exists "courses_delete" on public.courses;
create policy "courses_delete" on public.courses for delete to authenticated using (
  teacher_id = auth.uid() or public.is_admin()
);

-- ============================================================
-- سياسات التسجيل في المقررات
-- ============================================================

drop policy if exists "enroll_select" on public.course_enrollments;
create policy "enroll_select" on public.course_enrollments for select to authenticated using (
  public.is_teacher_of_course(course_id) or public.is_admin() or lower(student_email)=lower((auth.jwt() ->> 'email'))
);

drop policy if exists "enroll_insert" on public.course_enrollments;
create policy "enroll_insert" on public.course_enrollments for insert to authenticated with check (
  public.is_teacher_of_course(course_id) or public.is_admin()
);

drop policy if exists "enroll_delete" on public.course_enrollments;
create policy "enroll_delete" on public.course_enrollments for delete to authenticated using (
  public.is_teacher_of_course(course_id) or public.is_admin()
);

-- ============================================================
-- سياسات نشر المحاضرات
-- ============================================================

drop policy if exists "course_lectures_select" on public.course_lectures;
create policy "course_lectures_select" on public.course_lectures for select to authenticated using (
  public.is_teacher_of_course(course_id) or public.is_admin() or public.is_enrolled_in_course(course_id)
);

drop policy if exists "course_lectures_insert" on public.course_lectures;
create policy "course_lectures_insert" on public.course_lectures for insert to authenticated with check (
  public.is_teacher_of_course(course_id) or public.is_admin()
);

drop policy if exists "course_lectures_delete" on public.course_lectures;
create policy "course_lectures_delete" on public.course_lectures for delete to authenticated using (
  public.is_teacher_of_course(course_id) or public.is_admin()
);

-- ============================================================
-- سياسات الحضور
-- ============================================================

drop policy if exists "attendance_select" on public.attendance;
create policy "attendance_select" on public.attendance for select to authenticated using (
  public.is_teacher_of_course(course_id) or public.is_admin() or lower(student_email)=lower((auth.jwt() ->> 'email'))
);

drop policy if exists "attendance_insert" on public.attendance;
create policy "attendance_insert" on public.attendance for insert to authenticated with check (
  public.is_teacher_of_course(course_id) or public.is_admin()
);

drop policy if exists "attendance_update" on public.attendance;
create policy "attendance_update" on public.attendance for update to authenticated using (
  public.is_teacher_of_course(course_id) or public.is_admin()
) with check (public.is_teacher_of_course(course_id) or public.is_admin());

drop policy if exists "attendance_delete" on public.attendance;
create policy "attendance_delete" on public.attendance for delete to authenticated using (
  public.is_teacher_of_course(course_id) or public.is_admin()
);

-- ============================================================
-- سياسات أعمال السنة
-- ============================================================

drop policy if exists "coursework_select" on public.coursework_grades;
create policy "coursework_select" on public.coursework_grades for select to authenticated using (
  public.is_teacher_of_course(course_id) or public.is_admin() or lower(student_email)=lower((auth.jwt() ->> 'email'))
);

drop policy if exists "coursework_insert" on public.coursework_grades;
create policy "coursework_insert" on public.coursework_grades for insert to authenticated with check (
  public.is_teacher_of_course(course_id) or public.is_admin()
);

drop policy if exists "coursework_update" on public.coursework_grades;
create policy "coursework_update" on public.coursework_grades for update to authenticated using (
  public.is_teacher_of_course(course_id) or public.is_admin()
) with check (public.is_teacher_of_course(course_id) or public.is_admin());

drop policy if exists "coursework_delete" on public.coursework_grades;
create policy "coursework_delete" on public.coursework_grades for delete to authenticated using (
  public.is_teacher_of_course(course_id) or public.is_admin()
);

-- ============================================================
-- سياسات الاختبارات
-- ============================================================

drop policy if exists "exam_select" on public.exam_scores;
create policy "exam_select" on public.exam_scores for select to authenticated using (
  public.is_teacher_of_course(course_id) or public.is_admin() or lower(student_email)=lower((auth.jwt() ->> 'email'))
);

drop policy if exists "exam_insert" on public.exam_scores;
create policy "exam_insert" on public.exam_scores for insert to authenticated with check (
  public.is_teacher_of_course(course_id) or public.is_admin()
);

drop policy if exists "exam_update" on public.exam_scores;
create policy "exam_update" on public.exam_scores for update to authenticated using (
  public.is_teacher_of_course(course_id) or public.is_admin()
) with check (public.is_teacher_of_course(course_id) or public.is_admin());

drop policy if exists "exam_delete" on public.exam_scores;
create policy "exam_delete" on public.exam_scores for delete to authenticated using (
  public.is_teacher_of_course(course_id) or public.is_admin()
);

-- ============================================================
-- تعليقات توضيحية
-- ============================================================
comment on table public.courses is 'مساحات الأساتذة — كل أستاذ ينشئ مقرراته ويربط طلابه';
comment on table public.course_enrollments is 'ربط الطلاب بالمقررات';
comment on table public.course_lectures is 'نشر محاضرات lectures_history في مقرر معين';
comment on table public.attendance is 'سجل الحضور والغياب';
comment on table public.coursework_grades is 'درجات أعمال السنة والأنشطة';
comment on table public.exam_scores is 'درجات الاختبارات';
