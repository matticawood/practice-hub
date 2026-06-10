-- Per-link click log: every click event from Resend, with the exact URL clicked.
-- The webhook (resend-webhook.mjs) inserts one row per click; the Studio
-- aggregates them into "which links got clicked, how often" per campaign.
-- Requires click tracking enabled on the Resend domain.

CREATE TABLE IF NOT EXISTS email_clicks (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  resend_id  text,
  campaign   text,
  email      text,
  link       text,
  clicked_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS email_clicks_campaign_idx ON email_clicks (campaign);
CREATE INDEX IF NOT EXISTS email_clicks_resend_idx   ON email_clicks (resend_id);

ALTER TABLE email_clicks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS email_clicks_owner_read ON email_clicks;
CREATE POLICY email_clicks_owner_read ON email_clicks
  FOR SELECT USING (lower(auth.jwt() ->> 'email') = 'matthew@matthewcawood.com');
