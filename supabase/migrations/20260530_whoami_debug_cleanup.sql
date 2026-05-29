-- Cleanup: drop the temporary whoami_debug() RPC that was used to diagnose
-- the user_presence RLS issue.
DROP FUNCTION IF EXISTS whoami_debug();

NOTIFY pgrst, 'reload schema';
