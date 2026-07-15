WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY lower(email), source ORDER BY created_at ASC, id ASC) AS rn
  FROM public.email_contacts
)
DELETE FROM public.email_contacts ec USING ranked r WHERE ec.id = r.id AND r.rn > 1;

UPDATE public.email_contacts SET email = lower(email) WHERE email <> lower(email);

CREATE UNIQUE INDEX IF NOT EXISTS email_contacts_email_source_plain_key
  ON public.email_contacts (email, source);