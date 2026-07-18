-- Notification "seen" watermark.
--
-- Splits the OS app-icon badge (a "you have unlooked-at notifications" signal)
-- from per-notification `read` state (the in-app bell's bold/unread highlight).
--
-- The app-icon badge now counts notifications created AFTER this timestamp
-- (the last time the member opened the bell), NOT the unread count. So opening
-- the bell clears the icon badge while leaving individual items unread-until-
-- tapped in the list. Fixes the "mystery" stuck badge caused by informational
-- notifications (achievements / app updates / feed) piling up unread when a
-- member never taps "mark all read".
alter table public.allowed_emails
  add column if not exists notif_seen_at timestamptz;

-- Baseline every existing member as "all seen right now", so the badge starts at
-- 0 and only genuinely new notifications bump it. Without this, members with no
-- watermark would count every historical notification as unseen (a regression),
-- and it also lets the new send-push deploy safely alongside the current client.
update public.allowed_emails
   set notif_seen_at = now()
 where notif_seen_at is null;
