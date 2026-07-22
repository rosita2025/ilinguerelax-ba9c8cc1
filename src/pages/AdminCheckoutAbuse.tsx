import { useEffect, useState } from "react";
import { Shield, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminInvoke } from "@/lib/adminInvoke";
import { useToast } from "@/hooks/use-toast";
import AdminNav from "@/components/admin/AdminNav";

interface Ban {
  ip: string;
  reason: string;
  banned_until: string;
  ua: string | null;
  hits: number;
  created_at: string;
}

interface StatRow {
  ip: string;
  count: number;
  last: string;
  slugs: string[];
  sources: string[];
  referers: string[];
  ua: string | null;
}

interface SourceRow {
  source: string;
  count: number;
}

const SOURCE_LABEL: Record<string, { label: string; emoji: string; className: string }> = {
  instagram: { label: "Instagram", emoji: "📸", className: "bg-pink-500/10 text-pink-600 border-pink-500/30" },
  facebook: { label: "Facebook", emoji: "👤", className: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
  tiktok: { label: "TikTok", emoji: "🎵", className: "bg-black/10 text-foreground border-foreground/30" },
  whatsapp: { label: "WhatsApp", emoji: "💬", className: "bg-green-500/10 text-green-600 border-green-500/30" },
  telegram: { label: "Telegram", emoji: "✈️", className: "bg-sky-500/10 text-sky-600 border-sky-500/30" },
  threads: { label: "Threads", emoji: "🧵", className: "bg-neutral-500/10 text-neutral-600 border-neutral-500/30" },
  youtube: { label: "YouTube", emoji: "▶️", className: "bg-red-500/10 text-red-600 border-red-500/30" },
  google: { label: "Google", emoji: "🔎", className: "bg-yellow-500/10 text-yellow-700 border-yellow-500/30" },
  "google-app": { label: "Google App", emoji: "🔎", className: "bg-yellow-500/10 text-yellow-700 border-yellow-500/30" },
  bing: { label: "Bing", emoji: "🔎", className: "bg-cyan-500/10 text-cyan-700 border-cyan-500/30" },
  duckduckgo: { label: "DuckDuckGo", emoji: "🦆", className: "bg-orange-500/10 text-orange-700 border-orange-500/30" },
  yandex: { label: "Yandex", emoji: "🔎", className: "bg-red-500/10 text-red-600 border-red-500/30" },
  email: { label: "Correo", emoji: "✉️", className: "bg-indigo-500/10 text-indigo-600 border-indigo-500/30" },
  internal: { label: "Interno", emoji: "🏠", className: "bg-primary/10 text-primary border-primary/30" },
  direct: { label: "Directo / desconocido", emoji: "🔗", className: "bg-muted text-muted-foreground border-border" },
  line: { label: "LINE", emoji: "💚", className: "bg-green-500/10 text-green-600 border-green-500/30" },
  kakao: { label: "KakaoTalk", emoji: "💛", className: "bg-yellow-500/10 text-yellow-700 border-yellow-500/30" },
};

function SourceBadge({ source }: { source: string }) {
  const s = SOURCE_LABEL[source] || { label: source, emoji: "🌐", className: "bg-muted text-muted-foreground border-border" };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${s.className}`}>
      <span aria-hidden>{s.emoji}</span>{s.label}
    </span>
  );
}

export default function AdminCheckoutAbuse() {
  const { toast } = useToast();
  const [bans, setBans] = useState<Ban[]>([]);
  const [top, setTop] = useState<StatRow[]>([]);
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [b, s] = await Promise.all([
        adminInvoke("manage-checkout-abuse", { body: { action: "list_bans" } }),
        adminInvoke("manage-checkout-abuse", { body: { action: "stats" } }),
      ]);
      if (b.error) throw b.error;
      if (s.error) throw s.error;
      setBans(((b.data as { bans?: Ban[] } | null)?.bans) ?? []);
      const stats = s.data as { top?: StatRow[]; sources?: SourceRow[] } | null;
      setTop(stats?.top ?? []);
      setSources(stats?.sources ?? []);
    } catch {
      toast({ title: "Error al cargar datos", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const iv = setInterval(() => { void load(); }, 30000);
    return () => clearInterval(iv);
  }, []);

  const unban = async (ip: string) => {
    if (!confirm(`¿Desbloquear IP ${ip}?`)) return;
    try {
      const { error } = await adminInvoke("manage-checkout-abuse", { body: { action: "unban", ip } });
      if (error) throw error;
      toast({ title: "IP desbloqueada" });
      void load();
    } catch {
      toast({ title: "Error al desbloquear", variant: "destructive" });
    }
  };

  const activeBans = bans.filter((b) => new Date(b.banned_until) > new Date());

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Checkout · anti-abuso
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Rate limiting server-side por IP. Máx 20 accesos / 10 min → ban de 30 min.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refrescar
          </Button>
        </div>

        <section className="border rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-muted/40 border-b flex items-center justify-between">
            <h2 className="font-semibold">IPs bloqueadas ({activeBans.length})</h2>
          </div>
          {activeBans.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground text-center">
              No hay IPs bloqueadas ahora mismo.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/20 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-left px-3 py-2">IP</th>
                    <th className="text-left px-3 py-2">Motivo</th>
                    <th className="text-left px-3 py-2">Hits</th>
                    <th className="text-left px-3 py-2">Hasta</th>
                    <th className="text-left px-3 py-2">User Agent</th>
                    <th className="text-right px-3 py-2">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {activeBans.map((b) => (
                    <tr key={b.ip} className="border-t">
                      <td className="px-3 py-2 font-mono">{b.ip}</td>
                      <td className="px-3 py-2">{b.reason}</td>
                      <td className="px-3 py-2">{b.hits}</td>
                      <td className="px-3 py-2">{new Date(b.banned_until).toLocaleString()}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground truncate max-w-[280px]" title={b.ua || ""}>
                        {b.ua?.slice(0, 60) || "—"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Button variant="ghost" size="sm" onClick={() => void unban(b.ip)}>
                          <Trash2 className="h-4 w-4 mr-1" /> Desbloquear
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="border rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-muted/40 border-b">
            <h2 className="font-semibold">Origen del tráfico · últimas 24 h</h2>
            <p className="text-xs text-muted-foreground mt-1">
              De dónde vienen los visitantes que abren el checkout. Instagram/Facebook = humanos reales desde anuncios.
            </p>
          </div>
          {sources.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground text-center">Sin actividad reciente.</p>
          ) : (
            <div className="p-4 flex flex-wrap gap-2">
              {sources.map((s) => (
                <div key={s.source} className="flex items-center gap-2">
                  <SourceBadge source={s.source} />
                  <span className="font-mono text-sm">{s.count}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="border rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-muted/40 border-b">
            <h2 className="font-semibold">Top IPs · últimas 24 h</h2>
          </div>
          {top.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground text-center">Sin actividad reciente.</p>
          ) : (
            <div className="divide-y">
              {top.map((r) => (
                <div key={r.ip} className="p-3 space-y-2">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm">{r.ip}</span>
                      {(r.sources.length ? r.sources : ["direct"]).map((s) => (
                        <SourceBadge key={s} source={s} />
                      ))}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className={`font-semibold ${r.count > 20 ? "text-destructive" : "text-foreground"}`}>{r.count} hits</span>
                      <span>{new Date(r.last).toLocaleString()}</span>
                    </div>
                  </div>
                  {r.slugs.length > 0 && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Productos: </span>
                      <span className="text-foreground">{r.slugs.join(", ")}</span>
                    </div>
                  )}
                  {r.referers.length > 0 && (
                    <div className="text-xs space-y-1">
                      <span className="text-muted-foreground">URLs de origen:</span>
                      {r.referers.map((u, i) => (
                        <a
                          key={i}
                          href={u}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-primary hover:underline truncate max-w-full"
                          title={u}
                        >
                          {u}
                        </a>
                      ))}
                    </div>
                  )}
                  {r.ua && (
                    <div className="text-[10px] text-muted-foreground truncate" title={r.ua}>
                      {r.ua}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
