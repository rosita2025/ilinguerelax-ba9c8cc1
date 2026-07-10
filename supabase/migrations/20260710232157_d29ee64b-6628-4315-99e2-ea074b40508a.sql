ALTER TABLE public.digital_products ADD COLUMN IF NOT EXISTS bonuses jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Backfill: migrate existing single bonus_* columns into the new bonuses array
UPDATE public.digital_products
SET bonuses = jsonb_build_array(
  jsonb_build_object(
    'name', COALESCE(bonus_name, ''),
    'drive_url', bonus_drive_url,
    'access_key', COALESCE(bonus_access_key, '')
  )
)
WHERE bonus_drive_url IS NOT NULL
  AND bonus_drive_url <> ''
  AND (bonuses IS NULL OR bonuses = '[]'::jsonb);