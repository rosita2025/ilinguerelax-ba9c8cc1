import { useCallback, useEffect, useState } from "react";
import AdminNav from "@/components/admin/AdminNav";
import { useAdminKey } from "@/components/admin/AdminGate";
import { adminInvoke } from "@/lib/adminInvoke";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Search, ChevronDown, ChevronRight, Store, ShoppingCart, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface BrevoAbandonedRow {
  id: string;
  created_at: string;
  event_type: string;
  origin: "tienda" | string;
  source: string | null;
  email: string | null;
  product_name: string | null;
  product_sku: string | null;
  order_ref: string | null;
  status: string | null;
  http_status: number | null;
  error: string | null;
  response_preview: string | null;
  attributes: Record<string, unknown>;
  summary: {
    ORIGEN: string | null;
    SEGMENTO: string | null;
    TAGS: unknown;
    TIENDA_SKU: string | null;
    COUNTRY_CODE: string | null;
    COUNTRY_STATUS: string | null;
    COUNTRY_MISSING_REASON: string | null;
  };
  cart: Record<string, unknown> | null;
}

interface Summary { total: number; hotmart: number; tienda: number; errors: number; }

const fmtExact = (iso: string) => {
  try {
    return new Date(iso).toLocaleString("es-ES", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
    });
  } catch { return iso; }
};

const tagsToString = (t: unknown): string => {
  if (Array.isArray(t)) return t.join(", ");
  if (typeof t === "string") return t;
  if (t == null) return "—";
  try { return JSON.stringify(t); } catch { return String(t); }
};

const StatusPill = ({ status, http }: { status: string | null; http: number | null }) => {
  const ok = status === "ok" || status === "success" || (http != null && http >= 200 && http < 300);
  return (
    <Badge className={ok ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}>
      {ok ? "OK" : (status || "error")}{http != null ? ` · ${http}` : ""}
    </Badge>
  );
};

const OriginPill = ({ origin }: { origin: string }) => {
  return (
    <Badge className="bg-teal-100 text-teal-800">
      <Store className="w-3 h-3 mr-1 inline" />
      Tienda
    </Badge>
  );
};

const AdminBrevoAbandoned = () => {
  const { adminKey } = useAdminKey();
  const [rows, setRows] = useState<BrevoAbandonedRow[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, tienda: 0, errors: 0 });
  const [loading, setLoading] = useState(false);
  const [origin, setOrigin] = useState<"all" | "tienda">("all");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await adminInvoke<{ rows: BrevoAbandonedRow[]; summary: Summary }>(
        "list-brevo-abandoned",
        { body: { adminKey, origin, search, limit: 300 } },
      );
      if (error) throw error;
      setRows(data?.rows ?? []);
      if (data?.summary) setSummary(data.summary);
    } catch (e) {
      toast.error("No se pudo cargar el log de Brevo", { description: (e as Error).message });
    } finally { setLoading(false); }
  }, [adminKey, origin, search]);

  useEffect(() => { void load(); }, [load]);

  return (
    <>
      <main className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1">
            {(["all", "tienda"] as const).map((o) => (
              <Button key={o} variant={origin === o ? "default" : "outline"} size="sm" onClick={() => setOrigin(o)}>
                {o === "all" ? "Todos" : "Tienda"}
              </Button>
            ))}
          </div>
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-8" placeholder="Buscar por email, SKU o producto…" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void load(); }} />
          </div>
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-3"><div className="text-[10px] uppercase text-muted-foreground">Total</div><div className="text-xl font-bold">{summary.total}</div></Card>
          
          <Card className="p-3"><div className="text-[10px] uppercase text-muted-foreground">Tienda</div><div className="text-xl font-bold text-teal-600">{summary.tienda}</div></Card>
          <Card className="p-3"><div className="text-[10px] uppercase text-muted-foreground">Errores</div><div className="text-xl font-bold text-red-600">{summary.errors}</div></Card>
        </div>


          <Card className="divide-y">
            {rows.length === 0 && !loading && (
              <div className="p-8 text-center text-sm text-muted-foreground">Sin registros.</div>
            )}
            {rows.map((r) => {
              const isOpen = openId === r.id;
              const hasCountryIssue = r.summary.COUNTRY_STATUS && r.summary.COUNTRY_STATUS !== "ok";
              return (
                <div key={r.id}>
                  <button
                    className="w-full text-left p-4 hover:bg-muted/40 flex items-start gap-3"
                    onClick={() => setOpenId(isOpen ? null : r.id)}
                  >
                    {isOpen ? <ChevronDown className="w-4 h-4 mt-1" /> : <ChevronRight className="w-4 h-4 mt-1" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <OriginPill origin={r.origin} />
                        <StatusPill status={r.status} http={r.http_status} />
                        <span className="text-xs text-muted-foreground">{fmtExact(r.created_at)}</span>
                        {hasCountryIssue && (
                          <Badge className="bg-amber-100 text-amber-800"><AlertTriangle className="w-3 h-3 mr-1 inline" />país: {r.summary.COUNTRY_MISSING_REASON || r.summary.COUNTRY_STATUS}</Badge>
                        )}
                      </div>
                      <div className="mt-1 text-xs font-medium truncate">{r.email || "(sin email)"} · {r.product_name || r.product_sku || "(sin producto)"}</div>
                      <div className="mt-0.5 text-[10px] text-muted-foreground truncate">
                        SEGMENTO: <b>{r.summary.SEGMENTO || "—"}</b> · TAGS: {tagsToString(r.summary.TAGS)}
                        
                        {r.summary.TIENDA_SKU && <> · SKU: <code>{r.summary.TIENDA_SKU}</code></>}
                      </div>
                    </div>

                  </button>

                  {isOpen && (
                    <div className="px-4 pb-5 grid gap-4 md:grid-cols-2">
                      <div>
                        <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Atributos enviados a Brevo</h3>
                        <pre className="text-xs bg-muted/50 rounded p-3 overflow-auto max-h-[420px]">{JSON.stringify(r.attributes, null, 2)}</pre>
                        {r.error && (
                          <>
                            <h3 className="text-xs font-semibold uppercase text-red-600 mt-3 mb-1">Error Brevo</h3>
                            <pre className="text-xs bg-red-50 text-red-800 rounded p-3 overflow-auto max-h-[160px]">{r.error}</pre>
                          </>
                        )}
                        {r.response_preview && (
                          <>
                            <h3 className="text-xs font-semibold uppercase text-muted-foreground mt-3 mb-1">Respuesta Brevo</h3>
                            <pre className="text-xs bg-muted/40 rounded p-3 overflow-auto max-h-[160px]">{r.response_preview}</pre>
                          </>
                        )}
                      </div>
                      <div>
                        <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Carrito abandonado (fila más cercana)</h3>
                        {r.cart ? (
                          <pre className="text-xs bg-muted/50 rounded p-3 overflow-auto max-h-[420px]">{JSON.stringify(r.cart, null, 2)}</pre>
                        ) : (
                          <div className="text-xs text-muted-foreground italic">Sin fila en <code>abandoned_carts</code> para este email.</div>
                        )}
                        <div className="mt-3 text-xs text-muted-foreground">
                          <div>event_type: <code>{r.event_type}</code></div>
                          {r.source && <div>source: <code>{r.source}</code></div>}
                          {r.order_ref && <div>order_ref: <code>{r.order_ref}</code></div>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </Card>
      </main>
    </>
  );
};

export default AdminBrevoAbandoned;
