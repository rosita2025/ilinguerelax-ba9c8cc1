
CREATE TABLE public.bot_filters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pattern TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL DEFAULT 'user_agent' CHECK (kind IN ('user_agent','referrer','ip')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.bot_filters TO service_role;
ALTER TABLE public.bot_filters ENABLE ROW LEVEL SECURITY;

-- No public policies: only accessible via service_role from the bot-filters edge function (admin-key gated).

CREATE TRIGGER update_bot_filters_updated_at
BEFORE UPDATE ON public.bot_filters
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.bot_filters (pattern, kind, note) VALUES
  ('bot', 'user_agent', 'Genéricos: Googlebot, Bingbot, etc.'),
  ('crawler', 'user_agent', 'Rastreadores web genéricos'),
  ('spider', 'user_agent', 'Arañas de indexación'),
  ('crawling', 'user_agent', NULL),
  ('slurp', 'user_agent', 'Yahoo Slurp'),
  ('bingpreview', 'user_agent', NULL),
  ('facebookexternalhit', 'user_agent', 'Preview de Facebook al pegar link'),
  ('whatsapp', 'user_agent', 'Preview de WhatsApp'),
  ('telegrambot', 'user_agent', NULL),
  ('discordbot', 'user_agent', NULL),
  ('pinterest', 'user_agent', NULL),
  ('semrush', 'user_agent', 'SEO tool'),
  ('ahrefs', 'user_agent', 'SEO tool'),
  ('mj12', 'user_agent', 'Majestic bot'),
  ('dotbot', 'user_agent', 'Moz DotBot'),
  ('petalbot', 'user_agent', 'Huawei PetalBot'),
  ('yandex', 'user_agent', NULL),
  ('baiduspider', 'user_agent', NULL),
  ('duckduckbot', 'user_agent', NULL),
  ('applebot', 'user_agent', NULL),
  ('headlesschrome', 'user_agent', 'Chrome sin cabeza (bots)'),
  ('phantomjs', 'user_agent', NULL),
  ('puppeteer', 'user_agent', NULL),
  ('playwright', 'user_agent', NULL),
  ('lighthouse', 'user_agent', 'PageSpeed/Lighthouse'),
  ('gtmetrix', 'user_agent', NULL),
  ('pagespeed', 'user_agent', NULL),
  ('screaming', 'user_agent', 'Screaming Frog'),
  ('monitor', 'user_agent', NULL),
  ('uptime', 'user_agent', NULL),
  ('pingdom', 'user_agent', NULL),
  ('curl', 'user_agent', NULL),
  ('wget', 'user_agent', NULL),
  ('python-requests', 'user_agent', NULL),
  ('axios', 'user_agent', NULL),
  ('httpclient', 'user_agent', NULL),
  ('go-http-client', 'user_agent', NULL),
  ('okhttp', 'user_agent', NULL),
  ('scrapy', 'user_agent', NULL),
  ('radarads', 'referrer', 'Spam referrer detectado'),
  ('semalt', 'referrer', 'Referrer spam'),
  ('buttons-for-website', 'referrer', 'Referrer spam')
ON CONFLICT (pattern) DO NOTHING;
