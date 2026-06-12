-- Course registry. Until now the courses (theory/ear/improv) were hardcoded in
-- lesson-studio. This makes them data, so new courses — including the paid store
-- course — can be added without code changes. A course is just a key that groups
-- rows in the existing `lessons` table.
--
--   kind='member' → in-app courses (Courses page, membership-gated)
--   kind='store'  → paid courses sold via the store (store_slug links the product);
--                   `level` on its lessons is used as the CHAPTER number.
--
-- Run in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/gyskfutmncprqxazgatv/sql

CREATE TABLE IF NOT EXISTS courses (
  key         text PRIMARY KEY,                       -- 'theory' | 'the-art-of-understanding-music' | …
  title       text NOT NULL,
  kind        text NOT NULL DEFAULT 'member',         -- 'member' | 'store'
  store_slug  text,                                   -- links a store course to its product slug
  level_label text NOT NULL DEFAULT 'Level',          -- 'Level' (member) | 'Chapter' (store)
  levels      int  NOT NULL DEFAULT 5,                -- how many levels/chapters
  sort        int  NOT NULL DEFAULT 0,
  status      text NOT NULL DEFAULT 'published',      -- 'draft' | 'published'
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Seed the existing in-app courses + the store course.
INSERT INTO courses (key, title, kind, store_slug, level_label, levels, sort) VALUES
  ('theory', 'Music Theory',  'member', NULL, 'Level', 5, 1),
  ('ear',    'Ear Training',  'member', NULL, 'Level', 5, 2),
  ('improv', 'Improvisation', 'member', NULL, 'Level', 5, 3),
  ('the-art-of-understanding-music', 'The Art of Understanding Music', 'store', 'the-art-of-understanding-music', 'Chapter', 4, 10)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Anyone signed in can read the course list (titles/structure aren't sensitive;
-- store-access reads via service role). Writes are owner-only (the Course Studio).
DROP POLICY IF EXISTS courses_read ON courses;
CREATE POLICY courses_read ON courses
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS courses_owner_write ON courses;
CREATE POLICY courses_owner_write ON courses
  FOR ALL TO authenticated
  USING      (lower(auth.jwt() ->> 'email') = 'matthew@matthewcawood.com')
  WITH CHECK (lower(auth.jwt() ->> 'email') = 'matthew@matthewcawood.com');

NOTIFY pgrst, 'reload schema';
