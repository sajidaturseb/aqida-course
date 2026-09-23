create table if not exists public.aqida_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  submitted_at timestamptz not null default now(),
  student_name text not null check (char_length(student_name) between 1 and 80),
  student_group text not null check (char_length(student_group) between 1 and 60),
  course_id smallint not null check (course_id in (2, 3)),
  lesson_id smallint not null check (lesson_id between 1 and 25),
  lesson_title text not null check (char_length(lesson_title) between 1 and 160),
  score smallint not null check (score >= 0),
  total smallint not null check (total between 1 and 100 and score <= total),
  percent smallint not null check (percent between 0 and 100),
  duration_seconds integer not null check (duration_seconds between 1 and 86400),
  attempt_id text not null unique check (char_length(attempt_id) between 1 and 80),
  answers jsonb not null default '[]'::jsonb check (jsonb_typeof(answers) = 'array'),
  source text not null default 'github-pages'
);

create index if not exists aqida_quiz_attempts_submitted_at_idx
  on public.aqida_quiz_attempts (submitted_at desc);

create index if not exists aqida_quiz_attempts_course_group_lesson_idx
  on public.aqida_quiz_attempts (course_id, student_group, lesson_id);

alter table public.aqida_quiz_attempts enable row level security;
revoke all on table public.aqida_quiz_attempts from anon, authenticated;
grant all on table public.aqida_quiz_attempts to service_role;

comment on table public.aqida_quiz_attempts is
  'Private Aqida quiz results. Browser clients access this table only through the submit-aqida-quiz Edge Function.';
