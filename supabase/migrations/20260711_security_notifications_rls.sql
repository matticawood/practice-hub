-- SECURITY (Critical): notifications was anon read/write/DELETE via broad
-- USING(true) policies (5,322 rows incl. member emails + private comment-reply
-- bodies). The table already has correct self-scoped policies (notif_select_own,
-- notif_insert_own, notif_update_own, all `email = auth.jwt()->>'email'`), so we
-- just drop the broad ones. Cross-user INSERT must stay (reacting to a post
-- notifies its author) but is now authenticated-only, killing the anonymous
-- fake-notification / phishing vector. No client path deletes notifications, so
-- no scoped DELETE policy is needed.
--
-- Applied live via the Management API 2026-07-11; committed to match prod.
drop policy if exists notifications_select on public.notifications;
drop policy if exists notifications_update on public.notifications;
drop policy if exists notifications_delete on public.notifications;
drop policy if exists notifications_insert on public.notifications;
create policy notifications_insert on public.notifications for insert to authenticated with check (true);
