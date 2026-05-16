-- ──────────────────────────────────────────────────────────────────────────────
-- Fix: reading_list and sheet_notes RLS policies
--
-- Problem: RLS is enabled on these tables but there are no permissive policies
-- for anon or authenticated roles, so all reads and writes fail silently:
--   - Reading list pills always show "+ Save" (reads return empty)
--   - Clicking "+ Save" appears to work but nothing persists (writes denied)
--   - Sheet notes show "Saved ✓" but aren't actually saved (upsert denied)
--
-- Pattern: this app uses the Supabase anon key for all DB operations.
-- Security is enforced at the application layer (email guards in JS).
-- We grant full CRUD to both anon and authenticated roles here.
-- ──────────────────────────────────────────────────────────────────────────────

-- ── reading_list ──────────────────────────────────────────────────────────────
ALTER TABLE reading_list ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reading_list_anon_select"  ON reading_list;
DROP POLICY IF EXISTS "reading_list_anon_insert"  ON reading_list;
DROP POLICY IF EXISTS "reading_list_anon_update"  ON reading_list;
DROP POLICY IF EXISTS "reading_list_anon_delete"  ON reading_list;
DROP POLICY IF EXISTS "reading_list_auth_select"  ON reading_list;
DROP POLICY IF EXISTS "reading_list_auth_insert"  ON reading_list;
DROP POLICY IF EXISTS "reading_list_auth_update"  ON reading_list;
DROP POLICY IF EXISTS "reading_list_auth_delete"  ON reading_list;

CREATE POLICY "reading_list_anon_select"  ON reading_list FOR SELECT TO anon        USING (true);
CREATE POLICY "reading_list_anon_insert"  ON reading_list FOR INSERT TO anon        WITH CHECK (true);
CREATE POLICY "reading_list_anon_update"  ON reading_list FOR UPDATE TO anon        USING (true) WITH CHECK (true);
CREATE POLICY "reading_list_anon_delete"  ON reading_list FOR DELETE TO anon        USING (true);
CREATE POLICY "reading_list_auth_select"  ON reading_list FOR SELECT TO authenticated USING (true);
CREATE POLICY "reading_list_auth_insert"  ON reading_list FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "reading_list_auth_update"  ON reading_list FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "reading_list_auth_delete"  ON reading_list FOR DELETE TO authenticated USING (true);

-- ── sheet_notes ───────────────────────────────────────────────────────────────
ALTER TABLE sheet_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sheet_notes_anon_select"  ON sheet_notes;
DROP POLICY IF EXISTS "sheet_notes_anon_insert"  ON sheet_notes;
DROP POLICY IF EXISTS "sheet_notes_anon_update"  ON sheet_notes;
DROP POLICY IF EXISTS "sheet_notes_anon_delete"  ON sheet_notes;
DROP POLICY IF EXISTS "sheet_notes_auth_select"  ON sheet_notes;
DROP POLICY IF EXISTS "sheet_notes_auth_insert"  ON sheet_notes;
DROP POLICY IF EXISTS "sheet_notes_auth_update"  ON sheet_notes;
DROP POLICY IF EXISTS "sheet_notes_auth_delete"  ON sheet_notes;

CREATE POLICY "sheet_notes_anon_select"  ON sheet_notes FOR SELECT TO anon        USING (true);
CREATE POLICY "sheet_notes_anon_insert"  ON sheet_notes FOR INSERT TO anon        WITH CHECK (true);
CREATE POLICY "sheet_notes_anon_update"  ON sheet_notes FOR UPDATE TO anon        USING (true) WITH CHECK (true);
CREATE POLICY "sheet_notes_anon_delete"  ON sheet_notes FOR DELETE TO anon        USING (true);
CREATE POLICY "sheet_notes_auth_select"  ON sheet_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "sheet_notes_auth_insert"  ON sheet_notes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "sheet_notes_auth_update"  ON sheet_notes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "sheet_notes_auth_delete"  ON sheet_notes FOR DELETE TO authenticated USING (true);

-- ── requests (for "Suggest a topic" submissions) ──────────────────────────────
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "requests_anon_select"  ON requests;
DROP POLICY IF EXISTS "requests_anon_insert"  ON requests;
DROP POLICY IF EXISTS "requests_anon_update"  ON requests;
DROP POLICY IF EXISTS "requests_auth_select"  ON requests;
DROP POLICY IF EXISTS "requests_auth_insert"  ON requests;
DROP POLICY IF EXISTS "requests_auth_update"  ON requests;

CREATE POLICY "requests_anon_select"  ON requests FOR SELECT TO anon        USING (true);
CREATE POLICY "requests_anon_insert"  ON requests FOR INSERT TO anon        WITH CHECK (true);
CREATE POLICY "requests_anon_update"  ON requests FOR UPDATE TO anon        USING (true) WITH CHECK (true);
CREATE POLICY "requests_auth_select"  ON requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "requests_auth_insert"  ON requests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "requests_auth_update"  ON requests FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
