-- Registro de cada compra enviada a Meta (Conversions API): sirve para ver en /admin/meta-compras
-- cuáles se enviaron (y Meta confirmó recibirlas), cuáles dieron error y cuáles no se enviaron.
CREATE TABLE IF NOT EXISTS public.meta_capi_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL,
  order_ref text,
  email text,
  value numeric,
  currency text,
  ok boolean NOT NULL,
  events_received integer,
  fbtrace_id text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS meta_capi_log_ref_idx ON public.meta_capi_log (order_ref, created_at DESC);
CREATE INDEX IF NOT EXISTS meta_capi_log_created_idx ON public.meta_capi_log (created_at DESC);
ALTER TABLE public.meta_capi_log ENABLE ROW LEVEL SECURITY;
-- Sin políticas: solo las funciones del servidor (service role) leen y escriben.
