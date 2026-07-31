/**
 * Registro de eventos de indexación por URL.
 *
 * Muestra por cada URL el estado agregado (Pendiente / Enviado / Validado /
 * Error) y el timestamp más reciente por canal (IndexNow, Sitemap ping,
 * GSC sitemap, GSC inspect, GSC request). Los eventos los emiten las
 * funciones edge sitemap-notify, request-google-indexing y generate-blog-post
 * cada vez que notifican a un buscador.
 */
import { useEffect, useMemo, useState } from "react";
import { adminInvoke } from "@/lib/adminInvoke";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

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

const CHANNEL_LABEL: Record<string, string> = {
  indexnow: "IndexNow",
  sitemap_ping: "Sitemap ping",
  gsc_sitemap: "GSC sitemap",
  gsc_inspect: "GSC inspect",
  gsc_request: "GSC request",
};

const STATUS_TONE: Record<string, string> = {
  validated: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  sent: "bg-sky-500/15 text-sky-700 border-sky-500/30",
  pending: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  error: "bg-rose-500/15 text-rose-700 border-rose-500/30",
};

function rank(status: string): number {
  return status === "validated" ? 3 : status === "sent" ? 2 : status === "pending" ? 1 : 0;
}

export default function IndexingEventsCard() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("all");

  async function load() {
    setLoading(true);
    const { data } = await adminInvoke<{ rows?: Row[] }>("list-indexing-events", {
      body: { days: 90, limit: 2000 },
    });
    setRows((data?.rows ?? []) as Row[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  // Group by URL, keeping the most recent event per channel + a global status.
  const grouped = useMemo(() => {
    const byUrl = new Map<
      string,
      { url: string; latest: string; best: string; channels: Record<string, Row> }
    >();
    for (const r of rows) {
      if (channelFilter !== "all" && r.channel !== channelFilter) continue;
      const entry =
        byUrl.get(r.url) ??
        { url: r.url, latest: r.created_at, best: r.status, channels: {} as Record<string, Row> };
      if (!entry.channels[r.channel]) entry.channels[r.channel] = r;
      if (new Date(r.created_at) > new Date(entry.latest)) entry.latest = r.created_at;
      if (rank(r.status) > rank(entry.best)) entry.best = r.status;
      byUrl.set(r.url, entry);
    }
    let list = Array.from(byUrl.values());
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((e) => e.url.toLowerCase().includes(q));
    }
    list.sort((a, b) => new Date(b.latest).getTime() - new Date(a.latest).getTime());
    return list;
  }, [rows, query, channelFilter]);

  const counts = useMemo(() => {
    const c = { validated: 0, sent: 0, pending: 0, error: 0, urls: grouped.length };
    for (const g of grouped) (c as Record<string, number>)[g.best] = (c as Record<string, number>)[g.best] + 1 || 1;
    return c;
  }, [grouped]);

  return (
    <Card className="p-4 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-sm md:text-base">Estado de indexación por URL</h3>
          <p className="text-[11px] md:text-xs text-muted-foreground mt-0.5">
            Registro automático de cada ping (IndexNow, sitemap, GSC) con fecha y estado.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11px] md:text-xs">
        <Badge variant="outline">URLs: {counts.urls}</Badge>
        <Badge className={STATUS_TONE.validated}>Validado: {counts.validated}</Badge>
        <Badge className={STATUS_TONE.sent}>Enviado: {counts.sent}</Badge>
        <Badge className={STATUS_TONE.pending}>Pendiente: {counts.pending}</Badge>
        <Badge className={STATUS_TONE.error}>Error: {counts.error}</Badge>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar URL…"
            className="h-8 pl-7 text-xs"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {(["all", ...Object.keys(CHANNEL_LABEL)] as const).map((c) => (
            <Button
              key={c}
              size="sm"
              variant={channelFilter === c ? "default" : "outline"}
              className="h-7 text-[11px] px-2"
              onClick={() => setChannelFilter(c)}
            >
              {c === "all" ? "Todos" : CHANNEL_LABEL[c]}
            </Button>
          ))}
        </div>
      </div>

      {grouped.length === 0 ? (
        <p className="text-xs text-muted-foreground py-6 text-center">
          Aún no hay eventos registrados. Ejecuta "Notificar Google + IndexNow" o publica un post nuevo.
        </p>
      ) : (
        <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
          {grouped.slice(0, 200).map((g) => (
            <div
              key={g.url}
              className="border rounded-md p-2.5 space-y-1.5 bg-background/50"
            >
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <a
                  href={g.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] md:text-xs font-mono break-all hover:underline flex-1 min-w-0"
                >
                  {g.url}
                </a>
                <Badge className={`${STATUS_TONE[g.best] ?? ""} shrink-0`}>
                  {g.best === "validated"
                    ? "Validado"
                    : g.best === "sent"
                    ? "Enviado"
                    : g.best === "pending"
                    ? "Pendiente"
                    : "Error"}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1.5 text-[10px] md:text-[11px]">
                {Object.entries(g.channels)
                  .sort((a, b) => new Date(b[1].created_at).getTime() - new Date(a[1].created_at).getTime())
                  .map(([ch, ev]) => (
                    <span
                      key={ch}
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border ${
                        STATUS_TONE[ev.status] ?? ""
                      }`}
                      title={`${ev.target ?? ""} · HTTP ${ev.http_status ?? "?"}${
                        ev.detail ? ` · ${ev.detail}` : ""
                      }`}
                    >
                      {CHANNEL_LABEL[ch] ?? ch}
                      {" · "}
                      {formatDistanceToNow(new Date(ev.created_at), { addSuffix: true, locale: es })}
                    </span>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
