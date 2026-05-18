-- Allow authenticated members to read other members' achievements and sessions
-- (needed for the member profile modal in the community tab)

-- achievement_events: members can read all rows (so profiles show achievements)
DROP POLICY IF EXISTS "Members can read all achievements" ON achievement_events;
CREATE POLICY "Members can read all achievements"
  ON achievement_events FOR SELECT
  USING (auth.role() = 'authenticated');

-- practice_sessions: members can read all rows (so profiles show activity)
DROP POLICY IF EXISTS "Members can read all sessions" ON practice_sessions;
CREATE POLICY "Members can read all sessions"
  ON practice_sessions FOR SELECT
  USING (auth.role() = 'authenticated');
