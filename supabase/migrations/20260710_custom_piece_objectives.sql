-- Custom pieces count toward roadmap piece objectives.
-- Makes custom pieces first-class: they carry a self-rated difficulty, a
-- last-practised timestamp (for the dormancy nudge), and a dormancy-ack marker.
-- Status still lives on user_collections (via user_piece_id), matching resources.html.

alter table public.user_pieces
  add column if not exists difficulty        smallint,      -- 0..5, set by the completion rating (null until completed)
  add column if not exists last_practiced_at timestamptz,   -- stamped whenever the piece appears in a saved session
  add column if not exists dormancy_acked_at timestamptz;   -- set when the member answers/dismisses the tidy-up card

comment on column public.user_pieces.difficulty        is 'Self-rated tier 0..5, mapped from the "how hard was this for you" answer against the member''s stage at completion.';
comment on column public.user_pieces.last_practiced_at is 'Most recent saved practice session that referenced this custom piece (by title). Drives the dormancy nudge.';
comment on column public.user_pieces.dormancy_acked_at is 'When the member last acknowledged/dismissed the tidy-up card for this piece. Re-arms once last_practiced_at moves past it.';
