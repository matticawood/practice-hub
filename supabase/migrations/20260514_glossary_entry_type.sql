-- Add entry_type column to distinguish terms (Italian/text markings written in
-- scores as words) from symbols (entries that have a dedicated visual glyph in
-- sheet music). symbol_html cleared so symbols can be added properly later.

ALTER TABLE glossary ADD COLUMN IF NOT EXISTS entry_type text NOT NULL DEFAULT 'term';

-- Clear all symbol_html — to be added properly per-entry later
UPDATE glossary SET symbol_html = NULL;

-- ── Mark symbol entries ────────────────────────────────────────────────────────
-- Dynamics — all have printed glyphs (p, f, hairpins, sfz etc.)
UPDATE glossary SET entry_type = 'symbol'
  WHERE category = 'Dynamics';

-- Articulation marks — all have dedicated score symbols
UPDATE glossary SET entry_type = 'symbol'
  WHERE term IN (
    'Staccato', 'Tenuto', 'Accent', 'Marcato', 'Portato', 'Staccatissimo',
    'Slur', 'Tie', 'Fermata'
  );

-- Ornaments — all have dedicated score symbols
UPDATE glossary SET entry_type = 'symbol'
  WHERE term IN (
    'Trill', 'Mordent', 'Inverted Mordent', 'Turn',
    'Appoggiatura', 'Acciaccatura', 'Tremolo', 'Arpeggio'
  );

-- Pitch — accidentals and octave markings are score symbols
UPDATE glossary SET entry_type = 'symbol'
  WHERE term IN (
    'Sharp', 'Flat', 'Natural', 'Double sharp', 'Double flat',
    'Accidental', 'Ottava', 'Ottava bassa', 'Ledger lines'
  );

-- Rhythm — time signatures, grouping brackets
UPDATE glossary SET entry_type = 'symbol'
  WHERE term IN ('Time signature', 'Common time', 'Cut time', 'Triplet', 'Duplet',
                 'Simple time', 'Compound time');

-- Notation — clefs, barlines, note values, repeat signs, pedal, etc.
UPDATE glossary SET entry_type = 'symbol'
  WHERE term IN (
    'Treble clef', 'Bass clef', 'Alto clef', 'Grand staff',
    'Key signature', 'Bar', 'Double bar', 'Repeat sign',
    'First and second time bars', 'Volta bracket',
    'Da capo', 'Dal segno', 'Segno', 'Coda sign',
    'Semibreve', 'Minim', 'Crotchet', 'Quaver', 'Semiquaver',
    'Dotted note', 'Rest', 'Breath mark', '8va', 'Ped.'
  );

-- Form — only Coda has a printed symbol (𝄌)
UPDATE glossary SET entry_type = 'symbol'
  WHERE term = 'Coda' AND category = 'Form';
