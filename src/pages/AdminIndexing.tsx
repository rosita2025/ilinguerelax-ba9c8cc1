/**
 * Panel de estado de indexación (Google Indexing API / IndexNow / Sitemap / GSC).
 *
 * Muestra por cada URL:
 *  - Estado agregado: Pendiente · Enviado · Validado · Reintentando · Fallido
 *  - Último timestamp por canal y código HTTP
 *  - Historial completo de intentos con fecha/hora (zona Perú, UTC-5)
 *  - Acción de reintento manual (vuelve a disparar Indexing API + IndexNow)
 */
import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { adminInvoke } from "@/lib/adminInvoke";
import AdminNav from "@/components/admin/AdminNav";
import { useAdminKey } from "@/components/admin/AdminGate";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  RefreshCw,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Send,
} from "lucide-react";

type Row = {
  id: string;
  url: string;
  channel: string;
  target: string | null;
  status: string;
  http_status: number | null;
  detail: string | null;
  created_at: string;
};

type UrlState = "validated" | "sent" | "pending" | "retrying" | "failed";

const CHANNEL_LABEL: Record<string, string> = {
  google_indexing: "Google Indexing API",
  indexnow: "IndexNow",
  sitemap_ping: "Sitemap ping",
  gsc_sitemap: "GSC sitemap",
  gsc_inspect: "GSC inspect",
  gsc_request: "GSC request",
};

const STATE_LABEL: Record<UrlState, string> = {
  validated: "Validado",
  sent: "Enviado",
  pending: "Pendiente",
  retrying: "Reintentando",
  failed: "Fallido",
};

const STATE_TONE: Record<UrlState, string> = {
  validated: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  sent: "bg-sky-500/15 text-sky-700 border-sky-500/30",
  pending: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  retrying: "bg-orange-500/15 text-orange-700 border-orange-500/30",
  failed: "bg-rose-500/15 text-rose-700 border-rose-500/30",
};

const PERU_TZ = "America/Lima";

function fmt(ts: string) {
  try {
    return new Date(ts).toLocaleString("es-PE", {
      timeZone: PERU_TZ,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return ts;
  }
}

function relative(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.round(h / 24)} d`;
}

type UrlGroup = {
  url: string;
  state: UrlState;
  latest: string;
  first: string;
  attempts: number;
  errors: number;
  channels: Record<string, Row>;
  history: Row[];
};

/** Deriva el estado agregado por URL a partir del último evento de cada canal. */
function deriveState(latestPerChannel: Row[], errors: number): UrlState {
  if (latestPerChannel.some((r) => r.status === "validated")) return "validated";
  if (latestPerChannel.some((r) => r.status === "sent")) return "sent";
  if (latestPerChannel.some((r) => r.status === "pending")) return "pending";
  // Todo lo último es error: fallido tras 3+ intentos, reintentando antes.
  return errors >= 3 ? "failed" : "retrying";
}

export default function AdminIndexing() {
  const { adminKey } = useAdminKey();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [retrying, setRetrying] = useState<Record<string, boolean>>({});

  async function load() {
    setLoading(true);
    const { data, error } = await adminInvoke<{ rows?: Row[] }>("list-indexing-events", {
      body: { days: 90, limit: 5000 },
    });
    if (error) toast.error("No se pudo cargar el historial de indexación");
    setRows((data?.rows ?? []) as Row[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const groups = useMemo<UrlGroup[]>(() => {
    const byUrl = new Map<string, Row[]>();
    for (const r of rows) {
      if (channelFilter !== "all" && r.channel !== channelFilter) continue;
      const list = byUrl.get(r.url) ?? [];
      list.push(r);
      byUrl.set(r.url, list);
    }
    let list: UrlGroup[] = Array.from(byUrl.entries()).map(([url, events]) => {
      // events ya vienen ordenados desc por created_at
      const channels: Record<string, Row> = {};
      for (const e of events) if (!channels[e.channel]) channels[e.channel] = e;
      const latestPerChannel = Object.values(channels);
      const errors = events.filter((e) => e.status === "error").length;
      return {
        url,
        channels,
        history: events,
        attempts: events.length,
        errors,
        latest: events[0].created_at,
        first: events[events.length - 1].created_at,
        state: deriveState(latestPerChannel, errors),
      };
    });
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((g) => g.url.toLowerCase().includes(q));
    }
    if (stateFilter !== "all") list = list.filter((g) => g.state === stateFilter);
    list.sort((a, b) => new Date(b.latest).getTime() - new Date(a.latest).getTime());
    return list;
  }, [rows, query, channelFilter, stateFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {
      validated: 0,
      sent: 0,
      pending: 0,
      retrying: 0,
      failed: 0,
    };
    for (const g of groups) c[g.state] += 1;
    return c;
  }, [groups]);

  const channelOptions = useMemo(() => {
    const set = new Set(rows.map((r) => r.channel));
    return Array.from(set);
  }, [rows]);

  async function retry(urls: string[], label: string) {
    const key = urls.length === 1 ? urls[0] : "__bulk__";
    if (!adminKey) {
      toast.error("Falta la clave de admin", {
        description: "Ingresa la clave de administrador antes de reintentar.",
      });
      return;
    }
    setRetrying((s) => ({ ...s, [key]: true }));
    try {
      // Se envía en lotes pequeños: un lote grande hace que la función edge
      // consulte cientos de URLs contra Google y la petición muera por timeout
      // ("Failed to send a request to the Edge Function").
      // La función procesa como máximo 10, pero usamos lotes de 5 para que el
      // panel responda rápido incluso si algún motor externo está lento.
      const CHUNK = 5;
      let sent = 0;
      let already = false;
      for (let i = 0; i < urls.length; i += CHUNK) {
        const chunk = urls.slice(i, i + CHUNK);
        const { data, error } = await adminInvoke<{
          sent?: number;
          alreadyRequested?: boolean;
        }>("request-google-indexing", { body: { adminKey, urls: chunk } });
        if (error) throw new Error(error.message);
        sent += data?.sent ?? 0;
        if (data?.alreadyRequested) already = true;
      }
      toast.success(`Reintento enviado (${label})`, {
        description: `URLs enviadas: ${sent}/${urls.length}${already ? " · algunas ya solicitadas antes" : ""}`,
      });
      setTimeout(load, 1500);
    } catch (e) {
      const msg = (e as Error).message || "Error desconocido";
      toast.error("Fallo el reintento", {
        description: /Failed to send|fetch/i.test(msg)
          ? "No se pudo contactar el servicio de indexación. Vuelve a intentarlo en unos segundos."
          : msg,
      });
    } finally {
      setRetrying((s) => ({ ...s, [key]: false }));
    }
  }


  const failedUrls = groups
    .filter((g) => g.state === "failed" || g.state === "retrying")
    .map((g) => g.url)
    .slice(0, 100);

  return (
    <>
      <Helmet>
        <title>Indexación · Admin iLingue Relax</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <AdminNav />
      <main className="p-3 md:p-6 max-w-6xl mx-auto space-y-4">
        <header className="space-y-1">
          <h1 className="text-lg md:text-2xl font-bold">Indexación · Indexing API / IndexNow</h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Estado por URL con historial completo de intentos y horas (zona Perú).
          </p>
        </header>

        <Card className="p-3 md:p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar URL…"
                className="pl-8 h-9 text-sm"
              />
            </div>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="h-9 rounded-md border bg-background px-2 text-sm"
            >
              <option value="all">Todos los canales</option>
              {channelOptions.map((c) => (
                <option key={c} value={c}>
                  {CHANNEL_LABEL[c] ?? c}
                </option>
              ))}
            </select>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="h-9 rounded-md border bg-background px-2 text-sm"
            >
              <option value="all">Todos los estados</option>
              {(Object.keys(STATE_LABEL) as UrlState[]).map((s) => (
                <option key={s} value={s}>
                  {STATE_LABEL[s]}
                </option>
              ))}
            </select>
            <Button size="sm" variant="outline" onClick={load} disabled={loading}>
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
            <Button
              size="sm"
              onClick={() => retry(failedUrls, "fallidos")}
              disabled={!failedUrls.length || !!retrying.__bulk__}
            >
              <Send className="w-3.5 h-3.5 mr-1" />
              Reintentar fallidos ({failedUrls.length})
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] md:text-xs">
            <Badge variant="outline">URLs: {groups.length}</Badge>
            {(Object.keys(STATE_LABEL) as UrlState[]).map((s) => (
              <Badge key={s} className={STATE_TONE[s]}>
                {STATE_LABEL[s]}: {counts[s]}
              </Badge>
            ))}
          </div>
        </Card>

        <Card className="divide-y">
          {loading && groups.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">Cargando…</p>
          )}
          {!loading && groups.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">
              No hay eventos de indexación con estos filtros.
            </p>
          )}
          {groups.map((g) => {
            const open = !!expanded[g.url];
            return (
              <div key={g.url} className="p-3 md:p-4 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setExpanded((s) => ({ ...s, [g.url]: !open }))}
                    className="flex items-center gap-1 text-left min-w-0 flex-1"
                  >
                    {open ? (
                      <ChevronDown className="w-4 h-4 shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 shrink-0" />
                    )}
                    <span className="truncate text-xs md:text-sm font-medium">{g.url}</span>
                  </button>
                  <Badge className={STATE_TONE[g.state]}>{STATE_LABEL[g.state]}</Badge>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                    {fmt(g.latest)} · {relative(g.latest)}
                  </span>
                  <a href={g.url} target="_blank" rel="noreferrer" className="text-muted-foreground">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => retry([g.url], g.url)}
                    disabled={!!retrying[g.url]}
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 mr-1 ${retrying[g.url] ? "animate-spin" : ""}`}
                    />
                    Reintentar
                  </Button>
                </div>

                <div className="flex flex-wrap gap-1.5 pl-5">
                  {Object.entries(g.channels).map(([ch, ev]) => (
                    <span
                      key={ch}
                      className={`rounded border px-1.5 py-0.5 text-[10px] md:text-[11px] ${
                        ev.status === "error"
                          ? STATE_TONE.failed
                          : ev.status === "pending"
                          ? STATE_TONE.pending
                          : ev.status === "validated"
                          ? STATE_TONE.validated
                          : STATE_TONE.sent
                      }`}
                      title={`${fmt(ev.created_at)}${ev.detail ? ` · ${ev.detail}` : ""}`}
                    >
                      {CHANNEL_LABEL[ch] ?? ch}
                      {ev.http_status ? ` · ${ev.http_status}` : ""}
                    </span>
                  ))}
                  <span className="text-[10px] md:text-[11px] text-muted-foreground">
                    {g.attempts} intentos · {g.errors} errores · desde {fmt(g.first)}
                  </span>
                </div>

                {open && (
                  <div className="pl-5 overflow-x-auto">
                    <table className="w-full text-[11px] md:text-xs">
                      <thead className="text-muted-foreground">
                        <tr className="text-left">
                          <th className="py-1 pr-3 font-medium">Fecha (Perú)</th>
                          <th className="py-1 pr-3 font-medium">Canal</th>
                          <th className="py-1 pr-3 font-medium">Estado</th>
                          <th className="py-1 pr-3 font-medium">HTTP</th>
                          <th className="py-1 pr-3 font-medium">Destino</th>
                          <th className="py-1 font-medium">Detalle</th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.history.map((h) => (
                          <tr key={h.id} className="border-t">
                            <td className="py-1 pr-3 whitespace-nowrap">{fmt(h.created_at)}</td>
                            <td className="py-1 pr-3">{CHANNEL_LABEL[h.channel] ?? h.channel}</td>
                            <td className="py-1 pr-3">{h.status}</td>
                            <td className="py-1 pr-3">{h.http_status ?? "—"}</td>
                            <td className="py-1 pr-3 max-w-[160px] truncate">{h.target ?? "—"}</td>
                            <td className="py-1 max-w-[320px] truncate" title={h.detail ?? ""}>
                              {h.detail ?? "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </Card>
      </main>
    </>
  );
}
