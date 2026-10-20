-- ============================================================================
-- SABRATHA ELT Tech-Assistant — Supabase (PostgreSQL) Schema
-- مساعد تكنولوجيا تدريس اللغة الإنجليزية — جامعة صبراتة
-- ----------------------------------------------------------------------------
-- How to run:
--   1. Open your Supabase project → SQL Editor
--   2. Paste this whole file and click "Run"
--   3. Copy the Project URL + anon public key into supabase.js
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1) lectures — the raw lecture content uploaded / pasted by users
-- ----------------------------------------------------------------------------
create table if not exists public.lectures (
  id              uuid primary key default gen_random_uuid(),
  title           text not null default 'Untitled lecture',
  source_text     text not null,
  output_language text not null default 'ar'
                  check (output_language in ('ar', 'en', 'bilingual')),
  created_at      timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 2) analyses — the AI-generated pedagogical content for each lecture
-- ----------------------------------------------------------------------------
create table if not exists public.analyses (
  id                    uuid primary key default gen_random_uuid(),
  lecture_id            uuid not null references public.lectures(id) on delete cascade,
  summary               text not null default '',
  core_concepts         jsonb not null default '[]'::jsonb,
  key_takeaways         jsonb not null default '[]'::jsonb,
  libyan_applications   jsonb not null default '[]'::jsonb,
  scenario_qa           jsonb not null default '[]'::jsonb,
  reflection_tasks      jsonb not null default '[]'::jsonb,
  discussion_questions  jsonb not null default '[]'::jsonb,
  model                 text,
  created_at            timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 3) comments — the discussion board (students & professors)
-- ----------------------------------------------------------------------------
create table if not exists public.comments (
  id           uuid primary key default gen_random_uuid(),
  lecture_id   uuid not null references public.lectures(id) on delete cascade,
  author_name  text not null,
  author_role  text not null default 'student'
               check (author_role in ('student', 'professor')),
  content      text not null,
  created_at   timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 4) reflections — student responses to the generated reflection tasks
-- ----------------------------------------------------------------------------
create table if not exists public.reflections (
  id           uuid primary key default gen_random_uuid(),
  lecture_id   uuid not null references public.lectures(id) on delete cascade,
  task_index   int  not null default 0,
  task_title   text,
  author_name  text not null default 'طالب',
  response     text not null,
  created_at   timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Indexes for the hot paths (fetch by lecture, newest first)
-- ----------------------------------------------------------------------------
create index if not exists idx_analyses_lecture   on public.analyses (lecture_id, created_at desc);
create index if not exists idx_comments_lecture   on public.comments (lecture_id, created_at desc);
create index if not exists idx_reflections_lecture on public.reflections (lecture_id, task_index, created_at desc);
create index if not exists idx_lectures_created   on public.lectures (created_at desc);

-- ============================================================================
-- Row Level Security
-- ----------------------------------------------------------------------------
-- NOTE: This project ships WITHOUT authentication so it can be used freely in
-- class right away. The policies below therefore allow the `anon` role to
-- read / write the classroom data. BEFORE going public with a large audience,
-- either:
--   a) enable Supabase Auth and replace the anon policies with
--      `auth.role() = 'authenticated'` policies (examples are commented at the
--      bottom of this file), or
--   b) keep the tables private and write through a serverless function using
--      the service-role key.
-- ============================================================================

alter table public.lectures    enable row level security;
alter table public.analyses    enable row level security;
alter table public.comments    enable row level security;
alter table public.reflections enable row level security;

drop policy if exists "lectures_anon_all"    on public.lectures;
drop policy if exists "analyses_anon_all"    on public.analyses;
drop policy if exists "comments_anon_all"    on public.comments;
drop policy if exists "reflections_anon_all" on public.reflections;

create policy "lectures_anon_all"
  on public.lectures for all
  to anon
  using (true)
  with check (true);

create policy "analyses_anon_all"
  on public.analyses for all
  to anon
  using (true)
  with check (true);

create policy "comments_anon_all"
  on public.comments for all
  to anon
  using (true)
  with check (true);

create policy "reflections_anon_all"
  on public.reflections for all
  to anon
  using (true)
  with check (true);

-- ============================================================================
-- OPTIONAL — tighten security later with Supabase Auth (example):
--
-- drop policy "comments_anon_all" on public.comments;
-- create policy "comments_auth_read"
--   on public.comments for select
--   to authenticated
--   using (true);
-- create policy "comments_auth_insert"
--   on public.comments for insert
--   to authenticated
--   with check (auth.uid() is not null);
-- ============================================================================
