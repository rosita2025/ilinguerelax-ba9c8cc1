-- Regiones LatAm faltantes para dLocal Go
INSERT INTO public.checkout_regions (code, name, flag, currency, country_codes, enabled, sort_order)
VALUES
  ('DO','República Dominicana','🇩🇴','DOP', ARRAY['DO'], true, 60),
  ('NI','Nicaragua','🇳🇮','NIO', ARRAY['NI'], true, 61)
ON CONFLICT (code) DO UPDATE SET enabled = true;

-- Cobertura dLocal completa (transferencia + efectivo) en toda LatAm
INSERT INTO public.checkout_payment_methods (region_code, method_key, label, note, icon, enabled, sort_order)
SELECT r.code, m.key, m.label, m.note, m.icon, true, m.sort
FROM (VALUES
  ('AR'),('BO'),('BR'),('CL'),('CO'),('CR'),('DO'),('EC'),('GT'),('HN'),('MX'),('NI'),('PA'),('PE'),('PY'),('SV'),('UY')
) AS r(code)
CROSS JOIN (VALUES
  ('dlocal_transfer','Transferencia bancaria','Transferencia bancaria local vía dLocal Go · vence en 3 días','Building2',30),
  ('dlocal_cash','Pago en efectivo','Pago en efectivo/agentes vía dLocal Go · vence en 3 días','Banknote',31)
) AS m(key,label,note,icon,sort)
ON CONFLICT (region_code, method_key) DO UPDATE
  SET enabled = true, note = EXCLUDED.note;

-- Billeteras digitales dLocal donde ya están activas
INSERT INTO public.checkout_payment_methods (region_code, method_key, label, note, icon, enabled, sort_order)
SELECT r.code, r.key, 'Billetera digital', 'Billeteras locales vía dLocal Go · vence en 3 días', 'Smartphone', true, 32
FROM (VALUES
  ('AR','dlocal_mercadopago'),('MX','dlocal_mercadopago'),
  ('BO','dlocal_wallet'),('BR','dlocal_wallet'),('CL','dlocal_wallet'),('CO','dlocal_wallet'),
  ('CR','dlocal_wallet'),('EC','dlocal_wallet'),('PE','dlocal_wallet'),('PY','dlocal_wallet')
) AS r(code,key)
ON CONFLICT (region_code, method_key) DO UPDATE SET enabled = true;