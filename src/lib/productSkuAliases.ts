// Unifica los distintos identificadores que puede tener un mismo producto:
// slug corto del checkout (/checkouts/:slug), SKU largo de admin (/products/:sku),
// y slugs legacy de páginas antiguas. Se usa en analíticas para no duplicar filas.
import { CHECKOUT_CATALOG } from "@/config/checkoutCatalog";

const EXTRA_ALIASES: Record<string, string> = {
  // Patrones Especiales (inglés)
  "patrones-ingles": "patrones-especiales-alfabeto-combinaciones-secretas-ingles",
  "patrones-especiales-ingles": "patrones-especiales-alfabeto-combinaciones-secretas-ingles",
  "upsell-patrones-ingles": "patrones-especiales-alfabeto-combinaciones-secretas-ingles",
  "prueba-patrones-es": "patrones-especiales-alfabeto-combinaciones-secretas-ingles",

  // 1.000 Verbos
  "1000-verbos-ingles": "1-000-verbos-esenciales-en-ingles-presente-pasado-futuro-con-pronunciacion",
  "upsell-1000-verbos": "1-000-verbos-esenciales-en-ingles-presente-pasado-futuro-con-pronunciacion",

  // 500 Preguntas
  "500-preguntas-ingles": "500-preguntas-en-ingles-con-pronunciacion-para-hispanohablantes",
  "upsell-500-preguntas": "500-preguntas-en-ingles-con-pronunciacion-para-hispanohablantes",

  // 5.000 / 8.000 palabras
  "5000-spanish-words": "5-000-spanish-words-with-english-pronunciation-digital",
  "product-spanish-5000-digital": "5-000-spanish-words-with-english-pronunciation-digital",
  "product-spanish-5000": "5-000-spanish-words-with-english-pronunciation-digital",
  "5000-palabras-ingles": "5-000-palabras-en-ingles-con-pronunciacion-espanol-y-fonetica-uk-usa",
  "product-5000": "5-000-palabras-en-ingles-con-pronunciacion-espanol-y-fonetica-uk-usa",
  "8000-palabras-ingles": "8-000-palabras-en-ingles-con-pronunciacion-espanol-y-fonetica-uk-usa",
  "product-8000": "8-000-palabras-en-ingles-con-pronunciacion-espanol-y-fonetica-uk-usa",

  // Coreano · 100 mapas mentales
  "coreano-100-mapas": "100-mapas-mentales-para-aprender-coreano-hangul-c1",
  "100-mapas-coreano": "100-mapas-mentales-para-aprender-coreano-hangul-c1",
  "coreano · +100 mapas mentales": "100-mapas-mentales-para-aprender-coreano-hangul-c1",

  // 1.000 palabras esenciales coreano
  "1000-palabras-coreano": "1-000-palabras-esenciales-para-aprender-coreano",
  "coreano-1000-palabras": "1-000-palabras-esenciales-para-aprender-coreano",
  "palabras-coreano": "1-000-palabras-esenciales-para-aprender-coreano",

  // Versión en español (para angloparlantes)
  "500-questions-spanish": "500-questions-in-spanish-with-english-pronunciation",
  "1000-verbs-spanish": "1-000-verbs-in-spanish-past-present-future-with-english-pronunciation",
  "1000-palabras-hispano": "1-000-palabras-en-ingles-con-pronunciacion-espa-ol-con-pronunciacion-hispano",
};

const buildMap = (): Record<string, string> => {
  const map: Record<string, string> = { ...EXTRA_ALIASES };
  for (const [slug, item] of Object.entries(CHECKOUT_CATALOG)) {
    const admin = item.adminSku;
    if (!admin) continue;
    map[slug.toLowerCase()] = admin;
    if (item.id) map[String(item.id).toLowerCase()] = admin;
  }
  return map;
};

const ALIASES = buildMap();

export function canonicalProductId(id: string | null | undefined): string {
  const raw = String(id ?? "").trim();
  if (!raw) return "producto-desconocido";
  return ALIASES[raw.toLowerCase()] || raw;
}

export interface MergeableProductRow {
  product_id: string;
  name?: string | null;
  source?: string;
  hotmart_purchases?: number;
  store_purchases?: number;
  pending?: number;
  hotmart_pending?: number;
  store_pending?: number;
  views?: number;
  carts?: number;
  purchases?: number;
  revenue?: number;
  conversion?: number;
}

export interface MergedProductRow extends Required<Omit<MergeableProductRow, "name" | "source">> {
  name: string | null;
  source: string;
  /** Todos los identificadores/slugs que se fusionaron en esta fila. */
  aliases: string[];
}

const n = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);

/** Fusiona filas de analíticas del mismo producto (slug corto + SKU largo). */
export function mergeProductRows(rows: MergeableProductRow[]): MergedProductRow[] {
  const map = new Map<string, MergedProductRow>();

  for (const r of rows) {
    const key = canonicalProductId(r.product_id);
    const prev = map.get(key);
    const base: MergedProductRow = prev ?? {
      product_id: key,
      name: null,
      source: "none",
      hotmart_purchases: 0,
      store_purchases: 0,
      pending: 0,
      hotmart_pending: 0,
      store_pending: 0,
      views: 0,
      carts: 0,
      purchases: 0,
      revenue: 0,
      conversion: 0,
      aliases: [],
    };

    base.views += n(r.views);
    base.carts += n(r.carts);
    base.purchases += n(r.purchases);
    base.revenue += n(r.revenue);
    base.pending += n(r.pending);
    base.hotmart_pending += n(r.hotmart_pending);
    base.store_pending += n(r.store_pending);
    base.hotmart_purchases += n(r.hotmart_purchases);
    base.store_purchases += n(r.store_purchases);

    // Nombre: preferimos el más descriptivo (más largo y distinto al slug).
    const candidate = (r.name || "").trim();
    if (candidate && candidate !== r.product_id && candidate.length > (base.name?.length ?? 0)) {
      base.name = candidate;
    }

    if (!base.aliases.includes(r.product_id)) base.aliases.push(r.product_id);
    map.set(key, base);
  }

  const out = Array.from(map.values()).map((g) => {
    g.source =
      g.hotmart_purchases > 0 && g.store_purchases > 0
        ? "mixto"
        : g.hotmart_purchases > 0
        ? "hotmart"
        : g.store_purchases > 0 || g.purchases > 0
        ? "store"
        : "none";
    g.conversion = g.views > 0 ? Math.round((g.purchases / g.views) * 1000) / 10 : 0;
    // El SKU largo (admin) va primero en la lista de rutas.
    g.aliases.sort((a, b) => (a === g.product_id ? -1 : b === g.product_id ? 1 : b.length - a.length));
    return g;
  });

  return out.sort(
    (a, b) => b.revenue - a.revenue || b.purchases - a.purchases || b.carts - a.carts || b.views - a.views,
  );
}
