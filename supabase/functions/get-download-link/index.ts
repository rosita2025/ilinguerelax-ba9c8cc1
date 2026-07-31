// Entrega un enlace firmado y de duración amplia (7 días) para un archivo del
// pedido. El drive_url nunca viaja al navegador en la respuesta JSON: se pide
// un ticket firmado (HMAC) y la propia función redirige al archivo.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { dlCors, dlJson, TOKEN_RE, bonusList } from "../_shared/downloadToken.ts";

const TTL_MS = 7 * 24 * 60 * 60 * 1000;



const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return b64url(new Uint8Array(sig));
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// deno-lint-ignore no-explicit-any
async function resolveFile(admin: any, sku: string, kind: string, index: number) {
  const { data: p } = await admin
    .from("digital_products")
    .select("sku,name,drive_url,access_key,bonus_name,bonus_drive_url,bonus_access_key,bonuses")
    .eq("sku", sku)
    .maybeSingle();
  if (!p) return null;
  if (kind === "bonus") {
    const b = bonusList(p as Record<string, unknown>)[index];
    if (!b) return null;
    return { url: String(b.drive_url ?? b.url ?? ""), accessKey: b.access_key ?? null, name: b.title ?? b.name ?? "Bono" };
  }
  return { url: String(p.drive_url ?? ""), accessKey: p.access_key ?? null, name: p.name };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: dlCors });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // --- Paso 2: canje del ticket firmado -> redirección al archivo -----------
  if (req.method === "GET") {
    try {
      const u = new URL(req.url);
      const data = u.searchParams.get("d") ?? "";
      const sig = u.searchParams.get("s") ?? "";
      if (!data || !sig || !safeEqual(await sign(data), sig)) {
        return new Response("Enlace inválido", { status: 403 });
      }
      const [tokenId, sku, kind, idxRaw, expRaw] = atob(data.replace(/-/g, "+").replace(/_/g, "/")).split("|");
      if (Number(expRaw) < Date.now()) return new Response("Enlace caducado, vuelve a tu página de descarga", { status: 410 });

      // Revalidar el pedido en el momento del canje: un ticket firmado no puede
      // sobrevivir a una revocación, caducidad o a un SKU que ya no pertenece al pedido.
      const { data: tok } = await admin
        .from("download_tokens")
        .select("id, skus, expires_at, revoked")
        .eq("id", tokenId)
        .maybeSingle();
      if (!tok || tok.revoked) return new Response("Enlace inválido", { status: 403 });
      if (new Date(String(tok.expires_at)).getTime() < Date.now()) {
        return new Response("Enlace caducado, vuelve a tu página de descarga", { status: 410 });
      }
      if (!((tok.skus as string[]) ?? []).map((s) => String(s).toLowerCase()).includes(String(sku).toLowerCase())) {
        return new Response("Enlace inválido", { status: 403 });
      }

      const file = await resolveFile(admin, sku, kind, Number(idxRaw) || 0);
      if (!file?.url) return new Response("Archivo no disponible", { status: 404 });


      await admin.from("download_token_access").insert({
        token_id: tokenId, action: "download", sku,
        ip: req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? null,
        user_agent: req.headers.get("user-agent")?.slice(0, 300) ?? null,
      });

      return new Response(null, { status: 302, headers: { Location: file.url } });
    } catch (e) {
      console.error("[get-download-link:get]", e);
      return new Response("Error", { status: 500 });
    }
  }

  if (req.method !== "POST") return dlJson({ error: "Method not allowed" }, 405);

  // --- Paso 1: el navegador pide el ticket con su token de pedido -----------
  try {
    const body = await req.json().catch(() => ({}));
    const token = String(body?.token ?? "").trim();
    const sku = String(body?.sku ?? "").trim().toLowerCase();
    const kind = body?.kind === "bonus" ? "bonus" : "main";
    const index = Number.isFinite(Number(body?.index)) ? Math.max(0, Number(body.index)) : 0;

    if (!TOKEN_RE.test(token) || !/^[a-z0-9\-_.]{1,120}$/.test(sku)) return dlJson({ error: "Datos inválidos" }, 400);

    const { data: row } = await admin
      .from("download_tokens")
      .select("id, skus, expires_at, max_downloads, download_count, revoked")
      .eq("token", token)
      .maybeSingle();

    if (!row || row.revoked) return dlJson({ status: "invalid" }, 403);
    if (new Date(row.expires_at).getTime() < Date.now()) return dlJson({ status: "expired" }, 403);
    if ((row.download_count ?? 0) >= (row.max_downloads ?? 0)) return dlJson({ status: "exhausted" }, 403);
    if (!(row.skus ?? []).map((s: string) => s.toLowerCase()).includes(sku)) return dlJson({ status: "invalid" }, 403);

    const file = await resolveFile(admin, sku, kind, index);
    if (!file?.url) return dlJson({ error: "Archivo no disponible" }, 404);

    const expires = Date.now() + TTL_MS;
    const raw = `${row.id}|${sku}|${kind}|${index}|${expires}`;
    const data = btoa(raw).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const sig = await sign(data);
    const base = `${Deno.env.get("SUPABASE_URL")}/functions/v1/get-download-link`;

    // El cupo se cobra UNA sola vez por archivo distinto (producto, upsell o bono):
    // volver a abrir el mismo archivo no gasta descargas y no mezcla los ítems del pedido.
    const fileKey = `${sku}#${kind}#${index}`;
    const { data: prior } = await admin
      .from("download_token_access")
      .select("id")
      .eq("token_id", row.id)
      .eq("action", "ticket")
      .eq("sku", fileKey)
      .limit(1);
    const alreadyCharged = (prior ?? []).length > 0;

    if (!alreadyCharged) {
      await admin.from("download_token_access").insert({ token_id: row.id, action: "ticket", sku: fileKey });
      await admin
        .from("download_tokens")
        .update({ download_count: (row.download_count ?? 0) + 1, last_accessed_at: new Date().toISOString() })
        .eq("id", row.id);
    } else {
      await admin
        .from("download_tokens")
        .update({ last_accessed_at: new Date().toISOString() })
        .eq("id", row.id);
    }

    return dlJson({
      status: "ok",
      name: file.name,
      accessKey: file.accessKey,
      url: `${base}?d=${data}&s=${sig}`,
      expiresIn: TTL_MS / 1000,
      downloadsLeft: Math.max(0, (row.max_downloads ?? 0) - (row.download_count ?? 0) - (alreadyCharged ? 0 : 1)),
    });

  } catch (e) {
    console.error("[get-download-link]", e);
    return dlJson({ error: "Error interno" }, 500);
  }
});
