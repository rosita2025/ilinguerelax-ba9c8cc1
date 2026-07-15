
CREATE TABLE public.country_language_map (
  country_code TEXT PRIMARY KEY CHECK (char_length(country_code) = 2),
  language TEXT NOT NULL CHECK (language IN ('es','en','fr','pt')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.country_language_map TO anon, authenticated;
GRANT ALL ON public.country_language_map TO service_role;

ALTER TABLE public.country_language_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read country language map"
  ON public.country_language_map FOR SELECT
  USING (true);

CREATE TRIGGER trg_country_language_map_updated_at
  BEFORE UPDATE ON public.country_language_map
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.country_language_map (country_code, language) VALUES
  -- Español
  ('PE','es'),('MX','es'),('AR','es'),('CL','es'),('CO','es'),('VE','es'),
  ('EC','es'),('BO','es'),('PY','es'),('UY','es'),('CR','es'),('GT','es'),
  ('HN','es'),('NI','es'),('PA','es'),('SV','es'),('DO','es'),('CU','es'),
  ('PR','es'),('ES','es'),
  -- English
  ('US','en'),('GB','en'),('CA','en'),('AU','en'),('NZ','en'),('IE','en'),
  ('ZA','en'),('IN','en'),('SG','en'),('PH','en'),('NG','en'),('KE','en'),
  -- Français
  ('FR','fr'),('BE','fr'),('CH','fr'),('LU','fr'),('MC','fr'),('SN','fr'),
  ('CI','fr'),('MA','fr'),('TN','fr'),('DZ','fr'),
  -- Português
  ('BR','pt'),('PT','pt'),('AO','pt'),('MZ','pt')
ON CONFLICT (country_code) DO NOTHING;
