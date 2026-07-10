ALTER TABLE public.digital_products
  ADD COLUMN IF NOT EXISTS bonus_name TEXT,
  ADD COLUMN IF NOT EXISTS bonus_drive_url TEXT,
  ADD COLUMN IF NOT EXISTS bonus_access_key TEXT;