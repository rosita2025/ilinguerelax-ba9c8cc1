
CREATE TABLE public.email_contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  name text,
  source text NOT NULL,
  product_type text,
  language text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX email_contacts_email_source_key
  ON public.email_contacts (lower(email), source);

CREATE INDEX email_contacts_email_idx ON public.email_contacts (lower(email));
CREATE INDEX email_contacts_source_idx ON public.email_contacts (source);
CREATE INDEX email_contacts_created_at_idx ON public.email_contacts (created_at DESC);

GRANT ALL ON public.email_contacts TO service_role;

ALTER TABLE public.email_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public access to email_contacts"
  ON public.email_contacts
  FOR ALL
  USING (false)
  WITH CHECK (false);

CREATE TRIGGER update_email_contacts_updated_at
  BEFORE UPDATE ON public.email_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_reviews_updated_at();

-- Trigger: cuando se inserta una reseña con email, guardarlo en email_contacts
CREATE OR REPLACE FUNCTION public.capture_review_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.customer_email IS NOT NULL AND NEW.customer_email <> '' THEN
    INSERT INTO public.email_contacts (email, name, source, product_type, metadata)
    VALUES (
      lower(NEW.customer_email),
      NEW.customer_name,
      'review',
      NEW.product_type,
      jsonb_build_object('rating', NEW.rating, 'review_id', NEW.id)
    )
    ON CONFLICT (lower(email), source) DO UPDATE
      SET name = COALESCE(EXCLUDED.name, public.email_contacts.name),
          product_type = COALESCE(EXCLUDED.product_type, public.email_contacts.product_type),
          metadata = public.email_contacts.metadata || EXCLUDED.metadata,
          updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER capture_review_email_trigger
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.capture_review_email();

-- Backfill emails ya existentes desde tablas conocidas
INSERT INTO public.email_contacts (email, name, source, product_type, metadata, created_at)
SELECT lower(customer_email), customer_name, 'review', product_type,
       jsonb_build_object('rating', rating), created_at
FROM public.reviews
WHERE customer_email IS NOT NULL AND customer_email <> ''
ON CONFLICT (lower(email), source) DO NOTHING;

INSERT INTO public.email_contacts (email, name, source, product_type, language, created_at)
SELECT lower(customer_email), customer_name, 'abandoned_cart', product_type, language, created_at
FROM public.abandoned_carts
WHERE customer_email IS NOT NULL AND customer_email <> ''
ON CONFLICT (lower(email), source) DO NOTHING;

INSERT INTO public.email_contacts (email, source, product_type, created_at)
SELECT lower(email), 'store_subscriber', product_type, created_at
FROM public.store_subscribers
WHERE email IS NOT NULL AND email <> ''
ON CONFLICT (lower(email), source) DO NOTHING;
