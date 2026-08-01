import { useCallback, useEffect, useMemo, useState } from "react";
import { Users, Loader2, RefreshCw, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminNav from "@/components/admin/AdminNav";
import { useAdminKey } from "@/components/admin/AdminGate";

interface AudienceRow {
  audience: string;
  label: string;
  raw: number;
  unique: number;
}

interface PersonRow {
  email: string;
  name: string | null;
  country: string | null;
  at: string | null;
  audience: string;
  label: string;
}

const CARD_ORDER = ["buyers", "hotmart", "abandoned", "newsletter", "reviewers", "waitlist"];

const flagOf = (code?: string | null) => {
  const c = (code ?? "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(c)) return "🌐";
  try {
    return String.fromCodePoint(...[...c].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65));
  } catch {
    return "🌐";
  }
};

/** Fecha y hora en horario de Perú (UTC-5). */
const fmtDate = (iso?: string | null) => {
  if (!iso) return "Sin fecha";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "Sin fecha";
  return d.toLocaleString("es-PE", {
    timeZone: "America/Lima",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Audiencias propias: compradores de la tienda, compradores Hotmart, reseñas,
 * lista de espera, carritos abandonados y newsletter. El total es único
 * (un correo, una sola vez) y se muestra persona por persona (nombre, país, correo).
 */
export default function AdminAudiences() {
  const { adminKey } = useAdminKey();
  const { toast } = useToast();
  const [rows, setRows] = useState<AudienceRow[]>([]);
  const [people, setPeople] = useState<PersonRow[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("notify-product-launch", {
        body: { action: "audiences", adminKey },
      });
      if (fnError) throw new Error(fnError.message);
      const res = data as {
        total?: number;
        perAudience?: AudienceRow[];
        people?: PersonRow[];
        generatedAt?: string;
        error?: string;
      };
      if (res?.error) throw new Error(res.error);
      setRows(res.perAudience ?? []);
      setPeople(res.people ?? []);
      setTotal(res.total ?? 0);
      setUpdatedAt(res.generatedAt ?? new Date().toISOString());
      setError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error";
      setError(msg);
      if (!silent) {
        toast({ title: "No se pudieron cargar las audiencias", description: msg, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  }, [adminKey, toast]);

  useEffect(() => {
    load();
    const t = setInterval(() => load(true), 60_000);
    return () => clearInterval(t);
  }, [load]);

  const cards = useMemo(
    () => [...rows].sort((a, b) => CARD_ORDER.indexOf(a.audience) - CARD_ORDER.indexOf(b.audience)),
    [rows],
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return people.filter((p) => {
      if (filter !== "all" && p.audience !== filter) return false;
      if (!term) return true;
      return (
        p.email.includes(term) ||
        (p.name ?? "").toLowerCase().includes(term) ||
        (p.country ?? "").toLowerCase().includes(term) ||
        fmtDate(p.at).toLowerCase().includes(term)
      );
    });
  }, [people, filter, q]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const pageItems = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  useEffect(() => setPage(1), [filter, q, people]);

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5" /> Audiencias · Total único
            </h1>
            <p className="text-sm text-muted-foreground">
              Compradores de la tienda, compradores Hotmart, carritos abandonados, newsletter, reseñas y lista de
              espera. Cada correo se cuenta una sola vez y se descuentan bajas y rebotes.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => load()} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span className="ml-2">Actualizar</span>
          </Button>
        </div>

        {error && (
          <Card className="p-4 border-destructive/40">
            <p className="text-sm text-destructive font-medium">No se pudo actualizar: {error}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => load()}>
              Reintentar
            </Button>
          </Card>
        )}

        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Personas únicas alcanzables</p>
          <p className="text-4xl font-bold mt-1">
            {loading && total === null ? <Loader2 className="w-7 h-7 animate-spin" /> : total ?? 0}
          </p>
          {updatedAt && (
            <p className="text-xs text-muted-foreground mt-2">
              Actualizado: {new Date(updatedAt).toLocaleString("es-PE")} · se refresca solo cada minuto
            </p>
          )}
        </Card>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {cards.map((r) => (
            <Card
              key={r.audience}
              className={`p-4 cursor-pointer transition-colors ${
                filter === r.audience ? "border-primary bg-primary/5" : "hover:border-primary/40"
              }`}
              onClick={() => setFilter(filter === r.audience ? "all" : r.audience)}
            >
              <p className="text-xs text-muted-foreground">{r.label}</p>
              <p className="text-2xl font-bold mt-1">{r.unique}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{r.raw} correos en la fuente</p>
            </Card>
          ))}
          {cards.length === 0 && !loading && (
            <p className="text-sm text-muted-foreground">Sin datos todavía.</p>
          )}
        </div>

        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <p className="text-sm font-semibold">
              Personas {filter !== "all" && <span className="text-muted-foreground">· filtrado</span>}
            </p>
            <Badge variant="secondary">{filtered.length} en total · 5 por página</Badge>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            <Button
              size="sm"
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
            >
              Todas
            </Button>
            {cards.map((r) => (
              <Button
                key={r.audience}
                size="sm"
                variant={filter === r.audience ? "default" : "outline"}
                onClick={() => setFilter(r.audience)}
              >
                {r.label}
              </Button>
            ))}
          </div>
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre, correo, país o fecha…"
              className="pl-9"
            />
          </div>

          <div className="space-y-2">
            {pageItems.map((p) => (
              <div
                key={`${p.audience}-${p.email}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {flagOf(p.country)} {p.name || "Sin nombre"}
                    {p.country && <span className="text-muted-foreground font-normal"> · {p.country}</span>}
                  </p>
                  <p className="text-xs text-muted-foreground break-all">{p.email}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {fmtDate(p.at)} <span className="opacity-70">(hora Perú)</span>
                  </p>
                </div>
                <Badge variant="outline">{p.label}</Badge>
              </div>
            ))}
            {filtered.length === 0 && !loading && (
              <p className="text-sm text-muted-foreground">Nadie coincide con el filtro.</p>
            )}
          </div>

          {filtered.length > 0 && (
            <div className="flex items-center justify-between gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                disabled={current <= 1}
                onClick={() => setPage((n) => Math.max(1, n - 1))}
              >
                <ChevronLeft className="w-4 h-4" /> Anterior
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Página {current} de {pageCount} · {filtered.length} personas
              </p>
              <Button
                variant="outline"
                size="sm"
                disabled={current >= pageCount}
                onClick={() => setPage((n) => Math.min(pageCount, n + 1))}
              >
                Siguiente <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
