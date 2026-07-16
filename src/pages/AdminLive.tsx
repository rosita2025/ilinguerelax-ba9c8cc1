import { useEffect, useState } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { Card } from "@/components/ui/card";
import { Activity, Bot, CreditCard, Eye, Globe, Loader2, MousePointerClick, ShoppingBag, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminNav from "@/components/admin/AdminNav";
import { useAdminKey } from "@/components/admin/AdminGate";
import { getCountryInfo } from "@/lib/countryInfo";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface Visitor {
  session_id: string;
  country: string | null;
  page_path: string | null;
  referrer: string | null;
  source: string;
  source_channel: string;
  last_seen: string;
  event_count: number;
  last_event: string;
  product_id: string | null;
  product_name: string;
}
interface RecentEvent {
  session_id: string | null;
  country: string | null;
  page_path: string | null;
  page_label: string;
  source: string;
  source_channel: string;
  event_name: string;
  product_id: string | null;
  product_name: string;
  value: number | null;
  currency: string | null;
  created_at: string;
}
interface BotRecent {
  session_id: string | null;
  country: string | null;
  page_path: string | null;
  event_name: string;
  bot_reason: string | null;
  user_agent: string | null;
  created_at: string;
}
interface LiveData {
  windowMinutes: number;
  total: number;
  activeNow: number;
  productViews: number;
  checkouts: number;
  checkoutSessions: number;
  purchases: number;
  purchaseSessions: number;
  revenue: number;
  byCountry: Record<string, number>;
  byPage: Record<string, number>;
  byPageLabel: Record<string, number>;
  byProduct: Record<string, number>;
  bySource: Record<string, number>;
  byChannel: Record<string, number>;
  byCampaign: Record<string, number>;
  bySourceCountry: Record<string, Record<string, number>>;
  byEvent: Record<string, number>;
  revenueByCountry: Record<string, number>;
  visitors: Visitor[];
  recentEvents: RecentEvent[];
  bots?: {
    events: number;
    sessions: number;
    byReason: Record<string, number>;
    byCountry: Record<string, number>;
    recent: BotRecent[];
  };
  generatedAt: string;
}

const timeAgo = (iso: string) => {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h`;
};

const eventLabel: Record<string, string> = {
  PageView: "visitó página",
  ViewContent: "vio producto",
  AddToCart: "agregó carrito",
  InitiateCheckout: "continuó a pago",
  BeginCheckout: "inició checkout",
  Purchase: "compró",
  PaymentError: "falló pago",
  Lead: "dejó contacto",
};

const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const AdminLive = () => {
  const { adminKey } = useAdminKey();
  const [data, setData] = useState<LiveData | null>(null);
  const [loading, setLoading] = useState(false);
  const [windowMin, setWindowMin] = useState<1 | 5 | 15 | 60>(1);

  const load = async () => {
    setLoading(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("live-visitors", {
        body: { adminKey, windowMinutes: windowMin },
      });
      if (error) throw error;
      if ((res as { error?: string })?.error) { toast.error((res as { error: string }).error); return; }
      setData(res as LiveData);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [adminKey, windowMin]);
  useEffect(() => {
    if (!data) return;
    const id = setInterval(() => { void load(); }, 5000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, adminKey, windowMin]);

  if (!data) {
    return (
      <>
        <AdminNav />
        <main className="min-h-dvh bg-background flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </main>
      </>
    );
  }

  const countries = Object.entries(data.byCountry).sort(([, a], [, b]) => b - a);
  const maxCount = Math.max(1, ...countries.map(([, v]) => v));
  const markers = countries
    .map(([code, count]) => {
      const info = getCountryInfo(code);
      if (!info) return null;
      return { code, count, ...info };
    })
    .filter(Boolean) as Array<{ code: string; count: number; name: string; flag: string; coords: [number, number] }>;

  const radius = (count: number) => 4 + (count / maxCount) * 14;
  const totalForPct = Math.max(1, data.total);
  const topPages = Object.entries(data.byPageLabel || data.byPage).sort(([, a], [, b]) => b - a).slice(0, 12);
  const topProducts = Object.entries(data.byProduct || {}).sort(([, a], [, b]) => b - a).slice(0, 12);
  const topChannels = Object.entries(data.byChannel || {}).sort(([, a], [, b]) => b - a);
  const topSources = Object.entries(data.bySource || {}).sort(([, a], [, b]) => b - a);
  const topCampaigns = Object.entries(data.byCampaign || {}).sort(([, a], [, b]) => b - a).slice(0, 8);
  const totalSourceVisitors = Math.max(1, topSources.reduce((a, [, n]) => a + n, 0));

  return (
    <>
      <AdminNav />
      <main className="min-h-dvh bg-background p-3 md:p-8">
        <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 md:gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg md:text-3xl font-bold flex items-center gap-2">
                <Globe className="w-5 h-5 md:w-7 md:h-7 text-primary shrink-0" /> Plataforma en vivo
              </h1>
              <p className="text-[11px] md:text-sm text-muted-foreground leading-snug mt-0.5">
                Humanos · ventana {windowMin < 60 ? `${windowMin} min` : "1 hora"} · {timeAgo(data.generatedAt)} atrás
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-primary/10 border border-primary/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                <Users className="w-3.5 h-3.5 text-primary" />
                <span className="text-base md:text-lg font-bold tabular-nums">{data.activeNow || data.total}</span>
                <span className="text-[10px] md:text-xs text-muted-foreground">en vivo</span>
              </div>
              <div className="inline-flex rounded-md border bg-background overflow-hidden">
                {([1, 5, 15, 60] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setWindowMin(m)}
                    className={`px-2.5 md:px-3 h-8 md:h-9 text-xs md:text-sm transition-colors ${
                      windowMin === m
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                    title={`Últimos ${m} min · humanos (bots excluidos)`}
                  >
                    {m < 60 ? `${m}m` : "1h"}
                  </button>
                ))}
              </div>
              {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            </div>
          </div>

          <div className="grid gap-2 md:gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { label: "Visitantes", value: data.total.toLocaleString(), sub: "ahora mismo", icon: Users },
              { label: "Vistas producto", value: (data.productViews || 0).toLocaleString(), sub: "ViewContent", icon: Eye },
              { label: "Continuar pago", value: (data.checkouts || 0).toLocaleString(), sub: `${data.checkoutSessions || 0} sesiones`, icon: CreditCard },
              { label: "Compras", value: (data.purchases || 0).toLocaleString(), sub: `${data.purchaseSessions || 0} sesiones`, icon: ShoppingBag },
              { label: "Ingresos", value: money(data.revenue || 0), sub: "rastreados", icon: Activity },
            ].map(({ label, value, sub, icon: Icon }) => (
              <Card key={label} className="p-3 md:p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[10px] md:text-xs text-muted-foreground truncate">{label}</div>
                    <div className="text-lg md:text-2xl font-bold tabular-nums mt-0.5 md:mt-1">{value}</div>
                    <div className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1 truncate">{sub}</div>
                  </div>
                  <Icon className="w-4 h-4 md:w-5 md:h-5 text-primary shrink-0" />
                </div>
              </Card>
            ))}
          </div>


          <div className="grid gap-4 lg:grid-cols-[1.45fr_0.75fr]">
            <Card className="p-2 md:p-4 overflow-hidden">
              <ComposableMap
                projectionConfig={{ scale: 140 }}
                width={980}
                height={460}
                style={{ width: "100%", height: "auto" }}
              >
                <Geographies geography={GEO_URL}>
                  {({ geographies }) =>
                    geographies.map((geo) => (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        style={{
                          default: { fill: "hsl(var(--muted))", stroke: "hsl(var(--border))", strokeWidth: 0.5, outline: "none" },
                          hover: { fill: "hsl(var(--muted))", outline: "none" },
                          pressed: { fill: "hsl(var(--muted))", outline: "none" },
                        }}
                      />
                    ))
                  }
                </Geographies>
                {markers.map((m) => (
                  <Marker key={m.code} coordinates={m.coords}>
                    <circle
                      r={radius(m.count)}
                      fill="hsl(var(--primary))"
                      fillOpacity={0.35}
                      stroke="hsl(var(--primary))"
                      strokeWidth={1.5}
                    >
                      <animate attributeName="r" values={`${radius(m.count)};${radius(m.count) + 3};${radius(m.count)}`} dur="2s" repeatCount="indefinite" />
                    </circle>
                    <text textAnchor="middle" y={-radius(m.count) - 4} style={{ fontSize: 10, fontWeight: 700, fill: "hsl(var(--foreground))" }}>
                      {m.count}
                    </text>
                  </Marker>
                ))}
              </ComposableMap>
            </Card>

            <Card className="p-4">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <MousePointerClick className="w-4 h-4" /> Eventos ahora
              </h2>
              <div className="space-y-2">
                {Object.entries(data.byEvent || {}).sort(([, a], [, b]) => b - a).map(([event, count]) => {
                  const pct = (count / Math.max(1, Object.values(data.byEvent || {}).reduce((a, b) => a + b, 0))) * 100;
                  return (
                    <div key={event}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{eventLabel[event] || event}</span>
                        <span className="tabular-nums text-muted-foreground">{count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${Math.max(pct, 4)}%` }} />
                      </div>
                    </div>
                  );
                })}
                {Object.keys(data.byEvent || {}).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">Sin eventos reales todavía.</p>
                )}
              </div>
            </Card>
          </div>

          <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4" /> Por país
              </h2>
              <div className="space-y-2 max-h-[280px] md:max-h-[420px] overflow-y-auto">
                {countries.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">Sin visitas en esta ventana.</p>
                )}
                {countries.map(([code, count]) => {
                  const info = getCountryInfo(code);
                  const pct = (count / totalForPct) * 100;
                  return (
                    <div key={code} className="flex items-center gap-3">
                      <span className="text-xl w-7 text-center">{info?.flag || "🌐"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium truncate">{info?.name || code}</span>
                          <span className="tabular-nums text-muted-foreground">{count}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${Math.max(pct, 3)}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="p-4">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4" /> Páginas activas
              </h2>
              <div className="space-y-2 max-h-[280px] md:max-h-[420px] overflow-y-auto text-sm">
                {topPages.map(([path, n]) => (
                  <div key={path} className="flex justify-between border-b last:border-0 pb-1 gap-3">
                    <span className="truncate" title={path}>{path}</span>
                    <span className="tabular-nums text-muted-foreground">{n}</span>
                  </div>
                ))}
                {topPages.length === 0 && (
                  <p className="text-muted-foreground text-center py-6">Sin páginas.</p>
                )}
              </div>
            </Card>

            <Card className="p-4">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" /> Productos en vivo
              </h2>
              <div className="space-y-2 max-h-[280px] md:max-h-[420px] overflow-y-auto text-sm">
                {topProducts.map(([product, n]) => (
                  <div key={product} className="flex justify-between border-b last:border-0 pb-1 gap-3">
                    <span className="truncate" title={product}>{product}</span>
                    <span className="tabular-nums text-muted-foreground">{n}</span>
                  </div>
                ))}
                {topProducts.length === 0 && (
                  <p className="text-muted-foreground text-center py-6">Sin productos activos.</p>
                )}
              </div>
            </Card>

            <Card className="p-4">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4" /> Canal
              </h2>
              <div className="space-y-2 max-h-[280px] md:max-h-[420px] overflow-y-auto text-sm">
                {topChannels.slice(0, 8).map(([source, n]) => (
                  <div key={source} className="flex justify-between border-b last:border-0 pb-1 gap-3">
                    <span className="truncate" title={source}>{source}</span>
                    <span className="tabular-nums text-muted-foreground">{n}</span>
                  </div>
                ))}
                {topChannels.length === 0 && (
                  <p className="text-muted-foreground text-center py-6">Sin canal.</p>
                )}
              </div>
            </Card>
          </div>

          <Card className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <h2 className="font-semibold flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" /> Fuentes de tráfico en vivo
              </h2>
              <span className="text-xs text-muted-foreground">
                Referer · canal · campaña · país · {totalSourceVisitors} visitantes clasificados
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {/* Fuente (referer) */}
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2">Por fuente (referer)</div>
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto text-sm">
                  {topSources.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">Sin fuentes.</p>
                  )}
                  {topSources.slice(0, 12).map(([source, n]) => {
                    const pct = Math.round((n / totalSourceVisitors) * 100);
                    const countries = Object.entries(data.bySourceCountry?.[source] || {})
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 3)
                      .map(([c]) => getCountryInfo(c)?.flag || c)
                      .join(" ");
                    return (
                      <div key={source} className="border-b last:border-0 pb-1.5">
                        <div className="flex justify-between gap-3">
                          <span className="truncate font-medium" title={source}>{source}</span>
                          <span className="tabular-nums text-muted-foreground shrink-0">{n} · {pct}%</span>
                        </div>
                        {countries && (
                          <div className="text-xs text-muted-foreground mt-0.5">{countries}</div>
                        )}
                        <div className="h-1 bg-muted rounded mt-1 overflow-hidden">
                          <div className="h-full bg-primary/70" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Canal */}
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2">Por canal</div>
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto text-sm">
                  {topChannels.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">Sin canales.</p>
                  )}
                  {topChannels.map(([ch, n]) => {
                    const pct = Math.round((n / totalSourceVisitors) * 100);
                    return (
                      <div key={ch} className="border-b last:border-0 pb-1.5">
                        <div className="flex justify-between gap-3">
                          <span className="truncate" title={ch}>{ch}</span>
                          <span className="tabular-nums text-muted-foreground shrink-0">{n} · {pct}%</span>
                        </div>
                        <div className="h-1 bg-muted rounded mt-1 overflow-hidden">
                          <div className="h-full bg-emerald-500/70" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Campaña */}
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2">Por campaña (utm_campaign)</div>
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto text-sm">
                  {topCampaigns.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">Sin campañas activas.<br/>Añade <code className="text-[10px]">?utm_source=facebook&amp;utm_campaign=verano</code> a tus enlaces.</p>
                  )}
                  {topCampaigns.map(([cmp, n]) => (
                    <div key={cmp} className="flex justify-between border-b last:border-0 pb-1 gap-3">
                      <span className="truncate" title={cmp}>{cmp}</span>
                      <span className="tabular-nums text-muted-foreground shrink-0">{n}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>


          <Card className="p-4">
            <h2 className="font-semibold mb-3">Feed real en vivo</h2>
            <div className="space-y-1 max-h-[400px] overflow-y-auto text-sm">
              {(data.recentEvents || []).length === 0 && (
                <p className="text-muted-foreground text-center py-6">Sin eventos reales ahora mismo.</p>
              )}
              {(data.recentEvents || []).map((event, index) => {
                const info = getCountryInfo(event.country);
                return (
                  <div key={`${event.created_at}-${index}`} className="flex items-center gap-3 py-1.5 border-b last:border-0">
                    <span className="text-lg w-6 text-center">{info?.flag || "🌐"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="truncate">
                        <span className="font-medium">{info?.name || event.country || "—"}</span>
                        <span className="text-muted-foreground"> · {eventLabel[event.event_name] || event.event_name}</span>
                        {event.value ? <span className="font-semibold"> · {money(event.value)}</span> : null}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {event.product_name !== "Sin producto" ? `${event.product_name} · ` : ""}{event.page_label} · {event.source_channel} · {event.source}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums shrink-0">{timeAgo(event.created_at)}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          {data.bots && (data.bots.events > 0 || data.bots.sessions > 0) && (
            <Card className="p-4 border-amber-500/30 bg-amber-500/5">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <h2 className="font-semibold flex items-center gap-2">
                  <Bot className="w-4 h-4 text-amber-600" /> Bots detectados
                </h2>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span><b className="text-foreground tabular-nums">{data.bots.sessions}</b> sesiones</span>
                  <span><b className="text-foreground tabular-nums">{data.bots.events}</b> eventos</span>
                  <span className="text-emerald-600">Humanos: <b className="tabular-nums">{data.activeNow || data.total}</b></span>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-2">Motivo de detección</div>
                  <div className="space-y-1.5">
                    {Object.entries(data.bots.byReason).sort(([, a], [, b]) => b - a).map(([reason, n]) => (
                      <div key={reason} className="flex justify-between text-sm">
                        <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{reason}</span>
                        <span className="tabular-nums text-muted-foreground">{n}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-2">Últimos eventos bot</div>
                  <div className="space-y-1 max-h-48 overflow-y-auto text-xs">
                    {data.bots.recent.slice(0, 10).map((b, i) => {
                      const info = getCountryInfo(b.country);
                      return (
                        <div key={`${b.created_at}-${i}`} className="flex items-center gap-2 border-b last:border-0 py-1">
                          <span>{info?.flag || "🌐"}</span>
                          <span className="font-mono bg-muted px-1.5 rounded shrink-0">{b.bot_reason}</span>
                          <span className="truncate text-muted-foreground" title={b.user_agent || ""}>{b.page_path || "—"}</span>
                          <span className="tabular-nums text-muted-foreground shrink-0">{timeAgo(b.created_at)}</span>
                        </div>
                      );
                    })}
                    {data.bots.recent.length === 0 && (
                      <p className="text-muted-foreground text-center py-4">Sin eventos bot recientes.</p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </main>
    </>
  );
};

export default AdminLive;
