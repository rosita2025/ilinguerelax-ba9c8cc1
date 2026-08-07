ALTER TABLE public.digital_products ADD COLUMN IF NOT EXISTS gallery_images text[] DEFAULT '{}';
GRANT SELECT, INSERT, UPDATE, DELETE ON public.digital_products TO authenticated;
GRANT ALL ON public.digital_products TO service_role;
