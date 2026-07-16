
CREATE TABLE IF NOT EXISTS public.digital_product_changes (
  id BIGSERIAL PRIMARY KEY,
  sku TEXT NOT NULL,
  action TEXT NOT NULL,
  changed_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS digital_product_changes_sku_idx ON public.digital_product_changes (sku, created_at DESC);

GRANT SELECT ON public.digital_product_changes TO authenticated;
GRANT ALL ON public.digital_product_changes TO service_role;
ALTER TABLE public.digital_product_changes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service manages product changes" ON public.digital_product_changes FOR ALL USING (false) WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.log_digital_product_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  diff JSONB := '{}'::jsonb;
  fields TEXT[] := ARRAY['name','drive_url','access_key','price_usd','price_usd_latam','price_usd_tienda','price_pen','active','store_enabled','hotmart_url','bonuses','sku_aliases','cover_image_url','is_upsell'];
  f TEXT;
  ov JSONB;
  nv JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.digital_product_changes(sku, action, changed_fields)
    VALUES (NEW.sku, 'created', jsonb_build_object('name', NEW.name));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.digital_product_changes(sku, action, changed_fields)
    VALUES (OLD.sku, 'deleted', jsonb_build_object('name', OLD.name));
    RETURN OLD;
  ELSE
    FOREACH f IN ARRAY fields LOOP
      ov := to_jsonb(OLD) -> f;
      nv := to_jsonb(NEW) -> f;
      IF ov IS DISTINCT FROM nv THEN
        diff := diff || jsonb_build_object(f, jsonb_build_object('from', ov, 'to', nv));
      END IF;
    END LOOP;
    IF diff <> '{}'::jsonb THEN
      INSERT INTO public.digital_product_changes(sku, action, changed_fields)
      VALUES (NEW.sku, 'updated', diff);
    END IF;
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_digital_product_change ON public.digital_products;
CREATE TRIGGER trg_log_digital_product_change
AFTER INSERT OR UPDATE OR DELETE ON public.digital_products
FOR EACH ROW EXECUTE FUNCTION public.log_digital_product_change();
