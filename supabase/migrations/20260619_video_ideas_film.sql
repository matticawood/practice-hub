-- Idea Studio: persist the fact-check results and the filming outline alongside
-- each developed video idea (owner-only authoring tool, same RLS as video_ideas).
ALTER TABLE video_ideas
  ADD COLUMN IF NOT EXISTS facts        jsonb,   -- { claims:[{claim,verdict,note,source}], summary }
  ADD COLUMN IF NOT EXISTS film_outline jsonb;   -- { title, hook, sections:[{heading,bullets[]}], closing }
