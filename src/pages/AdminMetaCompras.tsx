import { useCallback, useEffect, useMemo, useState } from "react";
import AdminNav from "@/components/admin/AdminNav";
import { useAdminKey } from "@/components/admin/AdminGate";
import { adminInvoke } from "@/lib/adminInvoke";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, AlertTriangle, CircleDashed, RefreshCw, Send, ExternalLink, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

type MetaState = { state: "sent" | "error" | "none"; at: string | null; eventsReceived: number | null; error: string | null; attempts: number };
interface Row {
  ref: string;
  provider: string;
  email: string | null;
  name: string | null;
  amount: number | null;
  currency: string | null;
  at: string;
  country: string | null;
  campaign?: string | null;
  ad?: string | null;
  attribution?: "fbc" | "fbp" | null;
  meta: MetaState;
}

const PROVIDER_LABEL: Record<string, string> = {
  stripe: "Stripe", paypal: "PayPal", dlocalgo: "dLocal Go", dlocal: "dLocal Go", mercadopago: "Mercado Pago", manual: "Yape / Plin / manual",
};
const providerLabel = (p: string) => PROVIDER_LABEL[p] ?? p;

const fmtDate = (iso: string) => {
  try { return new Date(iso).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" }); } catch { return iso; }
};
const fmtMoney = (a: number | null, c: string | null) => (a == null ? "—" : `${a.toFixed(2)} ${c ?? ""}`.trim());

const AdminMetaCompras = () => {
  const { adminKey } = useAdminKey();
  const [rows, setRows] = useState<Row[]>([]);
  const [summary, setSummary] = useState({ total: 0, sent: 0, error: 0, none: 0 });
  const [pixelId, setPixelId] = useState("");
  const [tableReady, setTableReady] = useState(true);
  const [tokenSet, setTokenSet] = useState(true);
  // Respaldo: si la tabla de registro aún no existe en la base, lo reenviado desde este panel se recuerda en este navegador.
  const [localSent, setLocalSent] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem("ilr_meta_sent") || "{}"); } catch { return {}; }
  });
  // «today» = solo las compras de hoy (hora de tu navegador); se piden 2 días al servidor para cubrir el cambio de día.
  const [range, setRange] = useState<"today" | 7 | 14 | 30 | 60>("today");
  const days = range === "today" ? 2 : range;
  const [provider, setProvider] = useState("all");
  const [state, setState] = useState<"all" | "sent" | "error" | "none">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!adminKey) return;
    setLoading(true);
    setLoadError(null);
    try {
      const { data, error } = await adminInvoke("manage-meta-purchases", { body: { adminKey, action: "list", days } });
      if (error) throw error;
      const d = data as { rows?: Row[]; summary?: typeof summary; pixelId?: string; error?: string };
      if (d?.error) throw new Error(d.error);
      setRows(d.rows ?? []);
      setSummary(d.summary ?? { total: 0, sent: 0, error: 0, none: 0 });
      setPixelId(d.pixelId ?? "");
      setTableReady((d as { tableReady?: boolean }).tableReady !== false);
      setTokenSet((d as { tokenSet?: boolean }).tokenSet !== false);
    } catch (e) {
      const m = (e as Error).message || "";
      // «Failed to send a request to the Edge Function» = la función no está desplegada (o no responde): no es un problema de tus datos.
      const notDeployed = /failed to send a request|failed to fetch|networkerror/i.test(m);
      setLoadError(notDeployed
        ? "La función del servidor «manage-meta-purchases» todavía no está desplegada (o no responde). En Lovable pulsa Publish → Update para desplegarla; si sigue igual, revisa Cloud → Edge Functions → manage-meta-purchases → Logs."
        : m);
      toast.error("No se pudo cargar", { description: notDeployed ? "La función del servidor aún no está desplegada." : m });
    } finally {
      setLoading(false);
    }
  }, [adminKey, days]);

  useEffect(() => { void load(); }, [load]);

  const providers = useMemo(() => [...new Set(rows.map((r) => r.provider))], [rows]);
  // Estado mostrado: si el servidor aún no tiene registro pero este panel ya la reenvió con éxito, se muestra como enviada.
  const stateOf = (r: Row): "sent" | "error" | "none" => (r.meta.state === "none" && localSent[r.ref] ? "sent" : r.meta.state);
  const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();
  const inRange = range === "today" ? rows.filter((r) => isToday(r.at)) : rows;
  const visible = inRange.filter((r) =>
    (provider === "all" || r.provider === provider) &&
    (state === "all" || stateOf(r) === state) &&
    (!search.trim() || `${r.ref} ${r.email ?? ""} ${r.name ?? ""}`.toLowerCase().includes(search.trim().toLowerCase())),
  );

  const resend = async (r: Row) => {
    if (stateOf(r) === "sent" && !window.confirm(`Meta ya confirmó recibir ${r.ref}. Si la reenvías, Meta podría contarla dos veces. ¿Reenviar igual?`)) return;
    if (stateOf(r) !== "sent" && !window.confirm(`¿Reenviar la compra ${r.ref} (${fmtMoney(r.amount, r.currency)}) a Meta?`)) return;
    setBusy(r.ref);
    try {
      const { data, error } = await adminInvoke("manage-meta-purchases", { body: { adminKey, action: "resend", ref: r.ref } });
      const d = data as { ok?: boolean; message?: string; error?: string } | null;
      if (error || d?.error) throw new Error(d?.error || error?.message || "No se pudo reenviar");
      toast.success("Enviada a Meta", { description: d?.message });
      try {
        const next = { ...localSent, [r.ref]: new Date().toISOString() };
        setLocalSent(next);
        localStorage.setItem("ilr_meta_sent", JSON.stringify(next));
      } catch { /* sin almacenamiento */ }
      await load();
    } catch (e) {
      toast.error("No se pudo reenviar", { description: (e as Error).message });
    } finally {
      setBusy(null);
    }
  };

  const resendPending = async () => {
    const n = rows.filter((r) => stateOf(r) !== "sent").length;
    if (!n) { toast.info("No hay compras pendientes de enviar"); return; }
    if (!window.confirm(`Se reenviarán a Meta hasta 40 compras sin enviar o con error (hay ${n}). Las que ya confirmó Meta no se tocan. ¿Continuar?`)) return;
    setBusy("all");
    try {
      const { data, error } = await adminInvoke("manage-meta-purchases", { body: { adminKey, action: "resend_pending", days } });
      const d = data as { attempted?: number; sent?: number; failed?: { ref: string; message: string }[]; error?: string } | null;
      if (error || d?.error) throw new Error(d?.error || error?.message || "Error");
      toast.success(`${d?.sent ?? 0} de ${d?.attempted ?? 0} enviadas a Meta`, {
        description: d?.failed?.length ? `${d.failed.length} no se pudieron enviar (sin correo o sin monto). Mira «Con error».` : undefined,
      });
      await load();
    } catch (e) {
      toast.error("No se pudo reenviar", { description: (e as Error).message });
    } finally {
      setBusy(null);
    }
  };

  const kpi = (label: string, value: number, cls: string) => (
    <div className={`rounded-md px-3 py-2 ${cls}`}>
      <div className="text-[10px] uppercase font-medium opacity-80">{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      <div className="max-w-6xl mx-auto p-3 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Meta · Compras enviadas</h1>
            <p className="text-xs text-muted-foreground max-w-2xl">
              Todas las compras confirmadas (Stripe, dLocal Go, PayPal, Mercado Pago, Yape/Plin y pagos manuales) y si se enviaron al píxel de Meta (Conversions API).
              «Enviada» significa que Meta respondió que recibió el evento; puede tardar unas horas en verse en el Administrador de anuncios.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={load} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Recargar
            </Button>
            <Button size="sm" onClick={resendPending} disabled={busy !== null || loading}>
              {busy === "all" ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />} Reenviar las pendientes
            </Button>
            {pixelId && (
              <Button size="sm" variant="outline" asChild>
                <a href={`https://business.facebook.com/events_manager2/list/pixel/${pixelId}/test_events`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-1" /> Eventos en Meta
                </a>
              </Button>
            )}
          </div>
        </div>

        {!tableReady && (
          <p className="rounded-md border border-amber-400 bg-amber-50 p-3 text-sm text-amber-900">
            Falta crear la tabla <b>meta_capi_log</b> en la base de datos: por eso los envíos no se guardan y todo sale «Sin registro». Pídele a Lovable: «Aplica la migración 20261108190000_meta_capi_log.sql». Mientras tanto, lo que reenvíes desde este panel se marca como enviado solo en este navegador.
          </p>
        )}
        {!tokenSet && (
          <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900">
            Falta el secreto <b>FB_CONVERSIONS_API_TOKEN</b> en Lovable: sin él ninguna compra llega a Meta.
          </p>
        )}
        {loadError && (
          <p className="rounded-md border border-amber-400 bg-amber-50 p-3 text-sm text-amber-900">{loadError}</p>
        )}

        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {kpi("Compras confirmadas", inRange.length, "bg-muted")}
          {kpi("Enviadas a Meta", inRange.filter((r) => stateOf(r) === "sent").length, "bg-green-100 text-green-800")}
          {kpi("Con error", inRange.filter((r) => stateOf(r) === "error").length, "bg-red-100 text-red-800")}
          {kpi("Sin registro de envío", inRange.filter((r) => stateOf(r) === "none").length, "bg-yellow-100 text-yellow-800")}
        </div>

        <Card className="p-3 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant={range === "today" ? "default" : "outline"} onClick={() => setRange("today")}>Hoy</Button>
            {([7, 14, 30, 60] as const).map((d) => (
              <Button key={d} size="sm" variant={range === d ? "default" : "outline"} onClick={() => setRange(d)}>{d} días</Button>
            ))}
            <div className="relative ml-auto w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pedido, correo o nombre…" className="pl-8 h-9" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant={provider === "all" ? "default" : "outline"} onClick={() => setProvider("all")}>Todas</Button>
            {providers.map((p) => (
              <Button key={p} size="sm" variant={provider === p ? "default" : "outline"} onClick={() => setProvider(p)}>{providerLabel(p)}</Button>
            ))}
            <span className="mx-1 text-muted-foreground">|</span>
            {([["all", "Todo"], ["sent", "Enviadas"], ["error", "Con error"], ["none", "Sin registro"]] as const).map(([k, label]) => (
              <Button key={k} size="sm" variant={state === k ? "default" : "outline"} onClick={() => setState(k)}>{label}</Button>
            ))}
          </div>
        </Card>

        <div className="space-y-2">
          {visible.length === 0 && !loading && <p className="text-sm text-muted-foreground">No hay compras con este filtro.</p>}
          {visible.map((r) => (
            <Card key={r.ref} className="p-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                {stateOf(r) === "sent" && <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800"><CheckCircle2 className="h-3.5 w-3.5" /> Enviada a Meta</span>}
                {stateOf(r) === "error" && <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800"><AlertTriangle className="h-3.5 w-3.5" /> Error al enviar</span>}
                {stateOf(r) === "none" && <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800"><CircleDashed className="h-3.5 w-3.5" /> Sin registro de envío</span>}
                <span className="rounded bg-muted px-2 py-0.5 text-xs">{providerLabel(r.provider)}</span>
                <span className="font-mono text-xs">{r.ref}</span>
                <span className="font-semibold">{fmtMoney(r.amount, r.currency)}</span>
                <span className="text-xs text-muted-foreground">{fmtDate(r.at)}</span>
                {r.country && <span className="text-xs text-muted-foreground">{r.country}</span>}
                <Button size="sm" variant="outline" className="ml-auto" disabled={busy !== null} onClick={() => resend(r)}>
                  {busy === r.ref ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />} Reenviar a Meta
                </Button>
              </div>
              <div className="mt-1 text-xs text-muted-foreground break-all">
                {r.campaign ? <span className="mr-2 font-medium text-primary">📣 {r.campaign}{r.ad ? ` · ${r.ad}` : ""}</span> : null}
                {r.attribution ? <span className="mr-2 rounded bg-green-100 px-1.5 py-0.5 text-[11px] text-green-800" title="Tenemos guardado el clic del anuncio de este comprador: Meta puede atribuirle la compra a la campaña.">🔗 clic de anuncio guardado</span> : <span className="mr-2 rounded bg-muted px-1.5 py-0.5 text-[11px]" title="No hay clic de anuncio guardado: Meta solo podrá atribuirla si reconoce el correo.">sin clic de anuncio guardado</span>}
                {r.name ? `${r.name} · ` : ""}{r.email ?? "sin correo"}
                {r.meta.state === "sent" && r.meta.at ? ` · Meta confirmó (${r.meta.eventsReceived ?? 1} evento) el ${fmtDate(r.meta.at)}` : ""}
                {r.meta.state === "none" && localSent[r.ref] ? ` · Reenviada desde este panel el ${fmtDate(localSent[r.ref])} (Meta respondió que la recibió)` : ""}
                {stateOf(r) === "error" && r.meta.error ? ` · ${r.meta.error}` : ""}
                {stateOf(r) === "none" ? " · No hay registro de que se haya enviado (puede ser anterior a este control)." : ""}
                {r.amount == null ? " · Sin monto: corrígelo en /admin/dlocal antes de reenviar." : ""}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminMetaCompras;
