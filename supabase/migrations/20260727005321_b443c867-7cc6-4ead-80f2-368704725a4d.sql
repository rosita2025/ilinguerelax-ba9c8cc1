ALTER TABLE public.checkout_rate_hits
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS geo_checked_at timestamptz;