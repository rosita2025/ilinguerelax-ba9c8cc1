UPDATE public.digital_delivery_config SET enabled = false, updated_at = now() WHERE id = 1;
SELECT cron.unschedule('retry-digital-delivery');
DELETE FROM public.abandoned_carts WHERE customer_email='carmen.aliaga@urp.edu.pe';
INSERT INTO public.suppressed_emails (email, reason)
VALUES ('carmen.aliaga@urp.edu.pe', 'unsubscribe')
ON CONFLICT DO NOTHING;
UPDATE public.digital_email_sends
SET status='delivered', last_event='delivered', retry_attempts=99, last_retry_at=now()
WHERE customer_email='carmen.aliaga@urp.edu.pe';