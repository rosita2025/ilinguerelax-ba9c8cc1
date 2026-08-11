
CREATE TABLE IF NOT EXISTS public.marketing_drip_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  step_name TEXT NOT NULL,
  day_offset INT NOT NULL,
  template_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketing_drip_sends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  category TEXT NOT NULL,
  step_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'marketing_drip_sends_email_step_key') THEN
        CREATE UNIQUE INDEX marketing_drip_sends_email_step_key
          ON public.marketing_drip_sends (lower(email), category, step_name);
    END IF;
END $$;

GRANT ALL ON public.marketing_drip_config TO service_role;
GRANT SELECT ON public.marketing_drip_config TO authenticated;
GRANT ALL ON public.marketing_drip_sends TO service_role;
GRANT SELECT ON public.marketing_drip_sends TO authenticated;

ALTER TABLE public.marketing_drip_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_drip_sends ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role manages marketing drips') THEN
        CREATE POLICY "Service role manages marketing drips" ON public.marketing_drip_config FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated read marketing drips') THEN
        CREATE POLICY "Authenticated read marketing drips" ON public.marketing_drip_config FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role manages marketing sends') THEN
        CREATE POLICY "Service role manages marketing sends" ON public.marketing_drip_sends FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
END $$;

INSERT INTO public.marketing_drip_config (category, step_name, day_offset, template_key)
SELECT * FROM (VALUES
  ('1000_verbos', 'followup', 7, 'verbos-followup'),
  ('1000_verbos', 'value', 15, 'verbos-value'),
  ('1000_verbos', 'launch', 25, 'verbos-launch'),
  ('5000_palabras', 'followup', 7, 'palabras-followup'),
  ('5000_palabras', 'value', 15, 'palabras-value'),
  ('5000_palabras', 'launch', 25, 'palabras-launch'),
  ('coreano_mapas', 'followup', 7, 'coreano-followup'),
  ('coreano_mapas', 'value', 15, 'coreano-value'),
  ('coreano_mapas', 'launch', 25, 'coreano-launch')
) AS v(category, step_name, day_offset, template_key)
WHERE NOT EXISTS (SELECT 1 FROM public.marketing_drip_config WHERE category = v.category AND step_name = v.step_name);
