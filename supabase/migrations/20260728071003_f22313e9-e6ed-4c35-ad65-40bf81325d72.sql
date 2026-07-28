CREATE TABLE IF NOT EXISTS public.email_domain_rules (
  id uuid primary key default gen_random_uuid(),
  list_type text not null check (list_type in ('allow','block','typo')),
  kind text not null check (kind in ('domain','tld','email','typo')),
  value text not null,
  maps_to text,
  note text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE UNIQUE INDEX IF NOT EXISTS email_domain_rules_unique ON public.email_domain_rules (list_type, kind, lower(value));

GRANT ALL ON public.email_domain_rules TO service_role;

ALTER TABLE public.email_domain_rules ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_email_domain_rules_touch ON public.email_domain_rules;
CREATE TRIGGER trg_email_domain_rules_touch BEFORE UPDATE ON public.email_domain_rules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.email_domain_rules (list_type, kind, value, maps_to, note) VALUES
  ('allow','domain','gmail.com',null,'Proveedor confiable'),
  ('allow','domain','yahoo.com',null,'Proveedor confiable'),
  ('allow','domain','yahoo.com.mx',null,'Proveedor confiable'),
  ('allow','domain','yahoo.es',null,'Proveedor confiable'),
  ('allow','domain','outlook.com',null,'Proveedor confiable'),
  ('allow','domain','outlook.es',null,'Proveedor confiable'),
  ('allow','domain','outlook.com.pe',null,'Proveedor confiable'),
  ('allow','domain','hotmail.com',null,'Proveedor confiable'),
  ('allow','domain','hotmail.es',null,'Proveedor confiable'),
  ('allow','domain','live.com',null,'Proveedor confiable'),
  ('allow','domain','icloud.com',null,'Proveedor confiable'),
  ('allow','domain','me.com',null,'Proveedor confiable'),
  ('allow','domain','proton.me',null,'Proveedor confiable'),
  ('allow','domain','protonmail.com',null,'Proveedor confiable'),
  ('block','domain','mailinator.com',null,'Desechable'),
  ('block','domain','yopmail.com',null,'Desechable'),
  ('block','domain','10minutemail.com',null,'Desechable'),
  ('block','domain','tempmail.com',null,'Desechable'),
  ('block','domain','guerrillamail.com',null,'Desechable'),
  ('block','domain','sharklasers.com',null,'Desechable'),
  ('block','domain','trashmail.com',null,'Desechable'),
  ('block','domain','getnada.com',null,'Desechable'),
  ('block','domain','dispostable.com',null,'Desechable'),
  ('block','domain','maildrop.cc',null,'Desechable'),
  ('block','tld','zzz',null,'TLD inexistente'),
  ('block','tld','test',null,'TLD de prueba'),
  ('block','tld','invalid',null,'TLD inválido'),
  ('block','tld','local',null,'TLD interno'),
  ('typo','typo','gmial.com','gmail.com','Corrección'),
  ('typo','typo','gmai.com','gmail.com','Corrección'),
  ('typo','typo','gamil.com','gmail.com','Corrección'),
  ('typo','typo','gmail.con','gmail.com','Corrección'),
  ('typo','typo','gmail.co','gmail.com','Corrección'),
  ('typo','typo','gmail.cm','gmail.com','Corrección'),
  ('typo','typo','hotmial.com','hotmail.com','Corrección'),
  ('typo','typo','hotmail.con','hotmail.com','Corrección'),
  ('typo','typo','outlok.com','outlook.com','Corrección'),
  ('typo','typo','outlok.com.pe','outlook.com.pe','Corrección'),
  ('typo','typo','yahoo.com.mxm','yahoo.com.mx','Corrección'),
  ('typo','typo','yahoo.com.mxm1','yahoo.com.mx','Corrección'),
  ('typo','typo','yahoo.con','yahoo.com','Corrección'),
  ('typo','typo','icloud.con','icloud.com','Corrección')
ON CONFLICT DO NOTHING;