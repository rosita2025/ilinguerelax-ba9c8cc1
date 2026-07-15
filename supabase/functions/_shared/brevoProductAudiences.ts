// Resolve Brevo list IDs + tags per product from the `brevo_product_audiences`
// table so audiences/segments can be updated in the admin panel without code.
//
// Match precedence (all matching rows are unioned):
//   - hotmart_product_id  == args.hotmartProductId
//   - hotmart_product_code == args.hotmartProductCode
//   - tienda_sku          == args.tiendaSku OR any of args.skus
//   - category            == args.category
//   - any_sku             == any of [hotmartProductId, hotmartProductCode, tiendaSku, ...skus]
// event_kind filters:  row.event_kind == 'any' OR row.event_kind == args.eventKind

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface Args {
  eventKind: "compra" | "abandonado";
  origin?: "hotmart" | "tienda";
  hotmartProductId?: string;
  hotmartProductCode?: string;
  tiendaSku?: string;
  skus?: string[];
  category?: string;
}

interface AudienceRow {
  match_type: string;
  match_value: string;
  event_kind: string;
  list_id: number;
  tag: string | null;
  label: string | null;
  active: boolean;
}

let cache: { at: number; rows: AudienceRow[] } | null = null;
const TTL_MS = 60_000;

async function loadRows(): Promise<AudienceRow[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.rows;
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return [];
  const admin = createClient(url, key);
  const { data, error } = await admin
    .from("brevo_product_audiences")
    .select("match_type, match_value, event_kind, list_id, tag, label, active")
    .eq("active", true);
  if (error) {
    console.warn("[brevo-audiences] load failed:", error.message);
    return [];
  }
  cache = { at: Date.now(), rows: (data ?? []) as AudienceRow[] };
  return cache.rows;
}

export interface AudienceMatch {
  listIds: number[];
  tags: string[];
  labels: string[];
}

export async function resolveBrevoAudiences(a: Args): Promise<AudienceMatch> {
  const rows = await loadRows();
  if (!rows.length) return { listIds: [], tags: [], labels: [] };

  const anySkuSet = new Set<string>();
  const push = (v?: string) => { if (v) anySkuSet.add(String(v).trim()); };
  push(a.hotmartProductId);
  push(a.hotmartProductCode);
  push(a.tiendaSku);
  (a.skus || []).forEach(push);

  const tiendaSkuSet = new Set<string>();
  if (a.tiendaSku) tiendaSkuSet.add(a.tiendaSku);
  (a.skus || []).forEach((s) => s && tiendaSkuSet.add(s));

  const listIds = new Set<number>();
  const tags = new Set<string>();
  const labels = new Set<string>();

  for (const r of rows) {
    if (r.event_kind !== "any" && r.event_kind !== a.eventKind) continue;
    let match = false;
    switch (r.match_type) {
      case "hotmart_product_id":
        match = !!a.hotmartProductId && r.match_value === a.hotmartProductId;
        break;
      case "hotmart_product_code":
        match = !!a.hotmartProductCode && r.match_value === a.hotmartProductCode;
        break;
      case "tienda_sku":
        match = tiendaSkuSet.has(r.match_value);
        break;
      case "category":
        match = !!a.category && r.match_value === a.category;
        break;
      case "any_sku":
        match = anySkuSet.has(r.match_value);
        break;
    }
    if (!match) continue;
    if (Number.isFinite(r.list_id)) listIds.add(r.list_id);
    if (r.tag) tags.add(r.tag);
    if (r.label) labels.add(r.label);
  }

  return { listIds: [...listIds], tags: [...tags], labels: [...labels] };
}

export function invalidateBrevoAudiencesCache() {
  cache = null;
}
