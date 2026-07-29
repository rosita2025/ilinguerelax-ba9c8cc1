UPDATE public.checkout_payment_methods
SET label = btrim(regexp_replace(regexp_replace(label, '\s*\(dLocal Go\)', '', 'gi'), '^\s*dLocal Go\s*[—–-]\s*', '', 'i'))
WHERE label ILIKE '%dLocal Go%';