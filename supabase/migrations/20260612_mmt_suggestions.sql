-- Monday Music Tips suggestions: submitted from the brand-site form
-- (matthewcawood.com/suggest), written by the brand `mmt-suggest` Netlify function
-- via the service role. Owner reads them in admin-analytics.
create table if not exists public.mmt_suggestions (
  id          bigint generated always as identity primary key,
  suggestion  text        not null,
  email       text,
  name        text,
  status      text        not null default 'new' check (status in ('new','read','archived')),
  created_at  timestamptz not null default now()
);
create index if not exists mmt_suggestions_created_idx on public.mmt_suggestions (created_at desc);

alter table public.mmt_suggestions enable row level security;

-- Owner-only read (admin). All writes go through the service-role function.
drop policy if exists mmt_suggestions_owner_read on public.mmt_suggestions;
create policy mmt_suggestions_owner_read on public.mmt_suggestions
  for select to authenticated
  using (lower(auth.jwt() ->> 'email') = 'matthew@matthewcawood.com');
