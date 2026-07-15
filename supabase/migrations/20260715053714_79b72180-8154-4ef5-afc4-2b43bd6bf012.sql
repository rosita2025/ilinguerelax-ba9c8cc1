CREATE TABLE IF NOT EXISTS public.checkout_method_suppressions (
  region_code text NOT NULL REFERENCES public.checkout_regions(code) ON DELETE CASCADE,
  method_key text NOT NULL,
  suppressed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (region_code, method_key)
);

GRANT ALL ON public.checkout_method_suppressions TO service_role;

ALTER TABLE public.checkout_method_suppressions ENABLE ROW LEVEL SECURITY;