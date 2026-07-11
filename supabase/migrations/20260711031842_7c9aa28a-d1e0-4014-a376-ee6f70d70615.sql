-- Ensure product_upsells has updated_at and both tables auto-touch it on write.
ALTER TABLE public.product_upsells
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS trg_digital_products_updated_at ON public.digital_products;
CREATE TRIGGER trg_digital_products_updated_at
BEFORE UPDATE ON public.digital_products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_product_upsells_updated_at ON public.product_upsells;
CREATE TRIGGER trg_product_upsells_updated_at
BEFORE UPDATE ON public.product_upsells
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();