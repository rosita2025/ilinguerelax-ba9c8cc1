// Utilidades compartidas para los enlaces de descarga por pedido (/mi-descarga).
export const dlCors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-delivery-source",
};

export const dlJson = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...dlCors, "Content-Type": "application/json" } });

export const canonicalEmail = (raw: unknown) => String(raw ?? "").trim().toLowerCase();

/** Token aleatorio de 32 bytes en base64url (no adivinable). */
export function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export const TOKEN_RE = /^[A-Za-z0-9_-]{20,120}$/;

/** Enmascara el correo para mostrarlo sin exponerlo: ma***@gmail.com */
export function maskEmail(email: string): string {
  const [local, domain] = String(email ?? "").split("@");
  if (!domain) return "";
  const head = local.slice(0, 2);
  return `${head}${"*".repeat(Math.max(1, local.length - 2))}@${domain}`;
}

export type BonusLike = { title?: string; name?: string; drive_url?: string; url?: string; access_key?: string };

export function bonusList(row: Record<string, unknown>): BonusLike[] {
  const out: BonusLike[] = [];
  const raw = row?.bonuses;
  if (Array.isArray(raw)) {
    for (const b of raw as BonusLike[]) {
      if (b && (b.drive_url || b.url)) out.push(b);
    }
  }
  if (row?.bonus_drive_url) {
    out.push({
      title: String(row?.bonus_name ?? "Bono"),
      drive_url: String(row.bonus_drive_url),
      access_key: row?.bonus_access_key ? String(row.bonus_access_key) : undefined,
    });
  }
  return out;
}
