-- ──────────────────────────────────────────────────────────────────────────────
-- Books: designed PDF products (e.g. "Beginners Guide to Reading Sheet Music"),
-- authored in Book Studio (owner-only). A book is an ordered set of pages; each
-- page is an ordered array of typed layout blocks (jsonb) that render to a
-- print-perfect A4 page. Nothing here is member-facing; the owner exports the
-- finished book to PDF for the store.
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS books (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text UNIQUE NOT NULL,                  -- 'beginners-guide-reading-sheet-music'
  title       text NOT NULL DEFAULT 'Untitled book',
  subtitle    text,                                  -- running-header line
  theme       jsonb NOT NULL DEFAULT '{}'::jsonb,    -- optional colour/font overrides
  status      text NOT NULL DEFAULT 'draft',         -- 'draft' | 'ready'
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Owner-only everything (Book Studio uses the owner's JWT).
DROP POLICY IF EXISTS books_owner_all ON books;
CREATE POLICY books_owner_all ON books
  FOR ALL
  USING      (lower(auth.jwt() ->> 'email') = 'matthew@matthewcawood.com')
  WITH CHECK (lower(auth.jwt() ->> 'email') = 'matthew@matthewcawood.com');

-- ── Pages ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS book_pages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id     uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  position    int  NOT NULL DEFAULT 0,               -- page order within the book
  blocks      jsonb NOT NULL DEFAULT '[]'::jsonb,    -- ordered layout blocks
  meta        jsonb NOT NULL DEFAULT '{}'::jsonb,    -- { eyebrow, pageNumber, showHeader, showFooter }
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS book_pages_book_pos_idx ON book_pages(book_id, position);

ALTER TABLE book_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS book_pages_owner_all ON book_pages;
CREATE POLICY book_pages_owner_all ON book_pages
  FOR ALL
  USING      (lower(auth.jwt() ->> 'email') = 'matthew@matthewcawood.com')
  WITH CHECK (lower(auth.jwt() ->> 'email') = 'matthew@matthewcawood.com');
