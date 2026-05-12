ALTER TABLE public.funnel_events ADD COLUMN IF NOT EXISTS referrer text;
CREATE INDEX IF NOT EXISTS idx_funnel_events_created_at ON public.funnel_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_funnel_events_session_id ON public.funnel_events(session_id);