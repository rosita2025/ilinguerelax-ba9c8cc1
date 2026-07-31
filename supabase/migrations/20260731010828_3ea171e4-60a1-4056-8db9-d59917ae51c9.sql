CREATE UNIQUE INDEX IF NOT EXISTS funnel_events_stripe_purchase_unique
ON public.funnel_events (session_id)
WHERE event_name = 'Purchase'
  AND (session_id LIKE 'pi\_%' OR session_id LIKE 'cs\_%');