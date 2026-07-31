import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Eye, FileClock, Loader2, RefreshCw, Trash2, X } from "lucide-react";
import { useAdminKey } from "@/components/admin/AdminGate";
import { adminInvoke } from "@/lib/adminInvoke";
import { toast } from "sonner";

interface Draft {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  keyword: string | null;
  read_time: string;
  created_at: string;
}

interface PreviewPost extends Draft {
  content: string;
}

/** Revisión editorial: los artículos generados quedan en borrador hasta aprobarse. */
const BlogApprovalCard = () => {
  const { adminKey } = useAdminKey();
  const [drafts, setDrafts] = useState<Draft[]>([]);
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
      const res = await call({ action: "list-drafts" });
      setDrafts((res.drafts as Draft[]) ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [adminKey, call]);

  useEffect(() => { load(); }, [load]);

  const act = async (action: string, id: string, okMsg: string) => {
    setBusy(action + id);
    try {
      await call({ action, id });
      toast.success(okMsg);
      if (preview?.id === id) setPreview(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(null);
    }
  };

  const openPreview = async (id: string) => {
    setBusy("preview" + id);
    try {
      const res = await call({ action: "preview", id });
      setPreview(res.post as PreviewPost);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <FileClock className="h-4 w-4 text-primary" />
            Revisión de artículos · pendientes de aprobación
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Los artículos generados (manuales y programados) quedan en borrador. Solo se publican en el blog
            y se envían a Google/IndexNow cuando los apruebas aquí.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={drafts.length ? "secondary" : "outline"}>{drafts.length} pendientes</Badge>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="divide-y max-h-[420px] overflow-y-auto">
        {drafts.length === 0 && (
          <div className="text-sm text-muted-foreground py-4">No hay artículos esperando revisión.</div>
        )}
        {drafts.map((d) => (
          <div key={d.id} className="py-3 space-y-2">
            <div className="min-w-0">
              <div className="text-sm font-medium break-words">{d.title}</div>
              <div className="text-[11px] text-muted-foreground break-words">
                /blog/{d.slug} · {d.category} · {d.read_time}
                {d.keyword ? ` · ${d.keyword}` : ""}
              </div>
              <p className="text-xs text-muted-foreground mt-1 break-words line-clamp-2">{d.excerpt}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => openPreview(d.id)} disabled={busy === "preview" + d.id}>
                {busy === "preview" + d.id ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Eye className="h-4 w-4 mr-1" />}
                Revisar
              </Button>
              <Button size="sm" onClick={() => act("approve", d.id, "Artículo aprobado y publicado")} disabled={busy === "approve" + d.id}>
                {busy === "approve" + d.id ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                Aprobar y publicar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => act("reject", d.id, "Borrador descartado")} disabled={busy === "reject" + d.id}>
                <Trash2 className="h-4 w-4 mr-1 text-destructive" /> Rechazar
              </Button>
            </div>
          </div>
        ))}
      </div>

      {preview && (
        <div className="rounded-lg border p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="text-sm font-semibold break-words">{preview.title}</div>
            <Button variant="ghost" size="icon" onClick={() => setPreview(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <pre className="text-[11px] whitespace-pre-wrap break-words max-h-[360px] overflow-y-auto text-muted-foreground">
            {preview.content}
          </pre>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => act("approve", preview.id, "Artículo aprobado y publicado")} disabled={busy === "approve" + preview.id}>
              <Check className="h-4 w-4 mr-1" /> Aprobar y publicar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => act("reject", preview.id, "Borrador descartado")} disabled={busy === "reject" + preview.id}>
              <Trash2 className="h-4 w-4 mr-1 text-destructive" /> Rechazar
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default BlogApprovalCard;
