
CREATE TABLE IF NOT EXISTS public.persistent_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  cart_token text UNIQUE NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', ''),
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  buyer jsonb NOT NULL DEFAULT '{}'::jsonb,
  country text,
  language text DEFAULT 'es',
  last_activity timestamptz NOT NULL DEFAULT now(),
  converted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.persistent_carts TO service_role;
ALTER TABLE public.persistent_carts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "persistent_carts_service_only" ON public.persistent_carts;
CREATE POLICY "persistent_carts_service_only" ON public.persistent_carts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS persistent_carts_last_activity_idx
  ON public.persistent_carts (last_activity DESC) WHERE NOT converted;
CREATE INDEX IF NOT EXISTS persistent_carts_token_idx
  ON public.persistent_carts (cart_token);

DROP TRIGGER IF EXISTS touch_persistent_carts ON public.persistent_carts;
CREATE TRIGGER touch_persistent_carts BEFORE UPDATE ON public.persistent_carts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
