ALTER TABLE public.funnel_events
  ADD COLUMN IF NOT EXISTS is_bot boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bot_reason text,
  ADD COLUMN IF NOT EXISTS user_agent text;

CREATE INDEX IF NOT EXISTS funnel_events_is_bot_created_at_idx
  ON public.funnel_events (is_bot, created_at DESC);