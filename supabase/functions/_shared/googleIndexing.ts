/**
 * Google Indexing API (v3) — https://developers.google.com/search/apis/indexing-api/v3/quickstart
 *
 * Permite avisar a Google al instante cuando una URL se crea/actualiza
 * (URL_UPDATED) o se elimina (URL_DELETED), sin esperar al rastreo del
 * sitemap.
 *
 * Requisitos (todos opcionales: si falta el secreto, estas funciones son
 * no-op y el resto del pipeline de indexación sigue funcionando):
 *   1. Activar la API Indexing en Google Cloud.
 *   2. Crear una cuenta de servicio y descargar su JSON.
 *   3. Añadir esa cuenta de servicio como propietario en Search Console.
 *   4. Guardar el JSON completo en el secreto GOOGLE_INDEXING_SA_JSON.
 *
 * Cuotas (por proyecto de Google Cloud):
 *   - publish:      200 solicitudes/día  (DefaultPublishRequestsPerDayPerProject)
 *   - getMetadata:  180 solicitudes/minuto
 *   - global:       380 solicitudes/minuto
 * Respetamos la cuota diaria contando los eventos ya enviados hoy en
 * public.indexing_events y descartando el exceso (nunca reintentamos a lo
 * bruto: abusar de la API puede provocar la revocación del acceso).
 *
 * Nota de política de Google: la API solo garantiza rastreo para páginas con
 * datos estructurados JobPosting o BroadcastEvent (dentro de VideoObject).
 * Para el resto de páginas la llamada es un aviso adicional y la indexación
 * real sigue dependiendo de sitemap/IndexNow/WebSub, que ya enviamos.
 */
import { logIndexingEvents, type IndexingEvent } from "./indexingLog.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/indexing";
const PUBLISH_URL = "https://indexing.googleapis.com/v3/urlNotifications:publish";
const METADATA_URL = "https://indexing.googleapis.com/v3/urlNotifications/metadata";
const BATCH_URL = "https://indexing.googleapis.com/batch";

/** Cuota diaria de publish del proyecto (Pacific midnight reset). */
const DAILY_PUBLISH_QUOTA = 200;
/** Máximo de llamadas por solicitud batch según la documentación. */
const MAX_BATCH = 100;
const FETCH_TIMEOUT_MS = 8_000;

export type NotificationType = "URL_UPDATED" | "URL_DELETED";

interface ServiceAccount {
  client_email: string;
  private_key: string;
}

function serviceAccount(): ServiceAccount | null {
  const raw = Deno.env.get("GOOGLE_INDEXING_SA_JSON");
  if (!raw) return null;
  try {
    const sa = JSON.parse(raw) as ServiceAccount;
    if (!sa.client_email || !sa.private_key) return null;
    return sa;
  } catch {
    console.warn("[googleIndexing] GOOGLE_INDEXING_SA_JSON no es JSON válido");
    return null;
  }
}

/** ¿Está configurada la Indexing API en este proyecto? */
export function indexingApiEnabled(): boolean {
  return serviceAccount() !== null;
}

// ---------------------------------------------------------------- auth (JWT)

function b64url(data: Uint8Array | string): string {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToPkcs8(pem: string): Uint8Array {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\\n/g, "")
    .replace(/\s+/g, "");
  const bin = atob(body);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

let cachedToken: { value: string; exp: number } | null = null;

async function accessToken(): Promise<string | null> {
  const sa = serviceAccount();
  if (!sa) return null;

  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.exp - 60 > now) return cachedToken.value;

  try {
    const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const claim = b64url(
      JSON.stringify({
        iss: sa.client_email,
        scope: SCOPE,
        aud: TOKEN_URL,
        iat: now,
        exp: now + 3600,
      }),
    );
    const input = `${header}.${claim}`;

    const key = await crypto.subtle.importKey(
      "pkcs8",
      pemToPkcs8(sa.private_key.replace(/\\n/g, "\n")),
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const sig = new Uint8Array(
      await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(input)),
    );
    const assertion = `${input}.${b64url(sig)}`;

    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.access_token) {
      console.warn("[googleIndexing] token error", res.status, JSON.stringify(data).slice(0, 240));
      return null;
    }
    cachedToken = { value: data.access_token as string, exp: now + Number(data.expires_in ?? 3600) };
    return cachedToken.value;
  } catch (err) {
    console.warn("[googleIndexing] no se pudo firmar el JWT:", (err as Error).message);
    return null;
  }
}

// ---------------------------------------------------------------- cuota diaria

/** Solicitudes publish ya enviadas hoy (reset a medianoche hora del Pacífico). */
async function usedTodayQuota(): Promise<number> {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return 0;
  try {
    // Medianoche Pacific (UTC-8/-7): usamos UTC-8 como cota conservadora.
    const start = new Date(Date.now() - 8 * 3600_000);
    start.setUTCHours(0, 0, 0, 0);
    const since = new Date(start.getTime() + 8 * 3600_000).toISOString();
    const c = createClient(url, key, { auth: { persistSession: false } });
    const { count } = await c
      .from("indexing_events")
      .select("id", { count: "exact", head: true })
      .eq("channel", "google_indexing")
      .eq("status", "sent")
      .gte("created_at", since);
    return count ?? 0;
  } catch (err) {
    console.warn("[googleIndexing] no se pudo leer la cuota usada:", (err as Error).message);
    return 0;
  }
}

/** Cuota restante hoy (para /admin/seo). */
export async function indexingApiQuota(): Promise<{
  enabled: boolean;
  used: number;
  limit: number;
  remaining: number;
}> {
  const enabled = indexingApiEnabled();
  const used = enabled ? await usedTodayQuota() : 0;
  return { enabled, used, limit: DAILY_PUBLISH_QUOTA, remaining: Math.max(0, DAILY_PUBLISH_QUOTA - used) };
}

// ---------------------------------------------------------------- publish

function parseBatchStatuses(body: string, expected: number, batchId?: string): number[] {
  const codes = new Array<number>(expected).fill(0);

  // Google responde con las partes en cualquier orden, pero cada una repite el
  // Content-ID que enviamos (prefijado con "response-"). Mapeamos por índice.
  if (batchId) {
    const re = new RegExp(
      `Content-ID:\\s*<[^>]*${batchId}\\+(\\d+)>[\\s\\S]*?HTTP/[\\d.]+ (\\d{3})`,
      "gi",
    );
    let m: RegExpExecArray | null;
    let matched = 0;
    while ((m = re.exec(body)) !== null) {
      const idx = Number(m[1]);
      if (idx >= 0 && idx < expected) {
        codes[idx] = Number(m[2]);
        matched++;
      }
    }
    if (matched === expected) return codes;
  }

  // Fallback: orden secuencial de los códigos de estado.
  const seq = Array.from(body.matchAll(/^HTTP\/[\d.]+ (\d{3})/gm)).map((x) => Number(x[1]));
  for (let i = 0; i < expected; i++) {
    if (!codes[i]) codes[i] = seq[i] ?? 0;
  }
  return codes;
}

async function publishBatch(
  token: string,
  urls: string[],
  type: NotificationType,
): Promise<IndexingEvent[]> {
  // Un único envío HTTP con hasta 100 llamadas (multipart/mixed), tal y como
  // describe la documentación de solicitudes en lote.
  if (urls.length === 1) {
    const res = await fetch(PUBLISH_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url: urls[0], type }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    const text = await res.text().catch(() => "");
    if (!res.ok) console.warn("[googleIndexing] publish", res.status, text.slice(0, 240));
    return [{
      url: urls[0],
      channel: "google_indexing",
      target: type,
      status: res.ok ? "sent" : "error",
      http_status: res.status,
      detail: res.ok ? undefined : text.slice(0, 240),
    }];
  }

  // Formato exacto de la doc: cada parte es una petición HTTP completa con
  // Content-Type: application/http, Content-Transfer-Encoding: binary,
  // Content-ID único y content-length del cuerpo JSON.
  const boundary = `===============${crypto.randomUUID()}==`;
  const batchId = crypto.randomUUID();
  const encoder = new TextEncoder();
  const parts = urls
    .map((u, i) => {
      const payload = JSON.stringify({ url: u, type });
      return (
        `--${boundary}\r\n` +
        `Content-Type: application/http\r\n` +
        `Content-Transfer-Encoding: binary\r\n` +
        `Content-ID: <${batchId}+${i}>\r\n\r\n` +
        `POST /v3/urlNotifications:publish\r\n` +
        `Content-Type: application/json\r\n` +
        `accept: application/json\r\n` +
        `content-length: ${encoder.encode(payload).length}\r\n\r\n` +
        `${payload}\r\n`
      );
    })
    .join("");
  const body = `${parts}--${boundary}--\r\n`;

  const res = await fetch(BATCH_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": `multipart/mixed; boundary="${boundary}"`,
    },
    body,
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  const text = await res.text().catch(() => "");
  if (!res.ok) console.warn("[googleIndexing] batch", res.status, text.slice(0, 240));
  const codes = res.ok
    ? parseBatchStatuses(text, urls.length, batchId)
    : urls.map(() => res.status);
  return urls.map((u, i) => {
    const code = codes[i] || res.status;
    const ok = code >= 200 && code < 300;
    return {
      url: u,
      channel: "google_indexing" as const,
      target: type,
      status: ok ? ("sent" as const) : ("error" as const),
      http_status: code,
      detail: ok ? undefined : text.slice(0, 240),
    };
  });
}

/**
 * Avisa a Google de URLs nuevas/actualizadas o eliminadas.
 * No lanza nunca; respeta la cuota diaria y registra todo en indexing_events.
 */
export async function notifyGoogleIndexing(
  urls: string[],
  type: NotificationType = "URL_UPDATED",
): Promise<void> {
  const clean = Array.from(
    new Set(urls.map((u) => String(u || "").trim()).filter((u) => /^https:\/\/[^\s]+$/.test(u))),
  );
  if (clean.length === 0) return;

  const token = await accessToken();
  if (!token) return; // API no configurada: el resto del pipeline sigue igual.

  const used = await usedTodayQuota();
  const remaining = DAILY_PUBLISH_QUOTA - used;
  if (remaining <= 0) {
    console.warn("[googleIndexing] cuota diaria agotada (200/día); se omite el aviso");
    await logIndexingEvents(
      clean.map((u) => ({
        url: u,
        channel: "google_indexing" as const,
        target: type,
        status: "error" as const,
        detail: "quota_exhausted: 200 publish/day",
      })),
    );
    return;
  }

  const allowed = clean.slice(0, remaining);
  if (allowed.length < clean.length) {
    console.warn(`[googleIndexing] cuota limitada: se envían ${allowed.length}/${clean.length}`);
  }

  const events: IndexingEvent[] = [];
  for (let i = 0; i < allowed.length; i += MAX_BATCH) {
    const chunk = allowed.slice(i, i + MAX_BATCH);
    try {
      events.push(...(await publishBatch(token, chunk, type)));
    } catch (err) {
      const detail = (err as Error).message.slice(0, 240);
      events.push(
        ...chunk.map((u) => ({
          url: u,
          channel: "google_indexing" as const,
          target: type,
          status: "error" as const,
          detail,
        })),
      );
    }
  }
  await logIndexingEvents(events);
}

/** Estado de la última notificación que Google recibió para una URL. */
export async function getIndexingMetadata(url: string): Promise<unknown | null> {
  const token = await accessToken();
  if (!token) return null;
  try {
    const res = await fetch(`${METADATA_URL}?url=${encodeURIComponent(url)}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      console.warn("[googleIndexing] getMetadata", res.status, JSON.stringify(data).slice(0, 240));
      return null;
    }
    return data;
  } catch (err) {
    console.warn("[googleIndexing] getMetadata error:", (err as Error).message);
    return null;
  }
}
