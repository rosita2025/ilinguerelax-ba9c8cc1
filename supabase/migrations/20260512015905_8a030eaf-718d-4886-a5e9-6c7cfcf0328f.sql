ALTER TABLE public.funnel_events ADD COLUMN IF NOT EXISTS country text;
CREATE INDEX IF NOT EXISTS idx_funnel_events_country ON public.funnel_events (country);