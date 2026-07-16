import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import AdminNav from "@/components/admin/AdminNav";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Search, ExternalLink, History } from "lucide-react";

interface AuditItem {
  sku: string;
  name?: string | null;
  drive_url?: string | null;
  drive_missing_reason?: string | null;
  access_key_present?: boolean;
  bonuses?: Array<{ name?: string | null; drive_url?: string | null; has_key?: boolean }>;
  bonus_count?: number;
  reason?: string;
}

interface AuditRow {
  id: string;
  created_at: string;
  customer_email: string;
  customer_name: string | null;
  order_id: string | null;
  idempotency_key: string | null;
  requested_skus: string[];
  normalized_skus: string[];
  resolved_skus: string[];
  missing_skus: string[];
  items: AuditItem[];
  status: string;
  error: string | null;
  message_id: string | null;
  provider: string | null;
  lang: string | null;
  country: string | null;
  source: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  sent: "bg-emerald-100 text-emerald-800 border-emerald-300",
  partial: "bg-amber-100 text-amber-800 border-amber-300",
  duplicate: "bg-slate-100 text-slate-700 border-slate-300",
  no_products: "bg-red-100 text-red-800 border-red-300",
  error: "bg-red-100 text-red-800 border-red-300",
};

const AdminDeliveryAudit = () => {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("digital_delivery_audit" as never)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) console.error(error);
    setRows(((data ?? []) as unknown) as AuditRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!needle) return true;
      const hay = [
        r.customer_email, r.customer_name, r.order_id, r.idempotency_key,
        ...(r.requested_skus || []), ...(r.normalized_skus || []),
        ...(r.resolved_skus || []), ...(r.missing_skus || []),
        r.message_id, r.provider,
      ].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(needle);
    });
  }, [rows, q, statusFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length };
    for (const r of rows) c[r.status] = (c[r.status] || 0) + 1;
    return c;
  }, [rows]);

  return (
    <>
      <Helmet><title>Auditoría de entrega digital · iLingue Relax</title></Helmet>
      <AdminNav />
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Auditoría · Entrega digital</h1>
            <p className="text-sm text-muted-foreground">Cada envío queda registrado: qué SKU se resolvió, qué Drive se adjuntó y por qué falló si faltó algo.</p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {["all", "sent", "partial", "duplicate", "no_products", "error"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-full text-xs border ${statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border"}`}
            >
              {s} · {counts[s] ?? 0}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por correo, order id, SKU, message id…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="space-y-3">
          {loading && <p className="text-sm text-muted-foreground">Cargando…</p>}
          {!loading && filtered.length === 0 && <p className="text-sm text-muted-foreground">Sin registros.</p>}
          {filtered.map((r) => {
            const open = !!expanded[r.id];
            return (
              <Card key={r.id} className="p-3 md:p-4">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <Badge variant="outline" className={STATUS_STYLES[r.status] ?? ""}>
                    {r.status}
                  </Badge>
                  <div className="text-sm font-medium break-all">{r.customer_email}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                  </div>
                  {r.order_id && <code className="text-xs bg-muted px-2 py-0.5 rounded">{r.order_id}</code>}
                  {r.provider && <span className="text-xs text-muted-foreground">via {r.provider}</span>}
                  {r.missing_skus?.length > 0 && (
                    <Badge className="bg-red-100 text-red-800 border-red-300" variant="outline">
                      {r.missing_skus.length} SKU faltante(s)
                    </Badge>
                  )}
                  <button
                    className="text-xs text-primary underline md:ml-auto"
                    onClick={() => setExpanded((e) => ({ ...e, [r.id]: !open }))}
                  >
                    {open ? "Ocultar detalle" : "Ver detalle"}
                  </button>
                </div>

                {open && (
                  <div className="mt-3 grid gap-3 text-sm">
                    <div className="grid md:grid-cols-3 gap-2 text-xs">
                      <div><strong>Solicitados:</strong> {(r.requested_skus || []).join(", ") || "—"}</div>
                      <div><strong>Normalizados:</strong> {(r.normalized_skus || []).join(", ") || "—"}</div>
                      <div><strong>Resueltos:</strong> {(r.resolved_skus || []).join(", ") || "—"}</div>
                    </div>
                    {r.missing_skus?.length > 0 && (
                      <div className="text-xs text-red-700">
                        <strong>Faltantes:</strong> {r.missing_skus.join(", ")}
                      </div>
                    )}
                    {r.error && (
                      <div className="text-xs text-red-700 bg-red-50 p-2 rounded border border-red-200 break-all">
                        {r.error}
                      </div>
                    )}
                    <div className="border rounded overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-muted">
                          <tr>
                            <th className="text-left p-2">SKU</th>
                            <th className="text-left p-2">Producto</th>
                            <th className="text-left p-2">Drive adjunto</th>
                            <th className="text-left p-2">Bonos</th>
                            <th className="text-left p-2">Clave</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(r.items || []).map((it, i) => (
                            <tr key={i} className="border-t align-top">
                              <td className="p-2 font-mono break-all">{it.sku}</td>
                              <td className="p-2">{it.name ?? "—"}</td>
                              <td className="p-2">
                                {it.drive_url ? (
                                  <a href={it.drive_url} target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-1">
                                    Drive <ExternalLink className="h-3 w-3" />
                                  </a>
                                ) : (
                                  <span className="text-red-700">{it.drive_missing_reason || it.reason || "faltante"}</span>
                                )}
                              </td>
                              <td className="p-2">{it.bonus_count ?? (it.bonuses?.length ?? 0)}</td>
                              <td className="p-2">{it.access_key_present ? "sí" : "no"}</td>
                            </tr>
                          ))}
                          {(!r.items || r.items.length === 0) && (
                            <tr><td colSpan={5} className="p-2 text-muted-foreground">Sin ítems.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <div className="text-xs text-muted-foreground break-all">
                      idem: {r.idempotency_key || "—"} · msg: {r.message_id || "—"} · source: {r.source || "—"}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default AdminDeliveryAudit;
