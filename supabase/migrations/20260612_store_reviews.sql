-- Store product reviews: customer-submitted, owner-moderated, shown on product pages.
-- Public may read ONLY approved reviews; all writes go through service-role edge
-- functions (store-review = submit pending, store-reviews-admin = moderate).
create table if not exists public.store_reviews (
  id          bigint generated always as identity primary key,
  slug        text        not null,
  name        text        not null,
  rating      int         not null check (rating between 1 and 5),
  body        text        not null,
  email       text,
  status      text        not null default 'pending' check (status in ('pending','approved','hidden')),
  created_at  timestamptz not null default now(),
  approved_at timestamptz
);
create index if not exists store_reviews_slug_idx   on public.store_reviews (slug);
create index if not exists store_reviews_status_idx on public.store_reviews (status);

alter table public.store_reviews enable row level security;

-- Public (anon + authenticated) may read ONLY approved reviews.
drop policy if exists "read approved reviews" on public.store_reviews;
create policy "read approved reviews" on public.store_reviews
  for select using (status = 'approved');
