REVOKE SELECT (drive_url, access_key, bonus_drive_url, bonus_access_key, bonuses, mp_preference_template) ON public.digital_products FROM anon;
REVOKE SELECT (drive_url, access_key, bonus_drive_url, bonus_access_key, bonuses, mp_preference_template) ON public.digital_products FROM authenticated;
REVOKE UPDATE, INSERT ON public.digital_products FROM anon;
GRANT ALL ON public.digital_products TO service_role;