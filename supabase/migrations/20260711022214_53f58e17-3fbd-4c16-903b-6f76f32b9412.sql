
ALTER TABLE public.product_upsells DROP CONSTRAINT IF EXISTS product_upsells_product_sku_fkey;
ALTER TABLE public.product_upsells DROP CONSTRAINT IF EXISTS product_upsells_upsell_sku_fkey;
ALTER TABLE public.product_upsells
  ADD CONSTRAINT product_upsells_product_sku_fkey FOREIGN KEY (product_sku)
  REFERENCES public.digital_products(sku) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE public.product_upsells
  ADD CONSTRAINT product_upsells_upsell_sku_fkey FOREIGN KEY (upsell_sku)
  REFERENCES public.digital_products(sku) ON UPDATE CASCADE ON DELETE CASCADE;

-- Clean duplicate created by the failed rename flow
DELETE FROM public.product_upsells WHERE product_sku = '100-mapas-mentales-para-aprender-coreano-hangul-c1' OR upsell_sku = '100-mapas-mentales-para-aprender-coreano-hangul-c1';
DELETE FROM public.digital_products WHERE sku = '100-mapas-mentales-para-aprender-coreano-hangul-c1';
