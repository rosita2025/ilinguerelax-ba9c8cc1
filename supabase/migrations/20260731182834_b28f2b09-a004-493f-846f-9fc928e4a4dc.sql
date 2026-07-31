CREATE TABLE public.pending_payment_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  customer_email text NOT NULL,
  customer_name text,
  provider text NOT NULL DEFAULT 'manual',
  method text,
  amount numeric,
  currency text NOT NULL DEFAULT 'USD',
  product_name text,
  order_created_at timestamptz NOT NULL DEFAULT now(),
  step integer NOT NULL DEFAULT 0,
  last_sent_at timestamptz,
  next_at timestamptz NOT NULL DEFAULT now(),
  resolved boolean NOT NULL DEFAULT false,
  resolved_reason text,
  resolved_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.pending_payment_reminders TO service_role;

ALTER TABLE public.pending_payment_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public access to pending payment reminders"
ON public.pending_payment_reminders
FOR ALL
USING (false)
WITH CHECK (false);

CREATE INDEX pending_payment_reminders_due_idx
  ON public.pending_payment_reminders (resolved, next_at);

CREATE TRIGGER pending_payment_reminders_updated_at
BEFORE UPDATE ON public.pending_payment_reminders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();