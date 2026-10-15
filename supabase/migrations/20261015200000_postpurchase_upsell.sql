-- Upsell post-compra: registro de envíos (evita duplicados) + cron cada 3 h.
CREATE TABLE IF NOT EXISTS public.postpurchase_upsell_sends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_email TEXT NOT NULL,
  source_sku TEXT NOT NULL,
  offered_skus TEXT[] NOT NULL DEFAULT '{}',
  day INT NOT NULL,
  source_order_id TEXT,
  status TEXT NOT NULL DEFAULT 'claimed', -- claimed | sent | failed
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  UNIQUE (customer_email, source_sku, day)
);
GRANT ALL ON public.postpurchase_upsell_sends TO service_role;
ALTER TABLE public.postpurchase_upsell_sends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role only" ON public.postpurchase_upsell_sends
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DO $$
BEGIN
  PERFORM cron.unschedule('process-postpurchase-upsell')
    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-postpurchase-upsell');
  PERFORM cron.schedule(
    'process-postpurchase-upsell',
    '20 */3 * * *',
    $cron$
    SELECT net.http_post(
      url := 'https://opyitzdvvurdyyyzkwwv.supabase.co/functions/v1/process-postpurchase-upsell',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (
          SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key'
        )
      ),
      body := '{}'::jsonb
    );
    $cron$
  );
END $$;
