UPDATE public.digital_products
SET price_pen = 43,
    local_compare_at_prices = jsonb_set(coalesce(local_compare_at_prices, '{}'::jsonb), '{PEN}', '85'::jsonb, true)
WHERE sku = '2-000-palabras-esenciales-para-aprender-coreano-hangul-pronunciacion-para-hispanohablantes-npca';