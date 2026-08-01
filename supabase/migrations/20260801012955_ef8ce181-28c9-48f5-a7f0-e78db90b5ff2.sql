ALTER TABLE public.manual_payments
  ADD COLUMN IF NOT EXISTS payment_reference text,
  ADD COLUMN IF NOT EXISTS payment_reference_source text,
  ADD COLUMN IF NOT EXISTS payment_reference_at timestamptz;

CREATE INDEX IF NOT EXISTS manual_payments_payment_reference_idx
  ON public.manual_payments (payment_reference)
  WHERE payment_reference IS NOT NULL;