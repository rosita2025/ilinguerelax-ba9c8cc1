
-- No public access needed, only service role via edge functions
CREATE POLICY "No public access" ON public.review_invitations FOR ALL TO public USING (false);
