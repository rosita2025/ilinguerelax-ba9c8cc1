
CREATE TABLE public.review_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email text NOT NULL,
  customer_name text NOT NULL DEFAULT 'Estudiante',
  product_type text NOT NULL DEFAULT 'english',
  product_name text NOT NULL DEFAULT 'Inglés Relax',
  emails_sent integer NOT NULL DEFAULT 0,
  last_email_sent_at timestamptz,
  next_email_at timestamptz NOT NULL DEFAULT (now() + interval '1 day'),
  has_reviewed boolean NOT NULL DEFAULT false,
  is_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.review_invitations ENABLE ROW LEVEL SECURITY;
