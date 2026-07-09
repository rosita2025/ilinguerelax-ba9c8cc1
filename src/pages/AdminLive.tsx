import { useEffect, useState } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { Card } from "@/components/ui/card";
import { Loader2, Users, Globe, Eye } from "lucide-react";
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
  last_seen: string;
  event_count: number;
  last_event: string;
  product_id: string | null;
}
interface LiveData {
  windowMinutes: number;
  total: number;
  byCountry: Record<string, number>;
  byPage: Record<string, number>;
  bySource: Record<string, number>;
  visitors: Visitor[];
  generatedAt: string;
}

const timeAgo = (iso: string) => {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h`;
};

const AdminLive = () => {
  const { adminKey } = useAdminKey();
  const [data, setData] = useState<LiveData | null>(null);
  const [loading, setLoading] = useState(false);
  const [windowMin, setWindowMin] = useState(5);

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
    const id = setInterval(() => { void load(); }, 10000);
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

  return (
    <>
      <AdminNav />
      <main className="min-h-dvh bg-background p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <Globe className="w-7 h-7 text-primary" /> Visitas en vivo
              </h1>
              <p className="text-sm text-muted-foreground">
                Últimos {data.windowMinutes} min · actualizado {timeAgo(data.generatedAt)} atrás
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary/10 border border-primary/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                <Users className="w-4 h-4 text-primary" />
                <span className="text-lg font-bold tabular-nums">{data.total}</span>
                <span className="text-xs text-muted-foreground">en vivo</span>
              </div>
              <select
                value={windowMin}
                onChange={(e) => setWindowMin(parseInt(e.target.value))}
                className="h-9 rounded-md border bg-background px-2 text-sm"
              >
                <option value={5}>5 min</option>
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={60}>60 min</option>
              </select>
              {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            </div>
          </div>

          {/* World map */}
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

          <div className="grid gap-4 md:grid-cols-2">
            {/* Countries list */}
            <Card className="p-4">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4" /> Por país
              </h2>
              <div className="space-y-2 max-h-[420px] overflow-y-auto">
                {countries.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">Sin visitas en esta ventana.</p>
                )}
                {countries.map(([code, count]) => {
                  const info = getCountryInfo(code);
                  const pct = (count / data.total) * 100;
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

            {/* Top pages */}
            <Card className="p-4">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4" /> Páginas activas
              </h2>
              <div className="space-y-2 max-h-[420px] overflow-y-auto text-sm">
                {Object.entries(data.byPage).sort(([, a], [, b]) => b - a).slice(0, 20).map(([path, n]) => (
                  <div key={path} className="flex justify-between border-b last:border-0 pb-1">
                    <span className="truncate mr-2" title={path}>{path}</span>
                    <span className="tabular-nums text-muted-foreground">{n}</span>
                  </div>
                ))}
                {Object.keys(data.byPage).length === 0 && (
                  <p className="text-muted-foreground text-center py-6">Sin páginas.</p>
                )}
              </div>
            </Card>
          </div>

          {/* Live feed */}
          <Card className="p-4">
            <h2 className="font-semibold mb-3">Feed en vivo</h2>
            <div className="space-y-1 max-h-[400px] overflow-y-auto text-sm">
              {data.visitors.length === 0 && (
                <p className="text-muted-foreground text-center py-6">Sin visitantes ahora mismo.</p>
              )}
              {data.visitors.map((v) => {
                const info = getCountryInfo(v.country);
                return (
                  <div key={v.session_id} className="flex items-center gap-3 py-1.5 border-b last:border-0">
                    <span className="text-lg w-6 text-center">{info?.flag || "🌐"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="truncate">
                        <span className="font-medium">{info?.name || v.country || "—"}</span>
                        <span className="text-muted-foreground"> · {v.page_path || "/"}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {v.source} · {v.event_count} evento{v.event_count === 1 ? "" : "s"} · último: {v.last_event}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums shrink-0">{timeAgo(v.last_seen)}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </main>
    </>
  );
};

export default AdminLive;
