CREATE TABLE public.download_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token text NOT NULL UNIQUE,
  order_number text NOT NULL,
  email text NOT NULL,
  skus text[] NOT NULL DEFAULT '{}',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '1 year'),
  max_downloads integer NOT NULL DEFAULT 20,
  download_count integer NOT NULL DEFAULT 0,
  revoked boolean NOT NULL DEFAULT false,
  last_accessed_at timestamptz,
  last_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX download_tokens_order_idx ON public.download_tokens (order_number);
CREATE INDEX download_tokens_email_idx ON public.download_tokens (lower(email));

CREATE TABLE public.download_token_access (
  id bigserial PRIMARY KEY,
  token_id uuid NOT NULL REFERENCES public.download_tokens(id) ON DELETE CASCADE,
  action text NOT NULL,
  sku text,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX download_token_access_token_idx ON public.download_token_access (token_id, created_at DESC);

GRANT ALL ON public.download_tokens TO service_role;
GRANT ALL ON public.download_token_access TO service_role;
GRANT ALL ON SEQUENCE public.download_token_access_id_seq TO service_role;

ALTER TABLE public.download_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.download_token_access ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER download_tokens_touch
BEFORE UPDATE ON public.download_tokens
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();