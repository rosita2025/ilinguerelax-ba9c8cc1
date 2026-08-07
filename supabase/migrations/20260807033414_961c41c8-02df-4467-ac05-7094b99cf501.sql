ALTER TABLE public.digital_products ADD COLUMN IF NOT EXISTS gallery_metadata jsonb DEFAULT '{}'::jsonb;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.digital_products TO authenticated;
GRANT ALL ON public.digital_products TO service_role;
GRANT SELECT ON public.digital_products TO anon;