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
import { Skeleton } from "@/components/ui/skeleton";

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

/* ---- Caché de vistas previas (sessionStorage, 10 min) ---- */
const PREVIEW_CACHE_KEY = "ilr-blog-preview-cache-v1";
const PREVIEW_TTL_MS = 10 * 60 * 1000;

type PreviewCache = Record<string, { at: number; post: PreviewPost }>;

function readCacheRaw(): PreviewCache {
  try {
    const raw = sessionStorage.getItem(PREVIEW_CACHE_KEY);
    return raw ? (JSON.parse(raw) as PreviewCache) : {};
  } catch {
    return {};
  }
}

function writeCacheRaw(cache: PreviewCache) {
  try {
    sessionStorage.setItem(PREVIEW_CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* cuota llena: la caché es opcional */
  }
}

function readPreviewCache(queueId: string): PreviewPost | null {
  const cache = readCacheRaw();
  const hit = cache[queueId];
  if (!hit) return null;
  if (Date.now() - hit.at > PREVIEW_TTL_MS) {
    delete cache[queueId];
    writeCacheRaw(cache);
    return null;
  }
  return hit.post;
}

function writePreviewCache(queueId: string, post: PreviewPost) {
  const cache = readCacheRaw();
  // limpia entradas vencidas para no crecer indefinidamente
  const now = Date.now();
  for (const [k, v] of Object.entries(cache)) {
    if (now - v.at > PREVIEW_TTL_MS) delete cache[k];
  }
  cache[queueId] = { at: now, post };
  writeCacheRaw(cache);
}

function clearPreviewCacheByPost(postId: string) {
  const cache = readCacheRaw();
  let changed = false;
  for (const [k, v] of Object.entries(cache)) {
    if (v.post?.id === postId) { delete cache[k]; changed = true; }
  }
  if (changed) writeCacheRaw(cache);
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
      const res = await call({ action: "list", limit: 30 });
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
      if (action === "seed") toast.info(`${res.count || res.created} artículos programados`);
      if (action === "run-now") {
        const processed = Number(res.processed ?? 0);
        toast.info(
          processed
            ? `${processed} artículo(s) generados como borrador.`
            : 'No había artículos vencidos. Usa "Generar 2 ahora" para crear borradores de inmediato.',
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
      if (msg.includes("2FA") || msg.includes("401")) {
        toast.error("Sesión expirada. Recarga para validar 2FA.", { id: toastId });
      } else if (toastId) {
        toast.error(msg, { id: toastId });
      } else {
        toast.error(msg);
      }
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
            Agenda de blog · 10 posts al día (Auto-Publicar)
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            5 turnos diarios × 2 artículos = 10 al día.
            Publicación automática con IA (texto e imagen) para 300 artículos.
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
          <div className="text-[11px] text-muted-foreground">Listos</div>
        </div>
        <div className="rounded-lg border p-2">
          <div className="text-lg font-bold text-destructive">{failed}</div>
          <div className="text-[11px] text-muted-foreground">Con error</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => run("seed", { startTomorrow: true }, "Agenda de 300 artículos creada")} disabled={busy === "seed"}>
          {busy === "seed" ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CalendarClock className="h-4 w-4 mr-1" />}
          Programar 300 (desde mañana)
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
          onClick={() => run("run-now", { force: true, count: 2 }, "Generando borradores de artículos…")}
          disabled={busy === "run-now-force"}
        >
          {busy === "run-now-force" ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Zap className="h-4 w-4 mr-1" />}
          Generar 2 ahora (borradores)
        </Button>
        <Button size="sm" variant="ghost" onClick={() => run("clear", {}, "Pendientes eliminados")} disabled={busy === "clear"}>
          <Trash2 className="h-4 w-4 mr-1" /> Limpiar pendientes
        </Button>
      </div>

      <AgendaList items={items} run={run} busy={busy} openPreview={openPreview} />

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

const AgendaList = ({
  items,
  run,
  busy,
  openPreview,
}: {
  items: QueueItem[];
  run: (action: string, extra?: any, okMsg?: string) => Promise<void>;
  busy: string | null;
  openPreview: (it: QueueItem) => Promise<void>;
}) => {
  const [showAll, setShowAll] = useState(false);

  if (loading && items.length === 0) {
    return (
      <div className="space-y-4">
        <div className="border rounded-lg overflow-hidden divide-y">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-muted/30 space-y-3 p-4">
              <Skeleton className="h-4 w-32" />
              <div className="space-y-3 bg-background p-3 rounded border">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="flex items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-6 w-12" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return <div className="text-sm text-muted-foreground py-4">Sin artículos programados todavía.</div>;
  }

  // Group by day (Peru Time)
  const grouped = items.reduce((acc, it) => {
    const day = new Date(it.scheduled_at).toLocaleDateString("es-PE", {
      timeZone: "America/Lima",
      weekday: "long",
      day: "2-digit",
      month: "long",
    });
    if (!acc[day]) acc[day] = [];
    acc[day].push(it);
    return acc;
  }, {} as Record<string, QueueItem[]>);

  const days = Object.keys(grouped);
  const visibleDays = showAll ? days : days.slice(0, 2);

  return (
    <div className="space-y-4">
      <div className="divide-y border rounded-lg overflow-hidden">
        {visibleDays.map((day) => (
          <div key={day} className="bg-muted/30">
            <div className="px-3 py-1.5 bg-muted/50 text-[10px] uppercase font-bold text-muted-foreground tracking-wider border-b">
              {day}
            </div>
            <div className="divide-y bg-background">
              {grouped[day].map((it) => (
                <div key={it.id} className="p-3 hover:bg-muted/10 transition-colors space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium leading-tight">{it.topic}</div>
                      <div className="text-[10px] text-muted-foreground mt-1 flex flex-wrap gap-x-2">
                        <span className="font-semibold text-primary/80">
                          {new Date(it.scheduled_at).toLocaleTimeString("es-PE", {
                            timeZone: "America/Lima",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span>{it.keyword}</span>
                        <span className="opacity-50 border-l pl-2">{it.language.toUpperCase()}</span>
                        {it.post_slug && <span className="text-blue-600 truncate max-w-[150px]">/blog/{it.post_slug}</span>}
                      </div>
                      {it.error && <div className="text-[10px] text-destructive mt-1 italic">{it.error}</div>}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge variant={STATUS_LABEL[it.status].variant} className="text-[9px] px-1.5 py-0 h-4">
                        {STATUS_LABEL[it.status].text}
                      </Badge>
                      <div className="flex gap-1">
                        {it.status === "failed" && (
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => run("retry", { id: it.id }, "Reprogramado")}>
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        )}
                        {it.status !== "done" && (
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => run("delete", { id: it.id }, "Eliminado")}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-[10px] px-2"
                    onClick={() => openPreview(it)}
                    disabled={busy === "preview" + it.id}
                  >
                    {busy === "preview" + it.id ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Eye className="h-3 w-3 mr-1" />
                    )}
                    {it.post_id ? "Ver borrador" : "Generar vista previa"}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {days.length > 2 && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full text-xs text-muted-foreground hover:text-primary h-8" 
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? "Ver menos" : `Ver agenda completa (${days.length} días)`}
        </Button>
      )}
    </div>
  );
};

export default BlogScheduleCard;
