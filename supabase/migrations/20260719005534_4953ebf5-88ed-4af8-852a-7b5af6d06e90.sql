-- Cleanup: mark persistent_carts as converted when the buyer already owns every
-- item, and strip purchased SKUs from remaining carts so no reminder can ever
-- mention a product the customer has already bought.
WITH owned AS (
  SELECT lower(customer_email) AS email, lower(unnest(skus)) AS sku
    FROM public.digital_email_sends
   WHERE status IS DISTINCT FROM 'failed'
  UNION
  SELECT lower(buyer_email) AS email,
         lower(coalesce(item->>'id', item->>'sku', item->>'product', item#>>'{}')) AS sku
    FROM public.manual_payments,
         LATERAL jsonb_array_elements(coalesce(items, '[]'::jsonb)) AS item
   WHERE status IN ('verified','completed','paid','approved')
  UNION
  SELECT lower(email) AS email, lower(product_code) AS sku
    FROM public.hotmart_purchases
   WHERE coalesce(status,'') NOT ILIKE '%refund%'
     AND coalesce(status,'') NOT ILIKE '%chargeback%'
     AND coalesce(status,'') NOT ILIKE '%cancel%'
),
carts AS (
  SELECT pc.email,
         COALESCE(
           jsonb_agg(it) FILTER (
             WHERE NOT EXISTS (
               SELECT 1 FROM owned o
                WHERE o.email = pc.email
                  AND o.sku = lower(it->>'id')
             )
           ),
           '[]'::jsonb
         ) AS remaining
    FROM public.persistent_carts pc,
         LATERAL jsonb_array_elements(coalesce(pc.items,'[]'::jsonb)) AS it
   WHERE pc.converted = false
   GROUP BY pc.email
)
UPDATE public.persistent_carts pc
   SET items = c.remaining,
       converted = (jsonb_array_length(c.remaining) = 0),
       updated_at = now()
  FROM carts c
 WHERE pc.email = c.email
   AND pc.items IS DISTINCT FROM c.remaining;