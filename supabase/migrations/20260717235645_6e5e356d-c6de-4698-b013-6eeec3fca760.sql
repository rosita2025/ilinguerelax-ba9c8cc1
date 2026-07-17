
CREATE TABLE public.generated_blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  image TEXT NOT NULL DEFAULT 'https://ilinguerelax.com/og-image.png',
  author TEXT NOT NULL DEFAULT 'iLingue Relax',
  category TEXT NOT NULL DEFAULT 'Aprendizaje',
  tags TEXT[] NOT NULL DEFAULT '{}',
  read_time TEXT NOT NULL DEFAULT '5 min',
  keyword TEXT,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.generated_blog_posts TO anon, authenticated;
GRANT ALL ON public.generated_blog_posts TO service_role;

ALTER TABLE public.generated_blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published generated posts"
ON public.generated_blog_posts FOR SELECT
USING (published = true);

CREATE INDEX generated_blog_posts_created_idx ON public.generated_blog_posts (created_at DESC);
