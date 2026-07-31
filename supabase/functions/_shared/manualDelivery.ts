// Entrega digital "estilo pago manual".
//
// Por qué existe: la entrega automática (send-digital-ilinguerelax) puede
// rechazar llamadas internas y dejar el pedido pagado sin material. El flujo de
// pagos manuales (/admin/pagos-manuales) sí funciona: resuelve el material en
// `digital_products`, genera el token privado /mi-descarga?t=… y envía la
// plantilla `material-delivery`. Aquí reutilizamos exactamente ese camino para
// cualquier pedido (dLocal, conciliación manual, reintentos).
import { ensureDownloadUrl } from "./downloadToken.ts";
import { normalizeSku } from "./digitalSku.ts";

type BonusRow = { name?: string | null; drive_url?: string | null; access_key?: string | null };

export interface ManualDeliveryResult {
  delivered: boolean;
  detail: string;
  missing: string[];
  resolvedSkus: string[];
}

export async function resolveMaterialsBySku(admin: any, skus: string[]) {
  const clean = [...new Set((skus ?? []).map((s) => (s || "").toString().toLowerCase()).filter(Boolean))];
  if (!clean.length) return { materials: [], missing: [], resolvedSkus: [] as string[] };

  const { data: products } = await admin
    .from("digital_products")
    .select("sku, name, drive_url, access_key, bonuses, bonus_name, bonus_drive_url, bonus_access_key, sku_aliases")
    .eq("active", true);

  const rows = (products ?? []) as Array<Record<string, any>>;
  const materials: Array<{ productName: string; downloadUrl: string; accessKey?: string }> = [];
  const missing: string[] = [];
  const seen = new Set<string>();

  for (const raw of clean) {
    const hint = (normalizeSku(raw) || raw).toLowerCase();
    const hit =
      rows.find((p) => String(p.sku).toLowerCase() === hint) ??
      rows.find((p) => (p.sku_aliases || []).some((a: string) => (a || "").toLowerCase() === hint));

    if (!hit || !hit.drive_url) {
      missing.push(hint);
      continue;
    }
    if (seen.has(hit.sku)) continue;
    seen.add(hit.sku);
    materials.push({ productName: hit.name, downloadUrl: hit.drive_url, accessKey: hit.access_key ?? undefined });

    const bonusList: BonusRow[] = Array.isArray(hit.bonuses) && hit.bonuses.length
      ? hit.bonuses
      : (hit.bonus_drive_url ? [{ name: hit.bonus_name, drive_url: hit.bonus_drive_url, access_key: hit.bonus_access_key }] : []);
    bonusList.forEach((b, idx) => {
      if (!b?.drive_url) return;
      materials.push({
        productName: b.name?.trim() || `🎁 Bono ${idx + 1} — ${hit.name}`,
        downloadUrl: b.drive_url,
        accessKey: b.access_key || undefined,
      });
    });
  }

  return { materials, missing, resolvedSkus: [...seen] };
}

/**
 * Envía el correo de material usando el mismo camino que los pagos manuales.
 * Idempotente por `manual-material-<pedido>` en send-transactional-email.
 */
export async function deliverLikeManual(admin: any, order: {
  orderNumber: string;
  email: string;
  name?: string | null;
  skus: string[];
}): Promise<ManualDeliveryResult> {
  const { materials, missing, resolvedSkus } = await resolveMaterialsBySku(admin, order.skus);
  if (materials.length === 0) {
    return {
      delivered: false,
      missing,
      resolvedSkus,
      detail: missing.length
        ? `Falta configurar el enlace Drive de: ${missing.join(", ")}`
        : "El pedido no tiene materiales digitales asociados",
    };
  }

  const downloadUrl = await ensureDownloadUrl(admin, order.orderNumber, order.email, resolvedSkus);

  // Llamada directa por HTTP (en vez de admin.functions.invoke) para poder
  // enviar TODAS las credenciales internas y leer el motivo real del error:
  // invoke solo devuelve "non-2xx status code" y perdíamos el diagnóstico.
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const cronSecret = Deno.env.get("CRON_SHARED_SECRET") ?? "";
  let error: { message: string } | null = null;
  try {
    const res = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-transactional-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        ...(cronSecret ? { "x-internal-key": cronSecret } : {}),
      },
      body: JSON.stringify({
        templateName: "material-delivery",
        recipientEmail: order.email,
        idempotencyKey: `manual-material-${order.orderNumber}`,
        templateData: {
          customerName: order.name || order.email.split("@")[0],
          orderNumber: order.orderNumber,
          materials: materials.map((m) => ({
            productName: m.productName,
            downloadUrl: downloadUrl ?? "https://ilinguerelax.com/mi-pedido",
          })),
        },
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      let detail = text;
      try { detail = JSON.parse(text)?.error ?? text; } catch { /* texto plano */ }
      error = { message: `Correo de material (${res.status}): ${detail || "sin detalle"}` };
    }
  } catch (e) {
    error = { message: e instanceof Error ? e.message : String(e) };
  }


  if (error) {
    return { delivered: false, missing, resolvedSkus, detail: error.message || "Fallo al enviar el correo de material" };
  }

  try {
    await admin.from("digital_email_sends").upsert({
      idempotency_key: `manual-material-${order.orderNumber}`,
      order_id: order.orderNumber,
      customer_email: order.email,
      customer_name: order.name ?? null,
      skus: resolvedSkus,
      status: "sent",
      last_event: "material-delivery",
      last_event_at: new Date().toISOString(),
    }, { onConflict: "idempotency_key" });
  } catch (_e) { /* auditoría opcional */ }

  return { delivered: true, missing, resolvedSkus, detail: `Material enviado a ${order.email}` };
}
