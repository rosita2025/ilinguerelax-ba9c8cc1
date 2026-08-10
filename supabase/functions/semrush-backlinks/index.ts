const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-csrf, x-admin-2fa', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };

const GATEWAY = 'https://connector-gateway.lovable.dev/semrush';

async function sr(path: string, params: Record<string, string>) {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  const SEMRUSH_API_KEY = Deno.env.get('SEMRUSH_API_KEY');
  if (!LOVABLE_API_KEY || !SEMRUSH_API_KEY) throw new Error('Missing Semrush credentials');
  const url = new URL(`${GATEWAY}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'X-Connection-Api-Key': SEMRUSH_API_KEY,
      'Allow-Limit-Offset': 'true',
    },
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`Semrush ${res.status}: ${body}`);
  try { return JSON.parse(body); } catch { return { raw: body }; }
}

function rowsToObjects(payload: any): any[] {
  const cols: string[] = payload?.data?.columnNames || [];
  const rows: any[][] = payload?.data?.rows || [];
  return rows.map((r) => Object.fromEntries(cols.map((c, i) => [c, r[i]])));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { target = 'ilinguerelax.com', target_type = 'root_domain' } = await req.json().catch(() => ({}));

    const [overview, refDomains, backlinks, anchors] = await Promise.all([
      sr('/backlinks/backlinks_overview', {
        target, target_type,
        export_columns: 'ascore,total,domains_num,urls_num,ips_num,follows_num,nofollows_num,texts_num,images_num',
      }).catch((e) => ({ error: String(e) })),
      sr('/backlinks/backlinks_refdomains', {
        target, target_type,
        export_columns: 'domain_ascore,domain,backlinks_num,ip,country,first_seen,last_seen',
        display_limit: '15',
      }).catch((e) => ({ error: String(e) })),
      sr('/backlinks/backlinks', {
        target, target_type,
        export_columns: 'page_ascore,source_url,source_title,target_url,anchor,nofollow,first_seen,last_seen',
        display_limit: '15',
      }).catch((e) => ({ error: String(e) })),
      sr('/backlinks/backlinks_anchors', {
        target, target_type,
        export_columns: 'anchor,domains_num,backlinks_num,first_seen,last_seen',
        display_limit: '15',
      }).catch((e) => ({ error: String(e) })),
    ]);

    return new Response(JSON.stringify({
      overview: 'error' in overview ? overview : rowsToObjects(overview)[0] || {},
      refDomains: 'error' in refDomains ? [] : rowsToObjects(refDomains),
      backlinks: 'error' in backlinks ? [] : rowsToObjects(backlinks),
      anchors: 'error' in anchors ? [] : rowsToObjects(anchors),
      errors: {
        overview: (overview as any).error,
        refDomains: (refDomains as any).error,
        backlinks: (backlinks as any).error,
        anchors: (anchors as any).error,
      },
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
