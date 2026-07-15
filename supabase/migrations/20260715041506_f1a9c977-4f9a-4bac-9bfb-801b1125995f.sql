DELETE FROM public.checkout_payment_methods
WHERE method_key NOT IN (
  'stripe_card',
  'paypal',
  'mercadopago_transfer',
  'mercadopago_cash',
  'yape_plin'
);

UPDATE public.checkout_payment_methods
SET label = 'Stripe',
    note = 'Tarjeta, wallets y métodos locales dentro de Stripe',
    icon = 'CreditCard',
    enabled = true,
    sort_order = 1
WHERE region_code = 'US' AND method_key = 'stripe_card';

INSERT INTO public.checkout_payment_methods (region_code, method_key, label, note, icon, enabled, sort_order)
VALUES ('US', 'stripe_card', 'Stripe', 'Tarjeta, wallets y métodos locales dentro de Stripe', 'CreditCard', true, 1)
ON CONFLICT (region_code, method_key) DO UPDATE
SET label = EXCLUDED.label,
    note = EXCLUDED.note,
    icon = EXCLUDED.icon,
    enabled = EXCLUDED.enabled,
    sort_order = EXCLUDED.sort_order;

INSERT INTO public.checkout_payment_methods (region_code, method_key, label, note, icon, enabled, sort_order)
VALUES ('US', 'paypal', 'PayPal', 'Botón separado de PayPal', 'Wallet', true, 2)
ON CONFLICT (region_code, method_key) DO UPDATE
SET label = EXCLUDED.label,
    note = EXCLUDED.note,
    icon = EXCLUDED.icon,
    enabled = EXCLUDED.enabled,
    sort_order = EXCLUDED.sort_order;

UPDATE public.checkout_payment_methods
SET label = 'Stripe',
    note = 'Tarjeta, wallets y métodos locales dentro de Stripe',
    icon = 'CreditCard'
WHERE method_key = 'stripe_card';

UPDATE public.checkout_payment_methods
SET label = 'PayPal',
    note = 'Botón separado de PayPal',
    icon = 'Wallet'
WHERE method_key = 'paypal';