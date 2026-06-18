-- ──────────────────────────────────────────────────────────────────────────────
-- Courses / lessons: the structured learning section (Theory, Ear training,
-- Improvisation). Authored in Lesson Studio (owner-only); shown on the Courses
-- page to members. A lesson is an ordered array of typed content blocks (jsonb).
--
-- Access gating during the build comes for free: members can only read
-- status='published' rows, so nothing shows until you publish it.
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lessons (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course      text NOT NULL,                       -- 'theory' | 'ear' | 'improv'
  level       int  NOT NULL DEFAULT 1,             -- 1–5
  sort_order  int  NOT NULL DEFAULT 0,             -- position within the level
  title       text NOT NULL DEFAULT 'Untitled lesson',
  summary     text,                                -- one-line blurb (optional)
  est_minutes int,                                 -- optional
  blocks      jsonb NOT NULL DEFAULT '[]'::jsonb,  -- ordered content blocks
  status      text NOT NULL DEFAULT 'draft',       -- 'draft' | 'published'
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lessons_course_level_idx ON lessons(course, level, sort_order);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Members read published lessons; the owner reads everything (incl. drafts).
DROP POLICY IF EXISTS lessons_read ON lessons;
CREATE POLICY lessons_read ON lessons
  FOR SELECT USING (
    status = 'published'
    OR lower(auth.jwt() ->> 'email') = 'matthew@matthewcawood.com'
  );

-- Owner-only create/update/delete (Lesson Studio uses the owner's JWT).
DROP POLICY IF EXISTS lessons_owner_write ON lessons;
CREATE POLICY lessons_owner_write ON lessons
  FOR ALL
  USING      (lower(auth.jwt() ->> 'email') = 'matthew@matthewcawood.com')
  WITH CHECK (lower(auth.jwt() ->> 'email') = 'matthew@matthewcawood.com');

-- ── Per-member lesson progress ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lesson_progress (
  email        text NOT NULL,
  lesson_id    uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed    boolean NOT NULL DEFAULT false,
  score        jsonb,                              -- per-quiz results (optional)
  completed_at timestamptz,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (email, lesson_id)
);
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

-- A member reads/writes their own progress; the owner can read all.
DROP POLICY IF EXISTS lesson_progress_self ON lesson_progress;
CREATE POLICY lesson_progress_self ON lesson_progress
  FOR ALL
  USING (
    lower(email) = lower(auth.jwt() ->> 'email')
    OR lower(auth.jwt() ->> 'email') = 'matthew@matthewcawood.com'
  )
  WITH CHECK (
    lower(email) = lower(auth.jwt() ->> 'email')
    OR lower(auth.jwt() ->> 'email') = 'matthew@matthewcawood.com'
  );

NOTIFY pgrst, 'reload schema';
