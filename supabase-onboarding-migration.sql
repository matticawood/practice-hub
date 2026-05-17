-- ── Stripe + onboarding columns for allowed_emails ──────────────────────────

ALTER TABLE allowed_emails ADD COLUMN IF NOT EXISTS stripe_customer_id    text;
ALTER TABLE allowed_emails ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
ALTER TABLE allowed_emails ADD COLUMN IF NOT EXISTS subscription_status    text DEFAULT 'active';
ALTER TABLE allowed_emails ADD COLUMN IF NOT EXISTS onboarded              boolean DEFAULT false;

-- Manually added members (you) are considered already onboarded
UPDATE allowed_emails SET onboarded = true WHERE onboarded IS NULL OR onboarded = false;

-- Index for fast webhook lookups
CREATE INDEX IF NOT EXISTS idx_allowed_emails_stripe_customer
  ON allowed_emails (stripe_customer_id);
