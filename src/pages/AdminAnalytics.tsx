import { Fragment, useEffect, useMemo, useState } from "react";
import { format, startOfDay, endOfDay, subDays, startOfYear } from "date-fns";
import { es } from "date-fns/locale";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarIcon, Loader2, TrendingUp, ShoppingCart, CreditCard, DollarSign, Percent, PackageX } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminNav from "@/components/admin/AdminNav";
import { useAdminKey } from "@/components/admin/AdminGate";
import { getCountryInfo } from "@/lib/countryInfo";
import { cn } from "@/lib/utils";

type Granularity = "hour" | "day";

interface AnalyticsData {
  range: { from: string; to: string; granularity: Granularity };
  totals: {
    sessions: number;
    pageviews: number;
    viewContent: number;
    addToCart: number;
    checkout: number;
    purchases: number;
    revenue: number;
    purchaseSessions: number;
    checkoutSessions: number;
    cartSessions: number;
  };
  conversion: {
    globalPct: number;
    viewToCartPct: number;
    cartToCheckoutPct: number;
    checkoutToPurchasePct: number;
    abandonedCheckoutPct: number;
  };
  abandoned: { total: number; recovered: number; openValue: number; recoveryRatePct: number };
  series: Array<{
    bucket: string;
    pageviews: number;
    viewContent: number;
    addToCart: number;
    checkout: number;
    purchases: number;
    revenue: number;
    sessions: number;
  }>;
  byProduct: Array<{
    product_id: string;
    name?: string | null;
    source?: string;
    hotmart_purchases?: number;
    store_purchases?: number;
    pending?: number;
    hotmart_pending?: number;
    store_pending?: number;
    views: number;
    carts: number;
    purchases: number;
    revenue: number;
    conversion: number;
  }>;
  byCountry: Array<{ country: string; sessions: number; purchases: number; revenue: number }>;
  byProductCountry?: Array<{
    product_id: string;
    name: string | null;
    country: string;
    sessions: number;
    views: number;
    carts: number;
    purchases: number;
    revenue: number;
  }>;
  checkoutsByCountrySource?: Array<{ country: string; source: string; sessions: number }>;
  bySource?: Array<{ source: string; sessions: number; pageviews: number }>;
  byUrl?: Array<{ url: string; sessions: number; pageviews: number }>;


  fx?: {
    base: string;
    source: string;
    fetchedAt: string;
    computedAt: string;
    rates: Record<string, number>;
    pendingByCurrency: Array<{
      currency: string;
      rate: number | null;
      rateInverse: number | null;
      amount: number;
      usdEquivalent: number;
      breakdown: Array<{ source: "hotmart" | "store"; count: number; amount: number; usdEquivalent: number }>;
    }>;
  };
  generatedAt: string;
}

type PresetKey = "today" | "yesterday" | "7d" | "30d" | "ytd" | "custom";

const presets: Array<{ key: PresetKey; label: string }> = [
  { key: "today", label: "Hoy" },
  { key: "yesterday", label: "Ayer" },
  { key: "7d", label: "7 días" },
  { key: "30d", label: "30 días" },
  { key: "ytd", label: "Este año" },
  { key: "custom", label: "Personalizado" },
];

const rangeForPreset = (p: PresetKey, custom: { from?: Date; to?: Date }) => {
  const now = new Date();
  switch (p) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now), granularity: "hour" as Granularity };
    case "yesterday": {
      const y = subDays(now, 1);
      return { from: startOfDay(y), to: endOfDay(y), granularity: "hour" as Granularity };
    }
    case "7d":
      return { from: startOfDay(subDays(now, 6)), to: endOfDay(now), granularity: "day" as Granularity };
    case "30d":
      return { from: startOfDay(subDays(now, 29)), to: endOfDay(now), granularity: "day" as Granularity };
    case "ytd":
      return { from: startOfYear(now), to: endOfDay(now), granularity: "day" as Granularity };
    case "custom": {
      const from = custom.from ? startOfDay(custom.from) : startOfDay(subDays(now, 6));
      const to = custom.to ? endOfDay(custom.to) : endOfDay(now);
      const days = Math.max(1, Math.round((+to - +from) / 86400000));
      return { from, to, granularity: (days <= 2 ? "hour" : "day") as Granularity };
    }
  }
};

const money = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const toArray = <T,>(value: T[] | null | undefined): T[] => (Array.isArray(value) ? value : []);
const toText = (value: unknown, fallback = "") => {
  if (typeof value === "string") return value.trim() || fallback;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
};
const toNumber = (value: unknown) => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};
const safeDateLabel = (bucket: string, granularity: Granularity) => {
  const date = new Date(bucket);
  if (Number.isNaN(date.getTime())) return bucket || "—";
  return granularity === "hour"
    ? format(date, "HH:mm", { locale: es })
    : format(date, "d MMM", { locale: es });
};
const countryDisplay = (code: unknown) => {
  const text = toText(code, "Desconocido");
  const info = getCountryInfo(text);
  return {
    flag: info?.flag || "🌐",
    name: info?.name || text,
  };
};

const normalizeAnalyticsData = (value: Partial<AnalyticsData> | null | undefined, fallbackRange: ReturnType<typeof rangeForPreset>): AnalyticsData => {
  const totals = value?.totals ?? ({} as AnalyticsData["totals"]);
  const conversion = value?.conversion ?? ({} as AnalyticsData["conversion"]);
  const abandoned = value?.abandoned ?? ({} as AnalyticsData["abandoned"]);

  return {
    range: value?.range ?? {
      from: fallbackRange.from.toISOString(),
      to: fallbackRange.to.toISOString(),
      granularity: fallbackRange.granularity,
    },
    totals: {
      sessions: toNumber(totals.sessions),
      pageviews: toNumber(totals.pageviews),
      viewContent: toNumber(totals.viewContent),
      addToCart: toNumber(totals.addToCart),
      checkout: toNumber(totals.checkout),
      purchases: toNumber(totals.purchases),
      revenue: toNumber(totals.revenue),
      purchaseSessions: toNumber(totals.purchaseSessions),
      checkoutSessions: toNumber(totals.checkoutSessions),
      cartSessions: toNumber(totals.cartSessions),
    },
    conversion: {
      globalPct: toNumber(conversion.globalPct),
      viewToCartPct: toNumber(conversion.viewToCartPct),
      cartToCheckoutPct: toNumber(conversion.cartToCheckoutPct),
      checkoutToPurchasePct: toNumber(conversion.checkoutToPurchasePct),
      abandonedCheckoutPct: toNumber(conversion.abandonedCheckoutPct),
    },
    abandoned: {
      total: toNumber(abandoned.total),
      recovered: toNumber(abandoned.recovered),
      openValue: toNumber(abandoned.openValue),
      recoveryRatePct: toNumber(abandoned.recoveryRatePct),
    },
    series: toArray(value?.series).slice(0, 500).map((s) => ({
      bucket: toText(s?.bucket, fallbackRange.from.toISOString()),
      sessions: toNumber(s?.sessions),
      pageviews: toNumber(s?.pageviews),
      viewContent: toNumber(s?.viewContent),
      addToCart: toNumber(s?.addToCart),
      checkout: toNumber(s?.checkout),
      purchases: toNumber(s?.purchases),
      revenue: toNumber(s?.revenue),
    })),
    byProduct: toArray(value?.byProduct).slice(0, 100).map((p) => ({
      product_id: toText(p?.product_id, "producto-desconocido"),
      name: toText(p?.name, "") || null,
      source: toText(p?.source, "—"),
      hotmart_purchases: toNumber(p?.hotmart_purchases),
      store_purchases: toNumber(p?.store_purchases),
      pending: toNumber(p?.pending),
      hotmart_pending: toNumber(p?.hotmart_pending),
      store_pending: toNumber(p?.store_pending),
      views: toNumber(p?.views),
      carts: toNumber(p?.carts),
      purchases: toNumber(p?.purchases),
      revenue: toNumber(p?.revenue),
      conversion: toNumber(p?.conversion),
    })),
    byCountry: toArray(value?.byCountry).slice(0, 100).map((c) => ({
      country: toText(c?.country, "Desconocido"),
      sessions: toNumber(c?.sessions),
      purchases: toNumber(c?.purchases),
      revenue: toNumber(c?.revenue),
    })),
    byProductCountry: toArray(value?.byProductCountry).slice(0, 150).map((r) => ({
      product_id: toText(r?.product_id, "producto-desconocido"),
      name: toText(r?.name, "") || null,
      country: toText(r?.country, "Desconocido"),
      sessions: toNumber(r?.sessions),
      views: toNumber(r?.views),
      carts: toNumber(r?.carts),
      purchases: toNumber(r?.purchases),
      revenue: toNumber(r?.revenue),
    })),
    checkoutsByCountrySource: toArray(value?.checkoutsByCountrySource).slice(0, 100).map((r) => ({
      country: toText(r?.country, "Desconocido"),
      source: toText(r?.source, "directo"),
      sessions: toNumber(r?.sessions),
    })),
    bySource: toArray(value?.bySource).slice(0, 30).map((r) => ({
      source: toText(r?.source, "directo"),
      sessions: toNumber(r?.sessions),
      pageviews: toNumber(r?.pageviews),
    })),
    byUrl: toArray(value?.byUrl).slice(0, 30).map((r) => ({
      url: toText(r?.url, "/"),
      sessions: toNumber(r?.sessions),
      pageviews: toNumber(r?.pageviews),
    })),
    fx: value?.fx,
    generatedAt: value?.generatedAt || new Date().toISOString(),
  };
};


const AdminAnalytics = () => {
  const { adminKey } = useAdminKey();
  const [preset, setPreset] = useState<PresetKey>("today");
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();
  const [data, setData] = useState<AnalyticsData>(() => normalizeAnalyticsData(null, rangeForPreset("today", {})));
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const range = useMemo(
    () => rangeForPreset(preset, { from: customFrom, to: customTo }),
    [preset, customFrom, customTo],
  );

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const invokePromise = supabase.functions.invoke("funnel-analytics", {
        body: {
          adminKey,
          from: range.from.toISOString(),
          to: range.to.toISOString(),
          granularity: range.granularity,
          includeBots: false,
        },
      });
      const timeoutPromise = new Promise<never>((_, reject) => {
        window.setTimeout(() => reject(new Error("La analítica tardó demasiado. Mostrando panel seguro.")), 12000);
      });
      const { data: res, error } = await Promise.race([invokePromise, timeoutPromise]);
      if (error) throw error;
      if ((res as { error?: string })?.error) {
        const msg = (res as { error: string }).error;
        setLoadError(msg);
        toast.error(msg);
        setData(normalizeAnalyticsData(null, range));
        return;
      }
      setData(normalizeAnalyticsData(res as Partial<AnalyticsData>, range));
      setLastUpdated(new Date());
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al cargar analíticas";
      setLoadError(msg);
      setData(normalizeAnalyticsData(null, range));
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // Auto-refresh every 60s so KPIs stay live without manual reload
    const iv = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 60000);
    const onVis = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(iv);
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminKey, preset, customFrom, customTo]);


  const seriesData = useMemo(() => {
    return data.series.map((s) => ({
      ...s,
      label: safeDateLabel(s.bucket, data.range.granularity),
    }));
  }, [data]);

  return (
    <>
      <AdminNav />
      <main className="min-h-dvh bg-background p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <TrendingUp className="w-7 h-7 text-primary" /> Analíticas históricas
              </h1>
              <p className="text-sm text-muted-foreground">
                Visitas · carrito · checkout · compras · conversión · humanos (bots excluidos)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2 py-1 rounded-full border bg-emerald-500/10 border-emerald-500/30 text-emerald-700 font-medium">
                Solo humanos · bots excluidos
              </span>
              <span className="text-[11px] text-muted-foreground">
                Auto 60s{lastUpdated ? ` · ${format(lastUpdated, "HH:mm:ss", { locale: es })}` : ""}
              </span>
              <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading} className="gap-1">
                <Loader2 className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                Actualizar
              </Button>
            </div>
          </div>

          {loadError && (
            <Card className="p-3 border-destructive/30 bg-destructive/5 text-sm text-destructive">
              No se pudo cargar completo ahora: {loadError}. El panel queda abierto con valores seguros; intenta de nuevo en unos segundos.
            </Card>
          )}

          {/* Preset selector */}
          <Card className="p-4 flex flex-wrap items-center gap-2">
            {presets.map((p) => (
              <Button
                key={p.key}
                variant={preset === p.key ? "default" : "outline"}
                size="sm"
                onClick={() => setPreset(p.key)}
              >
                {p.label}
              </Button>
            ))}
            {preset === "custom" && (
              <div className="flex items-center gap-2 ml-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("gap-2", !customFrom && "text-muted-foreground")}>
                      <CalendarIcon className="w-4 h-4" />
                      {customFrom ? format(customFrom, "d MMM yyyy", { locale: es }) : "Desde"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customFrom}
                      onSelect={setCustomFrom}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                <span className="text-muted-foreground">→</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("gap-2", !customTo && "text-muted-foreground")}>
                      <CalendarIcon className="w-4 h-4" />
                      {customTo ? format(customTo, "d MMM yyyy", { locale: es }) : "Hasta"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={customTo}
                      onSelect={setCustomTo}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
            <div className="ml-auto text-xs text-muted-foreground">
              {format(range.from, "d MMM yyyy HH:mm", { locale: es })} → {format(range.to, "d MMM yyyy HH:mm", { locale: es })}
              {" · "}
              {range.granularity === "hour" ? "por hora" : "por día"}
            </div>
          </Card>

          {loading && data.series.length === 0 && data.totals.sessions === 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={`k1-${i}`} className="p-4 space-y-2">
                    <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                    <div className="h-7 w-24 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-16 bg-muted/70 animate-pulse rounded" />
                  </Card>
                ))}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={`k2-${i}`} className="p-4 space-y-2">
                    <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                    <div className="h-7 w-24 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-16 bg-muted/70 animate-pulse rounded" />
                  </Card>
                ))}
              </div>
              <Card className="p-4">
                <div className="h-4 w-40 bg-muted animate-pulse rounded mb-3" />
                <div className="h-72 bg-muted/40 animate-pulse rounded flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              </Card>
              <Card className="p-4">
                <div className="h-4 w-32 bg-muted animate-pulse rounded mb-3" />
                <div className="h-56 bg-muted/40 animate-pulse rounded" />
              </Card>
            </>
          ) : (
            <>
              {/* KPI cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Kpi icon={<TrendingUp className="w-4 h-4" />} label="Sesiones" value={data.totals.sessions.toLocaleString()} sub={`${data.totals.pageviews.toLocaleString()} vistas`} />
                <Kpi icon={<ShoppingCart className="w-4 h-4" />} label="Agregar al carrito" value={data.totals.addToCart.toLocaleString()} sub={`${data.conversion.viewToCartPct}% de sesiones`} />
                <Kpi icon={<CreditCard className="w-4 h-4" />} label="Checkouts iniciados" value={data.totals.checkout.toLocaleString()} sub={`${data.conversion.cartToCheckoutPct}% del carrito`} />
                <Kpi icon={<DollarSign className="w-4 h-4" />} label="Compras" value={data.totals.purchases.toLocaleString()} sub={money(data.totals.revenue)} highlight />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Kpi icon={<Percent className="w-4 h-4" />} label="Conversión global" value={`${data.conversion.globalPct}%`} sub="compra / sesión" />
                <Kpi icon={<Percent className="w-4 h-4" />} label="Checkout → Compra" value={`${data.conversion.checkoutToPurchasePct}%`} sub={`${data.totals.purchases} de ${data.totals.checkout}`} />
                <Kpi icon={<PackageX className="w-4 h-4" />} label="Abandono checkout" value={`${data.conversion.abandonedCheckoutPct}%`} sub={`${Math.max(0, data.totals.checkout - data.totals.purchases)} sin comprar`} />
                <Kpi icon={<PackageX className="w-4 h-4" />} label="Carritos abandonados" value={data.abandoned.total.toLocaleString()} sub={`${data.abandoned.recovered} recuperados · ${money(data.abandoned.openValue)}`} />
              </div>

              {/* Funnel evolution */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold">Evolución del embudo</h2>
                  <span className="text-xs text-muted-foreground">
                    {range.granularity === "hour" ? "Por hora" : "Por día"}
                  </span>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={seriesData}>
                      <defs>
                        <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gPurch" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.6} />
                          <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Area type="monotone" dataKey="sessions" name="Sesiones" stroke="hsl(var(--primary))" fill="url(#gViews)" strokeWidth={2} />
                      <Area type="monotone" dataKey="addToCart" name="Carrito" stroke="hsl(var(--muted-foreground))" fill="transparent" strokeWidth={2} />
                      <Area type="monotone" dataKey="checkout" name="Checkout" stroke="#f59e0b" fill="transparent" strokeWidth={2} />
                      <Area type="monotone" dataKey="purchases" name="Compras" stroke="hsl(var(--accent))" fill="url(#gPurch)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Revenue */}
              <Card className="p-4">
                <h2 className="font-semibold mb-3">Ingresos ({money(data.totals.revenue)})</h2>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={seriesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        formatter={(v: number) => money(v)}
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="revenue" name="Ingresos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Product table */}
              <Card className="p-4">
                <h2 className="font-semibold mb-3">Top productos</h2>

                {/* Mobile cards */}
                <div className="md:hidden space-y-2">
                  {data.byProduct.length === 0 && (
                    <div className="py-6 text-center text-muted-foreground text-sm">Sin datos en este rango</div>
                  )}
                  {data.byProduct.map((p: any) => {
                    const src = p.source as string | undefined;
                    const badge =
                      src === "hotmart"
                        ? { label: "Hotmart", cls: "bg-orange-500/15 text-orange-600 border-orange-500/30" }
                        : src === "store"
                        ? { label: "Mi tienda", cls: "bg-primary/15 text-primary border-primary/30" }
                        : src === "mixto"
                        ? { label: `H${p.hotmart_purchases}·T${p.store_purchases}`, cls: "bg-purple-500/15 text-purple-600 border-purple-500/30" }
                        : { label: "Sin venta", cls: "bg-muted text-muted-foreground border-border" };
                    return (
                      <div key={p.product_id} className="border border-border/60 rounded-lg p-3 bg-card">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0 flex-1">
                            <a
                              href={`/products/${p.product_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-sm truncate block text-primary hover:underline"
                            >
                              {p.name || p.product_id}
                            </a>
                            <a
                              href={`/products/${p.product_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-muted-foreground truncate block hover:underline"
                            >
                              /products/{p.product_id}
                            </a>
                          </div>
                          <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full border ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[11px]">
                          <div><div className="text-muted-foreground">Vistas</div><div className="font-semibold tabular-nums">{p.views}</div></div>
                          <div><div className="text-muted-foreground">Carrito</div><div className="font-semibold tabular-nums">{p.carts}</div></div>
                          <div><div className="text-muted-foreground">Compras</div><div className="font-semibold tabular-nums">{p.purchases}</div></div>
                          <div>
                            <div className="text-muted-foreground">Pendientes</div>
                            <div className="font-semibold tabular-nums">
                              {p.pending}
                              {(p.hotmart_pending || p.store_pending) ? (
                                <span className="ml-1 opacity-70 font-normal">({p.hotmart_pending ?? 0}H·{p.store_pending ?? 0}T)</span>
                              ) : null}
                            </div>
                          </div>
                          <div><div className="text-muted-foreground">Conv.</div><div className="font-semibold tabular-nums">{p.conversion}%</div></div>
                          <div><div className="text-muted-foreground">Ingresos</div><div className="font-semibold tabular-nums">{money(p.revenue)}</div></div>
                        </div>
                      </div>
                    );
                  })}

                </div>

                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs text-muted-foreground border-b">
                      <tr>
                        <th className="text-left py-2 pr-3">Producto</th>
                        <th className="text-left px-2">Origen</th>
                        <th className="text-right px-2">Vistas</th>
                        <th className="text-right px-2">Carrito</th>
                        <th className="text-right px-2">Compras</th>
                        <th className="text-right px-2">Pendientes</th>
                        <th className="text-right px-2">Conv.</th>
                        <th className="text-right pl-2">Ingresos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byProduct.length === 0 && (
                        <tr>
                          <td colSpan={8} className="py-6 text-center text-muted-foreground">
                            Sin datos en este rango
                          </td>
                        </tr>
                      )}
                      {data.byProduct.map((p: any) => {
                        const src = p.source as string | undefined;
                        const badge =
                          src === "hotmart"
                            ? { label: "Hotmart", cls: "bg-orange-500/15 text-orange-600 border-orange-500/30" }
                            : src === "store"
                            ? { label: "Mi tienda", cls: "bg-primary/15 text-primary border-primary/30" }
                            : src === "mixto"
                            ? { label: `Hotmart ${p.hotmart_purchases} · Tienda ${p.store_purchases}`, cls: "bg-purple-500/15 text-purple-600 border-purple-500/30" }
                            : { label: "Sin venta", cls: "bg-muted text-muted-foreground border-border" };
                        return (
                          <tr key={p.product_id} className="border-b border-border/40 hover:bg-muted/40">
                            <td className="py-2 pr-3 max-w-xs">
                              <a
                                href={`/products/${p.product_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="truncate font-medium block text-primary hover:underline"
                              >
                                {p.name || p.product_id}
                              </a>
                              <a
                                href={`/products/${p.product_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-muted-foreground truncate block hover:underline"
                              >
                                /products/{p.product_id}
                              </a>
                            </td>

                            <td className="px-2">
                              <span className={`inline-block text-[11px] px-2 py-0.5 rounded-full border ${badge.cls}`}>
                                {badge.label}
                              </span>
                            </td>
                            <td className="text-right px-2 tabular-nums">{p.views}</td>
                            <td className="text-right px-2 tabular-nums">{p.carts}</td>
                            <td className="text-right px-2 tabular-nums font-semibold">{p.purchases}</td>
                            <td className="text-right px-2 tabular-nums">
                              {p.pending > 0 ? (
                                <span
                                  title={`Hotmart: ${p.hotmart_pending ?? 0} · Tienda: ${p.store_pending ?? 0}`}
                                  className="inline-block text-[11px] px-2 py-0.5 rounded-full border bg-yellow-500/15 text-yellow-700 border-yellow-500/30"
                                >
                                  {p.pending}
                                  {(p.hotmart_pending || p.store_pending) ? (
                                    <span className="ml-1 opacity-70">
                                      ({p.hotmart_pending ?? 0}H·{p.store_pending ?? 0}T)
                                    </span>
                                  ) : null}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">0</span>
                              )}
                            </td>
                            <td className="text-right px-2 tabular-nums">{p.conversion}%</td>
                            <td className="text-right pl-2 tabular-nums">{money(p.revenue)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>







              {/* Country table */}
              <Card className="p-4">
                <h2 className="font-semibold mb-3">Por país</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs text-muted-foreground border-b">
                      <tr>
                        <th className="text-left py-2 pr-3">País</th>
                        <th className="text-right px-2">Sesiones</th>
                        <th className="text-right px-2">Compras</th>
                        <th className="text-right pl-2">Ingresos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byCountry.map((c) => {
                        const info = countryDisplay(c.country);
                        return (
                          <tr key={c.country} className="border-b border-border/40 hover:bg-muted/40">
                            <td className="py-2 pr-3">
                              <span className="mr-2">{info.flag}</span>
                              {info.name}
                            </td>
                            <td className="text-right px-2 tabular-nums">{c.sessions}</td>
                            <td className="text-right px-2 tabular-nums">{c.purchases}</td>
                            <td className="text-right pl-2 tabular-nums">{money(c.revenue)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Checkouts iniciados por país y fuente de tráfico */}
              {data.checkoutsByCountrySource && data.checkoutsByCountrySource.length > 0 && (
                <Card className="p-4">
                  <h2 className="font-semibold mb-1">Checkouts iniciados · país + fuente</h2>
                  <p className="text-xs text-muted-foreground mb-3">
                    Sesiones únicas que llegaron a <span className="font-mono">/checkout</span> segmentadas por país y origen del visitante (detectado desde el <span className="font-mono">referrer</span> capturado por tu pixel propio).
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-xs text-muted-foreground border-b">
                        <tr>
                          <th className="text-left py-2 pr-3">País</th>
                          <th className="text-left px-2">Fuente</th>
                          <th className="text-right pl-2">Sesiones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.checkoutsByCountrySource.map((row, i) => {
                          const info = countryDisplay(row.country);
                          const labelMap: Record<string, { label: string; cls: string }> = {
                            pixel_meta:     { label: "Pixel Meta (FB/IG)", cls: "bg-blue-500/15 text-blue-600 border-blue-500/30" },
                            google_ads:     { label: "Google Ads",         cls: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30" },
                            google_organic: { label: "Google orgánico",    cls: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
                            otro_organico:  { label: "Otro buscador (Bing/Baidu/Yandex/Naver…)", cls: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" },
                            social:         { label: "Redes sociales",     cls: "bg-pink-500/15 text-pink-600 border-pink-500/30" },
                            mensajeria:     { label: "Mensajería (WA/TG)", cls: "bg-teal-500/15 text-teal-600 border-teal-500/30" },
                            email:          { label: "Email / Newsletter", cls: "bg-purple-500/15 text-purple-600 border-purple-500/30" },
                            referral:       { label: "Referral externo",   cls: "bg-orange-500/15 text-orange-600 border-orange-500/30" },
                            directo:        { label: "Directo / pixel propio", cls: "bg-muted text-foreground border-border" },
                          };
                          const s = labelMap[row.source] || labelMap.directo;
                          return (
                            <tr key={`${row.country}-${row.source}-${i}`} className="border-b border-border/40 hover:bg-muted/40">
                              <td className="py-2 pr-3">
                                <span className="mr-2">{info.flag}</span>
                                {info.name}
                              </td>
                              <td className="px-2">
                                <span className={cn("inline-block text-[11px] px-2 py-0.5 rounded border", s.cls)}>{s.label}</span>
                              </td>
                              <td className="text-right pl-2 tabular-nums font-semibold">{row.sessions}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {/* Traffic source totals (iLingue Relax store) */}
              {data.bySource && data.bySource.length > 0 && (
                <Card className="p-4">
                  <h2 className="font-semibold mb-1">Fuente de tráfico · iLingue Relax</h2>
                  <p className="text-xs text-muted-foreground mb-3">
                    Sesiones únicas segmentadas por origen del visitante (detectado desde el <span className="font-mono">referrer</span> capturado por tu pixel propio).
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-xs text-muted-foreground border-b">
                        <tr>
                          <th className="text-left py-2 pr-3">Fuente</th>
                          <th className="text-right px-2">Sesiones</th>
                          <th className="text-right px-2">% del total</th>
                          <th className="text-right pl-2">Vistas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.bySource.map((row, i) => {
                          const labelMap: Record<string, { label: string; cls: string }> = {
                            pixel_meta:     { label: "Pixel Meta (FB/IG)", cls: "bg-blue-500/15 text-blue-600 border-blue-500/30" },
                            google_ads:     { label: "Google Ads",         cls: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30" },
                            google_organic: { label: "Google orgánico",    cls: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
                            otro_organico:  { label: "Otro buscador (Bing/Baidu/Yandex/Naver…)", cls: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" },
                            social:         { label: "Redes sociales",     cls: "bg-pink-500/15 text-pink-600 border-pink-500/30" },
                            mensajeria:     { label: "Mensajería (WA/TG)", cls: "bg-teal-500/15 text-teal-600 border-teal-500/30" },
                            email:          { label: "Email / Newsletter", cls: "bg-purple-500/15 text-purple-600 border-purple-500/30" },
                            referral:       { label: "Referral externo",   cls: "bg-orange-500/15 text-orange-600 border-orange-500/30" },
                            directo:        { label: "Directo / pixel propio", cls: "bg-muted text-foreground border-border" },
                          };
                          const s = labelMap[row.source] || labelMap.directo;
                          const pct = data.totals.sessions > 0 ? ((row.sessions / data.totals.sessions) * 100).toFixed(1) : "0.0";
                          return (
                            <tr key={`${row.source}-${i}`} className="border-b border-border/40 hover:bg-muted/40">
                              <td className="py-2 pr-3">
                                <span className={cn("inline-block text-[11px] px-2 py-0.5 rounded border", s.cls)}>{s.label}</span>
                              </td>
                              <td className="text-right px-2 tabular-nums font-semibold">{row.sessions}</td>
                              <td className="text-right px-2 tabular-nums text-muted-foreground">{pct}%</td>
                              <td className="text-right pl-2 tabular-nums text-muted-foreground">{row.pageviews}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Leyenda: qué significa cada fuente */}
                  <div className="mt-4 pt-3 border-t border-border/60 grid gap-2 sm:grid-cols-2 text-[11px] text-muted-foreground">
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded border bg-orange-500/15 text-orange-600 border-orange-500/30 font-medium mr-1">Referral externo</span>
                      Visitantes que llegaron desde otro sitio web (blogs, foros, Hotmart, WhatsApp Web, links compartidos, etc.).
                    </div>
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded border bg-muted text-foreground border-border font-medium mr-1">Directo / pixel propio</span>
                      Escribieron la URL directamente, abrieron un marcador, o vinieron desde apps que no envían referrer (WhatsApp/Instagram móvil, email cliente, etc.).
                    </div>
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded border bg-emerald-500/15 text-emerald-600 border-emerald-500/30 font-medium mr-1">Google orgánico</span>
                      Búsquedas gratuitas en Google que te posicionaste con SEO (sin pagar anuncios).
                    </div>
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded border bg-blue-500/15 text-blue-600 border-blue-500/30 font-medium mr-1">Pixel Meta (FB/IG)</span>
                      Clics desde Facebook o Instagram (posts orgánicos, stories o anuncios pagados detectados por el pixel).
                    </div>
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded border bg-yellow-500/15 text-yellow-700 border-yellow-500/30 font-medium mr-1">Google Ads</span>
                      Clics desde anuncios pagados de Google (Search, Display o YouTube Ads).
                    </div>
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded border bg-purple-500/15 text-purple-600 border-purple-500/30 font-medium mr-1">Email / Newsletter</span>
                      Clics desde correos que enviaste (Brevo, Resend, campañas de bienvenida o carrito abandonado).
                    </div>
                  </div>
                </Card>
              )}


            </>
          )}
        </div>
      </main>
    </>
  );
};

function Kpi({
  icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <Card className={cn("p-4", highlight && "bg-primary/5 border-primary/30")}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </Card>
  );
}

export default AdminAnalytics;
