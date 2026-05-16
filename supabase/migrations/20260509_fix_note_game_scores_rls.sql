-- Fix: note_game_scores RLS policies
-- Ensures all users can read all scores (for leaderboard) and insert their own.
-- Run this in the Supabase SQL editor: https://supabase.com/dashboard/project/gyskfutmncprqxazgatv/sql

ALTER TABLE note_game_scores ENABLE ROW LEVEL SECURITY;

-- Drop old policies (safe to re-run)
DROP POLICY IF EXISTS "note_game_scores_select" ON note_game_scores;
DROP POLICY IF EXISTS "note_game_scores_insert" ON note_game_scores;
DROP POLICY IF EXISTS "note_game_scores_update" ON note_game_scores;
DROP POLICY IF EXISTS "note_game_scores_delete" ON note_game_scores;

-- Anyone can read all scores (needed for leaderboard)
CREATE POLICY "note_game_scores_select"
  ON note_game_scores FOR SELECT TO anon USING (true);

-- Anon key can insert their own scores
CREATE POLICY "note_game_scores_insert"
  ON note_game_scores FOR INSERT TO anon WITH CHECK (true);
