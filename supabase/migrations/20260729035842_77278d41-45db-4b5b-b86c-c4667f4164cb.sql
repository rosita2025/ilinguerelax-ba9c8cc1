CREATE TABLE public.order_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number text NOT NULL,
  customer_email text,
  provider text NOT NULL DEFAULT 'dlocalgo',
  event text NOT NULL,
  status text,
  method text,
  reference text,
  detail text,
  amount numeric,
  currency text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX order_events_order_number_idx ON public.order_events (order_number);
CREATE INDEX order_events_email_idx ON public.order_events (lower(customer_email));
CREATE INDEX order_events_created_at_idx ON public.order_events (created_at DESC);
CREATE UNIQUE INDEX order_events_dedupe_idx ON public.order_events (order_number, event, coalesce(reference, ''));

GRANT ALL ON public.order_events TO service_role;

ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_events service role only"
ON public.order_events
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);