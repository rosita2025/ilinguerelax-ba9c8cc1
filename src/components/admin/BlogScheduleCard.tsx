import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, Loader2, PlayCircle, RefreshCw, RotateCcw, Trash2 } from "lucide-react";
import { useAdminKey } from "@/components/admin/AdminGate";
import { adminInvoke } from "@/lib/adminInvoke";
import { toast } from "sonner";

interface QueueItem {
  id: string;
  topic: string;
  keyword: string;
  language: string;
  category: string;
  scheduled_at: string;
  status: "pending" | "processing" | "done" | "failed";
  attempts: number;
  error: string | null;
  post_slug: string | null;
}

const STATUS_LABEL: Record<QueueItem["status"], { text: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { text: "Programado", variant: "outline" },
  processing: { text: "Generando…", variant: "secondary" },
  done: { text: "Publicado", variant: "default" },
  failed: { text: "Error", variant: "destructive" },
};

/** Muestra la hora en zona horaria de Perú (UTC-5), que es la agenda real. */
function peruTime(iso: string) {
  return new Date(iso).toLocaleString("es-PE", {
    timeZone: "America/Lima",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const BlogScheduleCard = () => {
  const { adminKey } = useAdminKey();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const call = useCallback(
    async (payload: Record<string, unknown>) => {
      const { data, error } = await adminInvoke("manage-blog-queue", { adminKey, ...payload });
      if (error) throw new Error(error.message);
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      return data as Record<string, unknown>;
    },
    [adminKey],
  );

  const load = useCallback(async () => {
    if (!adminKey) return;
    setLoading(true);
    try {
      const res = await call({ action: "list" });
      setItems((res.items as QueueItem[]) ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [adminKey, call]);

  useEffect(() => { load(); }, [load]);

  const run = async (action: string, extra: Record<string, unknown> = {}, okMsg?: string) => {
    setBusy(action + (extra.id ?? ""));
    try {
      const res = await call({ action, ...extra });
      toast.success(okMsg ?? "Listo");
      if (action === "seed") toast.info(`${res.created} artículos programados`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(null);
    }
  };

  const pending = items.filter((i) => i.status === "pending").length;
  const done = items.filter((i) => i.status === "done").length;
  const failed = items.filter((i) => i.status === "failed").length;

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-primary" />
            Agenda de blog · 10 posts al día
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            5 turnos diarios (08:00, 09:00, 11:00, 13:00 y 20:00 hora Perú) × 2 artículos = 10 al día.
            Durante 5 días son 50 artículos con las palabras clave reales de Search Console.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg border p-2">
          <div className="text-lg font-bold">{pending}</div>
          <div className="text-[11px] text-muted-foreground">Programados</div>
        </div>
        <div className="rounded-lg border p-2">
          <div className="text-lg font-bold text-emerald-600">{done}</div>
          <div className="text-[11px] text-muted-foreground">Publicados</div>
        </div>
        <div className="rounded-lg border p-2">
          <div className="text-lg font-bold text-destructive">{failed}</div>
          <div className="text-[11px] text-muted-foreground">Con error</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => run("seed", { startTomorrow: true }, "Agenda de 50 artículos creada")} disabled={busy === "seed"}>
          {busy === "seed" ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CalendarClock className="h-4 w-4 mr-1" />}
          Programar 50 (desde mañana)
        </Button>
        <Button size="sm" variant="outline" onClick={() => run("seed", { startTomorrow: false }, "Agenda creada desde hoy")} disabled={busy === "seed"}>
          Programar desde hoy
        </Button>
        <Button size="sm" variant="secondary" onClick={() => run("run-now", {}, "Cola procesada")} disabled={busy === "run-now"}>
          {busy === "run-now" ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <PlayCircle className="h-4 w-4 mr-1" />}
          Procesar ahora
        </Button>
        <Button size="sm" variant="ghost" onClick={() => run("clear", {}, "Pendientes eliminados")} disabled={busy === "clear"}>
          <Trash2 className="h-4 w-4 mr-1" /> Limpiar pendientes
        </Button>
      </div>

      <div className="divide-y max-h-[420px] overflow-y-auto">
        {items.length === 0 && (
          <div className="text-sm text-muted-foreground py-4">Sin artículos programados todavía.</div>
        )}
        {items.map((it) => (
          <div key={it.id} className="py-2 flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium break-words">{it.topic}</div>
              <div className="text-[11px] text-muted-foreground break-words">
                {peruTime(it.scheduled_at)} · {it.keyword} · {it.language.toUpperCase()}
                {it.post_slug ? ` · /blog/${it.post_slug}` : ""}
              </div>
              {it.error && <div className="text-[11px] text-destructive break-words">{it.error}</div>}
            </div>
            <Badge variant={STATUS_LABEL[it.status].variant} className="shrink-0">
              {STATUS_LABEL[it.status].text}
            </Badge>
            {it.status === "failed" && (
              <Button variant="ghost" size="icon" onClick={() => run("retry", { id: it.id }, "Reprogramado")}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
            {it.status !== "done" && (
              <Button variant="ghost" size="icon" onClick={() => run("delete", { id: it.id }, "Eliminado")}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

export default BlogScheduleCard;
