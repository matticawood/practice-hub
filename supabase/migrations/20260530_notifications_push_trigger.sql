-- ──────────────────────────────────────────────────────────────────────────────
-- When a notifications row is inserted, fire the send-push edge function so
-- any registered iOS devices for that email receive a native push.
-- Uses pg_net (already available on Supabase) to call the edge function
-- asynchronously — failures don't block the insert.
--
-- Required Postgres settings (set once in Supabase Dashboard → Settings →
-- Database → Custom Postgres config OR via SQL):
--   app.supabase_url           = 'https://<project>.supabase.co'
--   app.supabase_service_key   = '<service role key>'
-- ──────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION fire_send_push_on_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fn_url   text;
  svc_key  text;
BEGIN
  -- Read these as runtime parameters so we don't hard-code secrets in code.
  fn_url  := current_setting('app.supabase_url', true) || '/functions/v1/send-push';
  svc_key := current_setting('app.supabase_service_key', true);

  IF fn_url IS NULL OR svc_key IS NULL OR fn_url = '/functions/v1/send-push' THEN
    -- Config not set yet — silently no-op so notifications keep working.
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url     := fn_url,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || svc_key,
      'Content-Type',  'application/json'
    ),
    body    := jsonb_build_object('notification_id', NEW.id)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_send_push_on_notification ON notifications;
CREATE TRIGGER trg_send_push_on_notification
AFTER INSERT ON notifications
FOR EACH ROW EXECUTE FUNCTION fire_send_push_on_notification();

NOTIFY pgrst, 'reload schema';
