ALTER TABLE public.cart_reminder_sends DROP CONSTRAINT IF EXISTS cart_reminder_sends_step_check;
ALTER TABLE public.cart_reminder_sends ADD CONSTRAINT cart_reminder_sends_step_check
  CHECK (step = ANY (ARRAY[30, 1440, 7200]));
UPDATE public.cart_reminder_config
  SET enabled_steps = ARRAY[30, 1440, 7200], updated_at = now()
  WHERE id = 1;