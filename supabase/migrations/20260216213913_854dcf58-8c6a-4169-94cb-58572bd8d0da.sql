
-- Table for abandoned cart recovery emails
CREATE TABLE public.abandoned_carts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  product_type TEXT NOT NULL DEFAULT 'english',
  language TEXT NOT NULL DEFAULT 'es',
  emails_sent INTEGER NOT NULL DEFAULT 0,
  last_email_sent_at TIMESTAMP WITH TIME ZONE,
  next_email_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '1 hour'),
  is_completed BOOLEAN NOT NULL DEFAULT false,
  converted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;

-- No public access - only edge functions with service role can access
-- We don't create any permissive policies intentionally

-- Index for efficient cron queries
CREATE INDEX idx_abandoned_carts_next_email ON public.abandoned_carts (next_email_at) WHERE is_completed = false;
CREATE INDEX idx_abandoned_carts_email ON public.abandoned_carts (customer_email);

-- Trigger for updated_at
CREATE TRIGGER update_abandoned_carts_updated_at
  BEFORE UPDATE ON public.abandoned_carts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_reviews_updated_at();
