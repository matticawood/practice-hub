-- Make signup_conversions represent EVERY membership conversion, with the source
-- (vid) OPTIONAL. Until now vid was NOT NULL and part of the primary key, so any
-- member whose visitor id did not round-trip through Stripe was never recorded.
-- That made the conversion count undercount actual signups massively (1 vs 59).
--
-- New model: one row per member who converted; vid/source filled when known.
-- The conversion COUNT = rows here; ATTRIBUTION = the subset with a vid/source.
--
-- Safe: the table currently holds a single row, so the primary-key change cannot
-- collide. Run in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/gyskfutmncprqxazgatv/sql

-- Drop the (vid,email) primary key FIRST: Postgres will not let you drop NOT NULL
-- on a column while it is still part of a primary key.
ALTER TABLE signup_conversions DROP CONSTRAINT IF EXISTS signup_conversions_pkey;
ALTER TABLE signup_conversions ALTER COLUMN vid DROP NOT NULL;
-- email becomes the identity (one conversion record per member).
ALTER TABLE signup_conversions ADD CONSTRAINT signup_conversions_pkey PRIMARY KEY (email);

-- explicit source label (e.g. a YouTube video id) for when UTM tagging carries it
-- through; stays null until the per-video attribution work lands.
ALTER TABLE signup_conversions ADD COLUMN IF NOT EXISTS source text;
