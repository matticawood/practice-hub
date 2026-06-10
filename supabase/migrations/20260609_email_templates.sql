-- Editable copy for automated emails, edited from the Email Studio.
--
-- One row per campaign. NULL/absent columns fall back to the code defaults in
-- email-templates.mjs, so this table only needs rows for campaigns you've
-- actually edited. The sender and the Studio both read it, so what you save here
-- is exactly what goes out. Content is plain text (no HTML) rendered through a
-- fixed shell, so edits can't break the layout.

CREATE TABLE IF NOT EXISTS email_templates (
  campaign    text PRIMARY KEY,           -- 'reactivation' | 'welcome_d0' | ... | 'waitlist'
  subject     text,
  preheader   text,
  eyebrow     text,
  paragraphs  jsonb,                       -- array of plain-text paragraphs; {firstName} is filled per person
  signature   text,
  cta_text    text,
  cta_href    text,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  text
);

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Owner-only read + write (the Studio uses the logged-in owner's JWT).
DROP POLICY IF EXISTS email_templates_owner_read ON email_templates;
CREATE POLICY email_templates_owner_read ON email_templates
  FOR SELECT USING (lower(auth.jwt() ->> 'email') = 'matthew@matthewcawood.com');

DROP POLICY IF EXISTS email_templates_owner_write ON email_templates;
CREATE POLICY email_templates_owner_write ON email_templates
  FOR ALL
  USING (lower(auth.jwt() ->> 'email') = 'matthew@matthewcawood.com')
  WITH CHECK (lower(auth.jwt() ->> 'email') = 'matthew@matthewcawood.com');
