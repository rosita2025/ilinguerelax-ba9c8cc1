
-- Drip newsletter tracking
CREATE TABLE public.newsletter_drip_sends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  step INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX newsletter_drip_sends_email_step_key
  ON public.newsletter_drip_sends (lower(email), step);
CREATE INDEX newsletter_drip_sends_email_idx
  ON public.newsletter_drip_sends (lower(email));

GRANT SELECT ON public.newsletter_drip_sends TO authenticated;
GRANT ALL ON public.newsletter_drip_sends TO service_role;
ALTER TABLE public.newsletter_drip_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role manages drip sends"
  ON public.newsletter_drip_sends FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- Drip step configuration (editable seed)
CREATE TABLE public.newsletter_drip_config (
  step INT NOT NULL PRIMARY KEY,
  day_offset INT NOT NULL,
  template_key TEXT NOT NULL,
  product_sku TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.newsletter_drip_config TO authenticated, anon;
GRANT ALL ON public.newsletter_drip_config TO service_role;
ALTER TABLE public.newsletter_drip_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read drip config"
  ON public.newsletter_drip_config FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "service_role manages drip config"
  ON public.newsletter_drip_config FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

INSERT INTO public.newsletter_drip_config (step, day_offset, template_key, product_sku) VALUES
  (1, 1,   'know-us',           NULL),
  (2, 3,   'catalog',            NULL),
  (3, 7,   'product-1000-en',    'ILR-1000-EN'),
  (4, 15,  'product-5000-en',    'ILR-5000-EN'),
  (5, 30,  'special-offer',      NULL),
  (6, 40,  'pain-patterns',      'ILR-PATRONES-EN'),
  (7, 60,  'product-coreano',    'ILR-COREANO-100'),
  (8, 90,  'testimonials',       NULL),
  (9, 120, 'vip-final',          NULL);

-- Schedule the drip processor every 6 hours
SELECT cron.schedule(
  'send-newsletter-drip',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://opyitzdvvurdyyyzkwwv.supabase.co/functions/v1/send-newsletter-drip',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key'
      )
    ),
    body := '{}'::jsonb
  );
  $$
);
