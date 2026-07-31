DROP POLICY IF EXISTS "Service role can read suppressed emails" ON public.suppressed_emails;
DROP POLICY IF EXISTS "Service role can insert suppressed emails" ON public.suppressed_emails;

CREATE POLICY "Service role can read suppressed emails"
ON public.suppressed_emails FOR SELECT TO service_role USING (true);

CREATE POLICY "Service role can insert suppressed emails"
ON public.suppressed_emails FOR INSERT TO service_role WITH CHECK (true);

REVOKE ALL ON public.suppressed_emails FROM anon, authenticated;
GRANT ALL ON public.suppressed_emails TO service_role;