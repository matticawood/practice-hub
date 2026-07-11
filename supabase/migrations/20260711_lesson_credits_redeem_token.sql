-- lesson-redeem security (the typed-email credit-burn IDOR): add a per-purchase
-- redeem token. It ships in the buyer's "package is ready" email as
-- /book-a-lesson/?redeem=<token>; possessing it (or a logged-in session) proves
-- ownership of the email, so redemption no longer trusts a freely-typed address.
-- lesson-credits (?token=) and lesson-redeem (redeem_token / session) accept it;
-- once the booking page + buyer emails + backfill are on tokens, the bare-email
-- path and the ?email= balance oracle are retired.
-- Applied live via the Management API 2026-07-11.
alter table public.lesson_credits
  add column if not exists redeem_token uuid not null default gen_random_uuid();
create index if not exists lesson_credits_redeem_token_idx
  on public.lesson_credits(redeem_token);
