-- Per-buyer progress for store courses (e.g. The Art of Understanding Music).
-- One row per buyer-per-lesson, written by the course-progress edge function
-- (service role, validated by the buyer's access_token); read by the owner in
-- admin analytics. Lets us see exactly how far each buyer gets through a course.

create table if not exists public.course_progress (
  id              uuid primary key default gen_random_uuid(),
  email           text not null,
  slug            text not null,
  lesson_id       uuid not null,
  lesson_index    int,
  lesson_title    text,
  status          text not null default 'viewed' check (status in ('viewed','completed')),
  first_viewed_at timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (email, slug, lesson_id)
);

create index if not exists course_progress_slug_idx  on public.course_progress (slug);
create index if not exists course_progress_email_idx on public.course_progress (email);

alter table public.course_progress enable row level security;

-- Owner-only read (admin analytics). Writes come from the edge function via the
-- service role, which bypasses RLS.
drop policy if exists course_progress_owner_read on public.course_progress;
create policy course_progress_owner_read on public.course_progress
  for select to authenticated
  using (lower(auth.jwt() ->> 'email') = 'matthew@matthewcawood.com');
