import { useCallback, useEffect, useState } from "react";
import { Users, Loader2, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

/**
 * Audiencias propias: compradores de la tienda, compradores Hotmart, reseñas,
 * lista de espera, carritos abandonados y newsletter. El total es único
 * (un correo, una sola vez) y se recalcula solo cada 60 segundos.
 */
export default function AdminAudiences() {
  const { adminKey } = useAdminKey();
  const { toast } = useToast();
  const [rows, setRows] = useState<AudienceRow[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("notify-product-launch", {
        body: { action: "audiences", adminKey },
      });
      if (error) throw new Error(error.message);
      const res = data as { total?: number; perAudience?: AudienceRow[]; generatedAt?: string; error?: string };
      if (res?.error) throw new Error(res.error);
      setRows(res.perAudience ?? []);
      setTotal(res.total ?? 0);
      setUpdatedAt(res.generatedAt ?? new Date().toISOString());
    } catch (e) {
      if (!silent) {
        toast({
          title: "No se pudieron cargar las audiencias",
          description: e instanceof Error ? e.message : "Error",
          variant: "destructive",
        });
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

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5" /> Audiencias · Total único
            </h1>
            <p className="text-sm text-muted-foreground">
              Compradores de la tienda, compradores Hotmart, reseñas, lista de espera, carritos abandonados y
              newsletter. Cada correo se cuenta una sola vez y se descuentan las bajas y rebotes.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => load()} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span className="ml-2">Actualizar</span>
          </Button>
        </div>

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

        <Card className="p-4">
          <p className="text-sm font-semibold mb-3">Desglose por audiencia</p>
          <div className="space-y-2">
            {rows.length === 0 && !loading && (
              <p className="text-sm text-muted-foreground">Sin datos todavía.</p>
            )}
            {rows.map((r) => (
              <div
                key={r.audience}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
              >
                <div>
                  <p className="text-sm font-medium">{r.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.raw} correos en la fuente
                  </p>
                </div>
                <Badge variant="secondary">{r.unique} nuevos únicos</Badge>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            «Nuevos únicos» = personas que aporta esa audiencia y que no estaban ya contadas en una audiencia
            anterior. La suma de esa columna es el total de arriba.
          </p>
        </Card>
      </div>
    </div>
  );
}
