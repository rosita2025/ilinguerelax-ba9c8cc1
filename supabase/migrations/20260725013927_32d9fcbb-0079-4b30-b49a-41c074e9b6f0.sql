ALTER TABLE public.funnel_events ADD COLUMN IF NOT EXISTS ip text;
CREATE INDEX IF NOT EXISTS idx_funnel_events_event_created ON public.funnel_events (event_name, created_at DESC);