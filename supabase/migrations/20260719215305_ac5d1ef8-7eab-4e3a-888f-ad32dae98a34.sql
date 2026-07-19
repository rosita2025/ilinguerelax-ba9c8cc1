
CREATE TABLE public.indexing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  channel text NOT NULL,
  target text,
  status text NOT NULL DEFAULT 'pending',
  http_status int,
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX indexing_events_url_idx ON public.indexing_events (url, created_at DESC);
CREATE INDEX indexing_events_created_idx ON public.indexing_events (created_at DESC);
CREATE INDEX indexing_events_channel_idx ON public.indexing_events (channel, created_at DESC);

GRANT SELECT ON public.indexing_events TO authenticated;
GRANT ALL ON public.indexing_events TO service_role;

ALTER TABLE public.indexing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read indexing events"
  ON public.indexing_events FOR SELECT
  TO authenticated
  USING (true);
