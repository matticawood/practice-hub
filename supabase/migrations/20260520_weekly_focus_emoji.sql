-- Add emoji column to weekly_focus_likes so members can react with any emoji
-- (not just a plain like). Defaults to ❤️ so existing rows are preserved.

ALTER TABLE weekly_focus_likes
  ADD COLUMN IF NOT EXISTS emoji text NOT NULL DEFAULT '❤️';
