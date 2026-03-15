CREATE TABLE public.announcement_drips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  product_name text NOT NULL DEFAULT 'Libro Físico 5,000 Palabras en Inglés',
  product_url text NOT NULL DEFAULT 'https://ilinguerelax.com/products/5-000-words-physical-book',
  image_url text DEFAULT 'https://ilinguerelax.com/images/product-5000-book.webp',
  emails_sent integer NOT NULL DEFAULT 0,
  last_email_sent_at timestamptz,
  next_email_at timestamptz NOT NULL DEFAULT now(),
  is_completed boolean NOT NULL DEFAULT false,
  converted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(email, product_name)
);

ALTER TABLE public.announcement_drips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public access" ON public.announcement_drips
  FOR ALL TO public USING (false);