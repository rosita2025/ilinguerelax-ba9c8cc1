INSERT INTO public.blog_post_queue (
  topic, 
  keyword, 
  category, 
  language, 
  status, 
  scheduled_at, 
  attempts
) VALUES (
  'Cómo aprender a hablar coreano: palabras esenciales y guía paso a paso',
  'aprender coreano hablar',
  'Idiomas',
  'es',
  'pending',
  NOW(),
  0
);