import { assertAdminCsrf } from "../_shared/adminCsrf.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-csrf",
};

const GATEWAY = "https://connector-gateway.lovable.dev/semrush";
const DOMAIN = "ilinguerelax.com";

async function gwGet(path: string, params: Record<string, string>) {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const smKey = Deno.env.get("SEMRUSH_API_KEY");
  if (!lovableKey || !smKey) throw new Error("SEMRUSH_NOT_CONNECTED");
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${GATEWAY}${path}?${qs}`, {
    headers: {
      "Authorization": `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": smKey,
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Semrush ${res.status}: ${text}`);
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

function rowsToObjects(data: any): any[] {
  const cols: string[] = data?.data?.columnNames ?? [];
  const rows: any[][] = data?.data?.rows ?? [];
  return rows.map((r) => Object.fromEntries(cols.map((c, i) => [c, r[i]])));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const csrfBlock = assertAdminCsrf(req);
  if (csrfBlock) return csrfBlock;
  try {
    const { adminKey, database = "us", limit = 25 } = await req.json().catch(() => ({}));
    const expected = Deno.env.get("ADMIN_REVIEW_KEY");
    if (!expected || adminKey !== expected) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const safeLimit = String(Math.min(Math.max(parseInt(String(limit)) || 25, 1), 50));

    const [overview, organic, backlinks] = await Promise.all([
      gwGet("/domains/domain_ranks", {
        domain: DOMAIN, database,
        export_columns: "Db,Dn,Rk,Or,Ot,Oc,Ad,At,Ac",
      }).catch((e) => ({ error: String(e.message) })),
      gwGet("/domains/domain_organic", {
        domain: DOMAIN, database, display_limit: safeLimit,
        export_columns: "Ph,Po,Nq,Cp,Tr,Ur,Kd",
      }).catch((e) => ({ error: String(e.message) })),
      gwGet("/backlinks/backlinks_overview", {
        target: DOMAIN, target_type: "root_domain",
        export_columns: "ascore,total,domains_num,urls_num,ips_num,follows_num,nofollows_num",
      }).catch((e) => ({ error: String(e.message) })),
    ]);

    return new Response(JSON.stringify({
      domain: DOMAIN, database,
      overview: (overview as any).error ? overview : rowsToObjects(overview)[0] ?? null,
      organic: (organic as any).error ? organic : rowsToObjects(organic),
      backlinks: (backlinks as any).error ? backlinks : rowsToObjects(backlinks)[0] ?? null,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  } catch (err) {
    const msg = String((err as Error).message ?? err);
    const notConnected = msg.includes("SEMRUSH_NOT_CONNECTED");
    return new Response(JSON.stringify({
      error: notConnected ? "Semrush no está conectado. Conecta Semrush desde Connectors." : msg,
      notConnected,
    }), { status: notConnected ? 400 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
