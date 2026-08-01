CREATE OR REPLACE FUNCTION public.verify_cron_key(_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM vault.decrypted_secrets
    WHERE name = 'email_queue_service_role_key'
      AND decrypted_secret = _key
  );
$$;

REVOKE ALL ON FUNCTION public.verify_cron_key(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_cron_key(text) TO service_role;