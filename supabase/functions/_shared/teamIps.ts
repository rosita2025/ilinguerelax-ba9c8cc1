// IPs del equipo: cada vez que alguien usa el panel admin (autenticado) se guarda su IP en `bot_filters`
// (kind = 'ip', nota "Equipo (admin)"). Así sus visitas de prueba dejan de contarse en el checkout, los funnels
// y las visitas en vivo, aunque entre desde otro navegador o desde otro país (VPN). Las IPs del equipo
// que llevan más de 30 días sin entrar al panel se retiran solas.
// El cliente puede venir de distintas versiones de supabase-js según la función que llame.
// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

const TEAM_NOTE = "Equipo (admin)";
const TTL_MS = 30 * 24 * 3600 * 1000;
const seenThisInstance = new Map<string, number>();

export function callerIp(req: Request): string | null {
  const xff = req.headers.get("x-forwarded-for") || "";
  const ip = xff.split(",")[0]?.trim() || req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || "";
  if (!ip || ip === "unknown" || ip.startsWith("127.") || ip.startsWith("10.") || ip.startsWith("192.168.")) return null;
  return ip.slice(0, 60);
}

/** Llamar solo cuando la petición ya pasó la autenticación de admin. Nunca rompe la petición. */
export async function registerTeamIp(admin: SupabaseClient, req: Request): Promise<void> {
  try {
    const ip = callerIp(req);
    if (!ip) return;
    const now = Date.now();
    if ((seenThisInstance.get(ip) ?? 0) > now - 10 * 60 * 1000) return;
    seenThisInstance.set(ip, now);

    const { data: existing } = await admin.from("bot_filters").select("id, note").eq("pattern", ip).maybeSingle();
    if (!existing) {
      await admin.from("bot_filters").insert({ pattern: ip, kind: "ip", enabled: true, note: TEAM_NOTE });
    } else if (String((existing as { note?: string }).note ?? "").startsWith(TEAM_NOTE)) {
      await admin.from("bot_filters").update({ enabled: true, updated_at: new Date().toISOString() }).eq("id", (existing as { id: string }).id);
    }
    // Limpieza: IPs del equipo sin uso en 30 días.
    await admin.from("bot_filters").delete().eq("kind", "ip").like("note", `${TEAM_NOTE}%`).lt("updated_at", new Date(now - TTL_MS).toISOString());
  } catch (e) {
    console.warn("[teamIps] no se pudo registrar la IP del equipo:", (e as Error).message);
  }
}

/** Todas las IPs excluidas (equipo + las que el admin haya puesto a mano en bot_filters). */
let excludedCache: { ips: Set<string>; expires: number } = { ips: new Set(), expires: 0 };
export async function loadExcludedIps(admin: SupabaseClient): Promise<Set<string>> {
  if (Date.now() < excludedCache.expires) return excludedCache.ips;
  try {
    const { data } = await admin.from("bot_filters").select("pattern").eq("kind", "ip").eq("enabled", true);
    const ips = new Set(((data ?? []) as { pattern: string }[]).map((r) => String(r.pattern).trim()).filter(Boolean));
    excludedCache = { ips, expires: Date.now() + 60_000 };
    return ips;
  } catch {
    return excludedCache.ips;
  }
}
