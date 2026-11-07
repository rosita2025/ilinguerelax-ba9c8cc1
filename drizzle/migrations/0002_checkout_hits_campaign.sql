-- Guarda de qué campaña y anuncio de Meta llegó cada visita al checkout,
-- para verlo en /admin/checkout-abuse ("esta compra vino de la campaña X").
ALTER TABLE public.checkout_rate_hits ADD COLUMN IF NOT EXISTS campaign text;
ALTER TABLE public.checkout_rate_hits ADD COLUMN IF NOT EXISTS ad text;
