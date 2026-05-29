-- Quick diagnostic: returns auth.email() and auth.uid() for the JWT making
-- the call. Lets us check whether RLS sees the same email as session.user.email.
CREATE OR REPLACE FUNCTION whoami_debug()
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT jsonb_build_object(
    'auth_email', auth.email(),
    'auth_uid',   auth.uid(),
    'auth_role',  auth.role()
  );
$$;

GRANT EXECUTE ON FUNCTION whoami_debug() TO authenticated;

NOTIFY pgrst, 'reload schema';
