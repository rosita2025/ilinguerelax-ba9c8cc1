# PROMPT LISTO PARA COPIAR — Google Indexing API + IndexNow (para otro proyecto Lovable)

> Copia TODO el bloque de abajo y pégalo como mensaje en el otro proyecto.
> Está escrito para un proyecto Lovable con Lovable Cloud (Supabase) activado.

---

## BLOQUE A COPIAR

Implementa un sistema completo de indexación automática (Google Indexing API v3 + IndexNow + WebSub + sitemap ping) con panel de administración. Requisitos exactos:

### 1) Secretos
- Pídeme con el formulario seguro el secreto `GOOGLE_INDEXING_SA_JSON`: es el JSON completo de una cuenta de servicio de Google Cloud (campos `client_email`, `private_key`, `project_id`) con la **Indexing API** habilitada y ese `client_email` añadido como **Propietario** en Google Search Console.
- Genera automáticamente `CRON_SHARED_SECRET` (aleatorio) para proteger las llamadas internas/cron.
- Opcional: `INDEXNOW_KEY` (si no existe, genera una clave de 32 hex y sírvela en `/<key>.txt`).

### 2) Base de datos
Crea la tabla de auditoría (con GRANTs y RLS cerrada al público):

```sql
create table public.indexing_events (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  provider text not null,            -- 'google' | 'indexnow' | 'websub' | 'sitemap'
  action text not null,              -- 'URL_UPDATED' | 'URL_DELETED' | 'ping'
  status text not null,              -- 'sent' | 'failed' | 'retrying' | 'validated'
  http_status int,
  error text,
  entity_type text,                  -- 'blog' | 'product' | 'page'
  created_at timestamptz not null default now()
);
create index on public.indexing_events (url, created_at desc);
create index on public.indexing_events (created_at desc);

grant all on public.indexing_events to service_role;
alter table public.indexing_events enable row level security;
-- sin políticas: solo service_role (edge functions) puede leer/escribir
```

### 3) Módulos compartidos (`supabase/functions/_shared/`)
**`googleIndexing.ts`**
- Firma un JWT RS256 manualmente con `crypto.subtle` (importa la `private_key` PKCS#8 del JSON), scope `https://www.googleapis.com/auth/indexing`, aud `https://oauth2.googleapis.com/token`.
- Intercambia el JWT por access_token (`grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer`), cachea el token en memoria hasta su expiración.
- `notifyGoogleIndexing(urls: string[], action: 'URL_UPDATED'|'URL_DELETED')`:
  - máximo 10 URLs por invocación, `Promise.allSettled`, `AbortSignal.timeout(8000)` en cada fetch;
  - endpoint `POST https://indexing.googleapis.com/v3/urlNotifications:publish`;
  - registra cada resultado en `indexing_events` (nunca lanza; falla suave).

**`indexnow.ts`**
- `pingIndexNow(urls)` → `POST https://api.indexnow.org/indexnow` con `{host, key, keyLocation, urlList}`, `AbortSignal.timeout(4000)`.
- `pingSitemap()` → ping a Bing/Google sitemap y WebSub (`https://pubsubhubbub.appspot.com/`) con timeout 4s.
- Todo registra en `indexing_events` y nunca lanza excepción.

**`pingPostPublished(url, entityType)`** — helper único que llama a Google Indexing + IndexNow + WebSub + sitemap en paralelo con `Promise.allSettled`.

### 4) Edge Functions
- `request-google-indexing`: recibe `{ urls: string[], action? }`. Valida método POST (405 si no), exige cabecera de admin o `CRON_SHARED_SECRET`, **corta a máximo 10 URLs por llamada**, usa `Promise.allSettled` y responde siempre JSON con el detalle por URL. Nunca debe tardar más de ~15s.
- `index-all-urls`: cron diario (06:30 UTC) que recorre blog posts publicados, productos activos y páginas estáticas, arma las URLs absolutas del dominio de producción y las envía en lotes de 10 con pausa entre lotes.
- `list-indexing-events`: usa `service_role` para leer `indexing_events` (últimos 90 días) saltándose RLS, protegida por verificación de admin; devuelve eventos agregados por URL.
- Todas las funciones: CORS con `import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'`, validación de entrada con Zod, y `corsHeaders` en TODAS las respuestas incluidos los errores.

### 5) Disparo automático
Llama `pingPostPublished()` justo después de:
- publicar/actualizar un post del blog,
- crear/editar un producto,
- cambios en páginas estáticas clave.
Además el cron diario `index-all-urls`.

### 6) Panel de administración `/admin/indexing`
- Tarjetas con conteos: Validado / Enviado / Pendiente / Reintentando / Fallido.
- Tabla por URL con el último estado, proveedor, código HTTP y fecha en hora local (UTC-5 si aplica).
- Historial expandible por URL con todos los eventos y timestamps.
- Botón de reintento individual y reintento masivo de fallidos: **envía en lotes de 5 URLs** por request (evita timeouts de la edge function) y muestra el error real del backend.
- Los datos se leen vía `list-indexing-events` (no directo a la tabla, porque RLS la bloquea).

### 7) Reglas anti-timeout (obligatorias)
- Máx. 10 URLs por llamada a la edge function; lotes de 5 desde el cliente.
- `AbortSignal.timeout()` en **cada** fetch externo (4s pings, 8s Google).
- `Promise.allSettled` en todos los fan-outs: un proveedor caído no debe tumbar la petición.
- Nada de trabajo extra (site inspection, updates masivos) dentro del endpoint de reintento.

### 8) Extras SEO
- `robots.txt` con `Sitemap:` absoluto y permitiendo crawlers de IA (GPTBot, ClaudeBot, PerplexityBot, Google-Extended).
- `/sitemap.xml` y `/rss.xml` servidos dinámicamente desde la base de datos, con validación de estructura XML y de que todos los `<loc>` sean URLs absolutas https del dominio.

Al terminar: despliega las funciones, ejecuta una prueba real con 1 URL y muéstrame el registro en `/admin/indexing`.

---

## Notas de configuración externa (hazlas tú, una sola vez)
1. Google Cloud → habilitar **Indexing API** en el proyecto.
2. Crear cuenta de servicio → clave JSON → ese JSON es `GOOGLE_INDEXING_SA_JSON`.
3. Google Search Console → Configuración → Usuarios y permisos → añadir el `client_email` como **Propietario**.
4. Cuota por defecto: 200 URLs/día por proyecto.
