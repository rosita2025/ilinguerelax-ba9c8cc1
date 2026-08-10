import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, RefreshCw, Globe, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminInvoke } from "@/lib/adminInvoke";
import { useToast } from "@/hooks/use-toast";
import AdminNav from "@/components/admin/AdminNav";
import CheckoutRecommendations from "@/components/admin/CheckoutRecommendations";

interface ErrRow {
  id: string;
  created_at: string;
  provider: string | null;
  error_reason: string | null;
  country: string | null;
  ip: string | null;
  product_id: string | null;
  value: number | null;
  currency: string | null;
  page_path: string | null;
  session_id: string | null;
  user_agent: string | null;
}

interface Tally { label: string; count: number }

const REASON_LABEL: Record<string, string> = {
  card_declined: "Tarjeta rechazada",
  insufficient_funds: "Fondos insuficientes",
  expired_card: "Tarjeta vencida",
  incorrect_cvc: "CVC incorrecto",
  processing_error: "Error de procesamiento",
  authentication_required: "Requiere 3D Secure",
  sin_motivo: "Sin motivo registrado",
  "HTTP 502": "Error 502 (dLocal Caído)",
  "HTTP 503": "Servicio No Disponible (dLocal)",
  "HTTP 505": "Versión HTTP no soportada",
  "Network error": "Error de Red",
  "invalid_request_error:currency_not_supported": "Moneda no soportada (Stripe)",
  "invalid_request_error:amount_too_large": "Monto demasiado alto",
  "authentication_error": "Error de autenticación API",
};

const HOURS_OPTIONS = [
  { value: 24, label: "24 h" },
  { value: 72, label: "3 días" },
  { value: 168, label: "7 días" },
  { value: 720, label: "30 días" },
];

function flagOf(cc?: string | null) {
  if (!cc || cc.length !== 2) return "🌐";
  return String.fromCodePoint(...[...cc.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)));
}

function Chip({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div className="rounded-lg border bg-card px-3 py-2 flex-1 min-w-[120px] sm:flex-none sm:min-w-[130px]">
      <p className="text-xs text-muted-foreground truncate" title={label}>{label}</p>
      <p className="text-lg font-semibold">{count} <span className="text-xs font-normal text-muted-foreground">({pct}%)</span></p>
    </div>
  );
}

export default function AdminPaymentErrors() {
  const { toast } = useToast();
  const [rows, setRows] = useState<ErrRow[]>([]);
  const [byReason, setByReason] = useState<Tally[]>([]);
  const [byProvider, setByProvider] = useState<Tally[]>([]);
  const [byCountry, setByCountry] = useState<Tally[]>([]);
  const [hours, setHours] = useState(72);
  const [provider, setProvider] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await adminInvoke("admin-payment-errors", {
        body: { hours, provider: provider || undefined },
      });
      if (error) throw error;
      const d = data as {
        rows?: ErrRow[]; byReason?: Tally[]; byProvider?: Tally[]; byCountry?: Tally[];
      } | null;
      setRows(d?.rows ?? []);
      setByReason(d?.byReason ?? []);
      setByProvider(d?.byProvider ?? []);
      setByCountry(d?.byCountry ?? []);
      setUpdatedAt(new Date());
    } catch {
      toast({ title: "Error al cargar fallos de pago", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [hours, provider, toast]);

  useEffect(() => {
    void load();
    const iv = setInterval(() => { void load(); }, 20000);
    return () => clearInterval(iv);
  }, [load]);

  const total = rows.length;
  const providers = useMemo(() => byProvider.map((p) => p.label), [byProvider]);

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-destructive shrink-0" />
              Fallos de pago · tiempo real
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Motivo exacto de cada rechazo (Stripe, PayPal, etc.) con país e IP del intento.
              Actualiza cada 20 s{updatedAt ? ` · ${updatedAt.toLocaleTimeString()}` : ""}.
            </p>
          </div>
          <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refrescar
          </Button>
        </div>


        <div className="flex flex-wrap gap-2">
          {HOURS_OPTIONS.map((o) => (
            <Button
              key={o.value}
              size="sm"
              variant={hours === o.value ? "default" : "outline"}
              onClick={() => setHours(o.value)}
            >
              {o.label}
            </Button>
          ))}
          <span className="hidden sm:block w-px bg-border mx-1" />
          <Button size="sm" variant={provider === "" ? "default" : "outline"} onClick={() => setProvider("")}>
            Todos
          </Button>
          {providers.filter((p) => p !== "desconocido").map((p) => (
            <Button key={p} size="sm" variant={provider === p ? "default" : "outline"} onClick={() => setProvider(p)}>
              {p}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <section>
            <h2 className="text-sm font-semibold mb-2 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" /> Motivos
            </h2>
            <div className="flex flex-wrap gap-2">
              {byReason.length === 0 && <p className="text-sm text-muted-foreground">Sin datos.</p>}
              {byReason.slice(0, 6).map((t) => (
                <Chip key={t.label} label={REASON_LABEL[t.label] || t.label} count={t.count} total={total} />
              ))}
            </div>
          </section>
          <section>
            <h2 className="text-sm font-semibold mb-2 flex items-center gap-1">
              <CreditCard className="h-4 w-4" /> Proveedores
            </h2>
            <div className="flex flex-wrap gap-2">
              {byProvider.length === 0 && <p className="text-sm text-muted-foreground">Sin datos.</p>}
              {byProvider.slice(0, 6).map((t) => (
                <Chip key={t.label} label={t.label} count={t.count} total={total} />
              ))}
            </div>
          </section>
          <section>
            <h2 className="text-sm font-semibold mb-2 flex items-center gap-1">
              <Globe className="h-4 w-4" /> Países
            </h2>
            <div className="flex flex-wrap gap-2">
              {byCountry.length === 0 && <p className="text-sm text-muted-foreground">Sin datos.</p>}
              {byCountry.slice(0, 6).map((t) => (
                <Chip key={t.label} label={`${flagOf(t.label)} ${t.label}`} count={t.count} total={total} />
              ))}
            </div>
          </section>
        </div>

        <CheckoutRecommendations rows={rows} />

        <section className="border rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-muted/40 border-b">
            <h2 className="font-semibold">Intentos fallidos ({total})</h2>
          </div>
          {total === 0 ? (
            <p className="p-6 text-sm text-muted-foreground text-center">
              No hay fallos de pago en este período. 🎉
            </p>
          ) : (
            <>
              {/* Móvil: tarjetas legibles en lugar de tabla comprimida */}
              <ul className="divide-y md:hidden">
                {rows.map((r) => (
                  <li key={r.id} className="p-3 space-y-1 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium break-words">
                        {REASON_LABEL[r.error_reason || ""] || r.error_reason || "Sin motivo registrado"}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(r.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {r.provider || "—"} · {flagOf(r.country)} {r.country || "—"} ·{" "}
                      {r.value != null ? `${r.value} ${r.currency || ""}` : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground break-all">
                      IP: <span className="font-mono">{r.ip || "—"}</span>
                    </p>
                    {r.product_id && (
                      <p className="text-xs text-muted-foreground break-all">Producto: {r.product_id}</p>
                    )}
                    {r.page_path && (
                      <p className="text-xs text-muted-foreground break-all">Página: {r.page_path}</p>
                    )}
                  </li>
                ))}
              </ul>

              {/* Escritorio: tabla completa */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/20 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="text-left p-2">Fecha</th>
                      <th className="text-left p-2">Motivo</th>
                      <th className="text-left p-2">Proveedor</th>
                      <th className="text-left p-2">País</th>
                      <th className="text-left p-2">IP</th>
                      <th className="text-left p-2">Producto</th>
                      <th className="text-left p-2">Monto</th>
                      <th className="text-left p-2">Página</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} className="border-t align-top">
                        <td className="p-2 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                        <td className="p-2 max-w-[240px]">
                          <span className="font-medium">
                            {REASON_LABEL[r.error_reason || ""] || r.error_reason || "Sin motivo registrado"}
                          </span>
                        </td>
                        <td className="p-2 whitespace-nowrap">{r.provider || "—"}</td>
                        <td className="p-2 whitespace-nowrap">{flagOf(r.country)} {r.country || "—"}</td>
                        <td className="p-2 font-mono text-xs whitespace-nowrap">{r.ip || "—"}</td>
                        <td className="p-2 max-w-[180px] truncate" title={r.product_id || ""}>{r.product_id || "—"}</td>
                        <td className="p-2 whitespace-nowrap">
                          {r.value != null ? `${r.value} ${r.currency || ""}` : "—"}
                        </td>
                        <td className="p-2 max-w-[200px] truncate" title={r.page_path || ""}>{r.page_path || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

        </section>
      </div>
    </div>
  );
}
