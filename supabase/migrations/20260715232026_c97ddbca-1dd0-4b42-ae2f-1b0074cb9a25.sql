ALTER TABLE public.funnel_events ADD COLUMN IF NOT EXISTS client_id text;
CREATE INDEX IF NOT EXISTS idx_funnel_events_client_id ON public.funnel_events(client_id) WHERE client_id IS NOT NULL;