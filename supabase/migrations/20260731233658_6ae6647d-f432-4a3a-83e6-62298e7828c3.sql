SELECT cron.unschedule('dlocal-sweep-pending');
SELECT cron.schedule('dlocal-sweep-pending', '*/3 * * * *', $cron$
  select net.http_post(
    url := 'https://opyitzdvvurdyyyzkwwv.supabase.co/functions/v1/dlocal-sweep-pending',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Lovable-Context', 'cron',
      'Authorization', 'Bearer ' || (
        select decrypted_secret from vault.decrypted_secrets where name = 'email_queue_service_role_key'
      )
    ),
    body := '{}'::jsonb
  );
$cron$);