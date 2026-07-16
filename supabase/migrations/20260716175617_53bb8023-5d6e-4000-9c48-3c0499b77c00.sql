
DO $$
DECLARE
  v_url TEXT := 'https://opyitzdvvurdyyyzkwwv.supabase.co/functions/v1/send-cart-reminders';
  v_key TEXT;
BEGIN
  BEGIN
    SELECT decrypted_secret INTO v_key FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key' LIMIT 1;
  EXCEPTION WHEN OTHERS THEN v_key := NULL;
  END;
  IF v_key IS NULL THEN
    RAISE NOTICE 'email_queue_service_role_key not found in vault — cron job will be scheduled but may fail auth until set';
    v_key := 'PLACEHOLDER';
  END IF;

  PERFORM cron.unschedule('send-cart-reminders-hourly') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-cart-reminders-hourly');

  PERFORM cron.schedule(
    'send-cart-reminders-hourly',
    '5 * * * *',
    format($cron$
      SELECT net.http_post(
        url := %L,
        headers := jsonb_build_object('Content-Type','application/json','Authorization', 'Bearer ' || %L),
        body := '{}'::jsonb
      );
    $cron$, v_url, v_key)
  );
END $$;
