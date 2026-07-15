INSERT INTO public.checkout_payment_methods (region_code, method_key, label, note, icon, enabled, sort_order)
VALUES ('US', 'stripe_klarna', 'Stripe — Klarna (Pay in 4)', 'Paga en 4 cuotas sin interés', '🅺', true, 5)
ON CONFLICT DO NOTHING;