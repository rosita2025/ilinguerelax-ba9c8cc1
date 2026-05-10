CREATE TABLE public.funnel_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name text NOT NULL,
  product_id text,
  value numeric,
  currency text,
  session_id text,
  page_path text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_funnel_events_created_at ON public.funnel_events (created_at DESC);
CREATE INDEX idx_funnel_events_event_name ON public.funnel_events (event_name);
CREATE INDEX idx_funnel_events_product_id ON public.funnel_events (product_id);

ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert funnel events"
ON public.funnel_events
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "No public read of funnel events"
ON public.funnel_events
FOR SELECT
TO public
USING (false);