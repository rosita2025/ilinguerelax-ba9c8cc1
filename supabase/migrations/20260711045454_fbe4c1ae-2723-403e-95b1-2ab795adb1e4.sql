
ALTER TABLE public.digital_email_sends
  ADD COLUMN IF NOT EXISTS message_id text,
  ADD COLUMN IF NOT EXISTS provider text,
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS last_event text,
  ADD COLUMN IF NOT EXISTS last_event_at timestamptz,
  ADD COLUMN IF NOT EXISTS event_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS events jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS digital_email_sends_message_id_idx ON public.digital_email_sends (message_id);

CREATE TABLE IF NOT EXISTS public.email_delivery_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'brevo',
  message_id text,
  event text NOT NULL,
  recipient_email text,
  order_id text,
  reason text,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_delivery_events_message_id_idx ON public.email_delivery_events (message_id);
CREATE INDEX IF NOT EXISTS email_delivery_events_order_id_idx ON public.email_delivery_events (order_id);
CREATE INDEX IF NOT EXISTS email_delivery_events_recipient_idx ON public.email_delivery_events (recipient_email);
CREATE INDEX IF NOT EXISTS email_delivery_events_created_idx ON public.email_delivery_events (created_at DESC);

GRANT SELECT ON public.email_delivery_events TO authenticated;
GRANT ALL ON public.email_delivery_events TO service_role;

ALTER TABLE public.email_delivery_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service role manages delivery events" ON public.email_delivery_events;
CREATE POLICY "service role manages delivery events"
  ON public.email_delivery_events FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
