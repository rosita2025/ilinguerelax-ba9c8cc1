ALTER TABLE public.funnel_events ADD COLUMN IF NOT EXISTS email text; 
ALTER TABLE public.funnel_events ADD COLUMN IF NOT EXISTS name text; 
GRANT SELECT, INSERT, UPDATE, DELETE ON public.funnel_events TO authenticated; 
GRANT ALL ON public.funnel_events TO service_role;