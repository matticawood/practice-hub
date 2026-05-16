-- ──────────────────────────────────────────────────────────────────────────────
-- Fix: theory_sheets RLS policies
--
-- Problem: RLS is enabled on theory_sheets but there are no INSERT/UPDATE/DELETE
-- policies for the anon role, so every write from the editor returns:
--   "new row violates row-level security policy for table theory_sheets"
--
-- This app uses the Supabase anon key for all DB operations.
-- Write-access is enforced at the application layer (owner-email guard in JS),
-- so we grant full CRUD to anon here and rely on the app guard for security.
-- ──────────────────────────────────────────────────────────────────────────────

-- Make sure RLS is on (no-op if already enabled)
ALTER TABLE theory_sheets ENABLE ROW LEVEL SECURITY;

-- Drop old policies that may conflict
DROP POLICY IF EXISTS "theory_sheets_anon_select"  ON theory_sheets;
DROP POLICY IF EXISTS "theory_sheets_anon_insert"  ON theory_sheets;
DROP POLICY IF EXISTS "theory_sheets_anon_update"  ON theory_sheets;
DROP POLICY IF EXISTS "theory_sheets_anon_delete"  ON theory_sheets;

-- Public read — anyone can view sheets (they're published articles)
CREATE POLICY "theory_sheets_anon_select"
  ON theory_sheets
  FOR SELECT
  TO anon
  USING (true);

-- Write access — anon key can create, edit, delete sheets.
-- The editor page enforces owner-only access via the practiceRoom_session check.
CREATE POLICY "theory_sheets_anon_insert"
  ON theory_sheets
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "theory_sheets_anon_update"
  ON theory_sheets
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "theory_sheets_anon_delete"
  ON theory_sheets
  FOR DELETE
  TO anon
  USING (true);
