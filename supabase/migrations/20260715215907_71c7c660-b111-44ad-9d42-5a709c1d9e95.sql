
ALTER TABLE public.hotmart_purchases DROP CONSTRAINT IF EXISTS hotmart_purchases_status_check;
ALTER TABLE public.hotmart_purchases
  ADD CONSTRAINT hotmart_purchases_status_check
  CHECK (status IN ('approved','pending','refused','refunded','chargeback','cancelled'));

UPDATE public.hotmart_purchases
SET status = 'pending'
WHERE status = 'approved'
  AND (raw_payload->>'event') IN ('PURCHASE_BILLET_PRINTED','PURCHASE_DELAYED','PURCHASE_OUT_OF_SHOPPING_CART','PURCHASE_PROTEST');

UPDATE public.hotmart_purchases
SET status = 'refused'
WHERE status = 'approved'
  AND (raw_payload->>'event') IN ('PURCHASE_REFUSED','PURCHASE_EXPIRED');

UPDATE public.hotmart_purchases
SET status = 'refunded'
WHERE status = 'approved'
  AND (raw_payload->>'event') = 'PURCHASE_REFUNDED';

UPDATE public.hotmart_purchases
SET status = 'chargeback'
WHERE status = 'approved'
  AND (raw_payload->>'event') = 'PURCHASE_CHARGEBACK';

UPDATE public.hotmart_purchases
SET status = 'cancelled'
WHERE status = 'approved'
  AND (raw_payload->>'event') IN ('PURCHASE_CANCELED','PURCHASE_CANCELLED');

UPDATE public.brevo_sync_logs l
SET event_type = CASE hp.status
  WHEN 'pending'    THEN 'hotmart_pending'
  WHEN 'refused'    THEN 'hotmart_refused'
  WHEN 'refunded'   THEN 'hotmart_refunded'
  WHEN 'chargeback' THEN 'hotmart_chargeback'
  WHEN 'cancelled'  THEN 'hotmart_cancelled'
  ELSE l.event_type
END
FROM public.hotmart_purchases hp
WHERE l.order_ref = hp.transaction_code
  AND l.event_type = 'hotmart_purchase'
  AND hp.status <> 'approved';
