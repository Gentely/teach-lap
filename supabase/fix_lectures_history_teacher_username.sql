-- ============================================================
-- إصلاح سجل المحاضرات ليعمل مع نظام teacher_session (Enas/Eman)
-- شغّله في: Supabase Dashboard → SQL Editor → New query → Run
-- يمكن تشغيله بأمان عدة مرات — كل الأوامر idempotent
-- ============================================================

-- 1) إضافة عمود teacher_username لربط محاضرات teacher_session
alter table public.lectures_history add column if not exists teacher_username text;
create index if not exists idx_lectures_history_teacher_username on public.lectures_history(teacher_username);
create index if not exists idx_lectures_history_teacher_created on public.lectures_history(teacher_username, created_at desc);

-- 2) جعل professor_id قابلاً لأن يكون null (محاضرات الأستاذة عبر teacher_session ليس لها auth.users)
-- أولاً نحذف القيد الخارجي إن وجد كـ NOT NULL صارم، ثم نضعه nullable
do $$ begin
  -- إذا كان العمود NOT NULL نجعله nullable
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='lectures_history' and column_name='professor_id' and is_nullable='NO'
  ) then
    alter table public.lectures_history alter column professor_id drop not null;
  end if;
end $$;

-- 3) تعليق توضيحي
comment on column public.lectures_history.teacher_username is 'اسم المستخدم للأستاذة عبر teacher_session (enas/eman) — بديل عن professor_id عند عدم وجود auth.users';
comment on column public.lectures_history.professor_id is 'قد يكون null لمحاضرات teacher_session — يُملأ teacher_username بدلاً منه';

-- 4) (اختياري) ربط المحاضرات القديمة التي لها professor_id بمعرّف enas إن كان البريد يطابق
-- لا ضرر لو لم يوجد: فقط توضيح — اتركه معلقاً إن لم ترد تشغيله
-- update public.lectures_history set teacher_username='enas' where professor_id is not null and teacher_username is null and exists (select 1 from auth.users where id=professor_id and email ilike 'enas%');

select '✅ تم تهيئة lectures_history لـ teacher_username — الآن يمكن لـ Enas/Eman حفظ وقراءة سجلها' as result;
