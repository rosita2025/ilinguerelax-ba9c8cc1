import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarClock,
  Check,
  Eye,
  Loader2,
  PlayCircle,
  RefreshCw,
  RotateCcw,
  Trash2,
  X,
  Zap,
} from "lucide-react";
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
  post_id: string | null;
  post_slug: string | null;
}

interface PreviewPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  keyword: string | null;
  published: boolean;
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
  const [preview, setPreview] = useState<PreviewPost | null>(null);

  const call = useCallback(
    async (payload: Record<string, unknown>) => {
      const { data, error } = await adminInvoke("manage-blog-queue", { body: { adminKey, ...payload } });
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
    setBusy(action + (extra.force ? "-force" : "") + (extra.id ?? ""));
    try {
      const res = await call({ action, ...extra });
      toast.success(okMsg ?? "Listo");
      if (action === "seed") toast.info(`${res.created} artículos programados`);
      if (action === "run-now") {
        const processed = Number(res.processed ?? 0);
        toast.info(
          processed
            ? `${processed} borrador(es) generados · ábrelos con "Vista previa"`
            : 'No había artículos vencidos. Usa "Generar 2 ahora" para adelantar los próximos.',
        );
      }
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(null);
    }
  };

  /** Vista previa de cualquier post de la agenda: si aún no existe, se genera al momento.
   *  Se cachea el borrador (10 min) para no volver a generarlo ni re-consultarlo. */
  const openPreview = async (it: QueueItem) => {
    const cached = readPreviewCache(it.id);
    if (cached) {
      setPreview(cached);
      toast.info("Vista previa en caché");
      return;
    }

    setBusy("preview" + it.id);
    const toastId = it.post_id ? undefined : toast.loading("Generando el artículo con IA… puede tardar 20–40 s");
    try {
      const res = it.post_id
        ? await call({ action: "preview", id: it.post_id })
        : await call({ action: "generate-one", id: it.id });
      const post = res.post as PreviewPost;
      setPreview(post);
      writePreviewCache(it.id, post);
      if (toastId) toast.success("Borrador listo", { id: toastId });
      if (!it.post_id) await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error";
      if (toastId) toast.error(msg, { id: toastId });
      else toast.error(msg);
    } finally {
      setBusy(null);
    }
  };


  const decide = async (action: "approve" | "reject", postId: string, okMsg: string) => {
    setBusy(action + postId);
    try {
      await call({ action, id: postId });
      toast.success(okMsg);
      clearPreviewCacheByPost(postId);
      setPreview(null);
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
            Usa “Vista previa” en cualquier post para revisarlo, aprobarlo o rechazarlo.
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
        <Button
          size="sm"
          onClick={() => run("run-now", { force: true, count: 2 }, "Generando borradores…")}
          disabled={busy === "run-now-force"}
        >
          {busy === "run-now-force" ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Zap className="h-4 w-4 mr-1" />}
          Generar 2 ahora (borradores)
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
          <div key={it.id} className="py-2 space-y-2">
            <div className="flex items-start gap-2">
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
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => openPreview(it)}
              disabled={busy === "preview" + it.id}
            >
              {busy === "preview" + it.id ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <Eye className="h-3.5 w-3.5 mr-1" />
              )}
              {it.post_id ? "Vista previa" : "Vista previa (genera al momento)"}
            </Button>
          </div>
        ))}
      </div>

      {preview && (
        <div className="rounded-lg border p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-semibold break-words">{preview.title}</div>
              <div className="text-[11px] text-muted-foreground break-words">
                /blog/{preview.slug} · {preview.category}
                {preview.published ? " · publicado" : " · borrador"}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setPreview(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <pre className="text-[11px] whitespace-pre-wrap break-words max-h-[360px] overflow-y-auto text-muted-foreground">
            {preview.content}
          </pre>
          {!preview.published && (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => decide("approve", preview.id, "Artículo aprobado y publicado")} disabled={busy === "approve" + preview.id}>
                {busy === "approve" + preview.id ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                Aprobar y publicar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => decide("reject", preview.id, "Borrador descartado")} disabled={busy === "reject" + preview.id}>
                <Trash2 className="h-4 w-4 mr-1 text-destructive" /> Rechazar
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default BlogScheduleCard;
