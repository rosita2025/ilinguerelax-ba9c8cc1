import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { extractEdgeErrorMessage } from "@/lib/edgeError";

import { Download, Loader2, Mail, ShieldCheck, Clock, Ban } from "lucide-react";

type Bonus = { index: number; title: string };
type Item = {
  sku: string;
  name: string;
  cover: string | null;
  isUpsell: boolean;
  available?: boolean;
  bonuses: Bonus[];
};
type Counts = { total: number; main: number; upsells: number; bonuses: number };
type HistoryEntry = { action: string; sku: string | null; name: string | null; at: string };
type State =
  | { status: "loading" }
  | { status: "invalid" }
  | {
      status: "valid" | "expired" | "exhausted";
      orderNumber: string;
      emailMasked: string;
      expiresAt: string;
      downloadsLeft: number;
      maxDownloads?: number;
      downloadsUsed?: number;
      items?: Item[];
      missingSkus?: string[];
      counts?: Counts;
      history?: HistoryEntry[];
    };


const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Lima",
  });


export default function MiDescarga() {
  const [params] = useSearchParams();
  const token = params.get("t") ?? "";
  const [state, setState] = useState<State>({ status: "loading" });
  const [busy, setBusy] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!token) return setState({ status: "invalid" });
      const { data, error } = await supabase.functions.invoke("resolve-download", { body: { token } });
      if (!alive) return;
      if (error || !data) return setState({ status: "invalid" });
      setState(data as State);
    })();
    return () => {
      alive = false;
    };
  }, [token]);

  const items = useMemo(() => (state.status === "valid" ? state.items ?? [] : []), [state]);
  const counts = state.status === "valid" ? state.counts : undefined;
  const mainCount = counts?.main ?? items.filter((i) => !i.isUpsell).length;
  const upsellCount = counts?.upsells ?? items.filter((i) => i.isUpsell).length;
  const bonusCount = counts?.bonuses ?? items.reduce((n, i) => n + i.bonuses.length, 0);
  const maxDownloads = state.status === "valid" ? state.maxDownloads ?? 0 : 0;
  const usedDownloads = state.status === "valid" ? state.downloadsUsed ?? 0 : 0;
  const history = state.status === "valid" ? state.history ?? [] : [];


  const openFile = async (sku: string, kind: "main" | "bonus", index = 0) => {
    const key = `${sku}:${kind}:${index}`;
    setBusy(key);
    try {
      const { data, error } = await supabase.functions.invoke("get-download-link", {
        body: { token, sku, kind, index },
      });
      if (error || !data?.url) {
        toast.error("No pudimos abrir el archivo. Recarga la página o pide el reenvío por correo.");
        return;
      }
      if (data.accessKey) toast.success(`Clave de acceso: ${data.accessKey}`, { duration: 12000 });
      window.open(data.url as string, "_blank", "noopener,noreferrer");
      setState((prev) =>
        prev.status === "valid"
          ? {
              ...prev,
              downloadsLeft: Number(data.downloadsLeft ?? prev.downloadsLeft),
              downloadsUsed: (prev.downloadsUsed ?? 0) + 1,
              history: [
                {
                  action: "download",
                  sku,
                  name: prev.items?.find((i) => i.sku === sku)?.name ?? sku,
                  at: new Date().toISOString(),
                },
                ...(prev.history ?? []),
              ].slice(0, 30),
            }
          : prev,
      );

    } finally {
      setBusy(null);
    }
  };

  const resend = async () => {
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("resend-download-link", { body: { token } });
      if (error) {
        const msg = await extractEdgeErrorMessage(error);
        toast.error(msg || "No pudimos reenviar ahora mismo. Intenta de nuevo en unos minutos.");
        return;
      }
      const res = (data ?? {}) as { status?: string; emailMasked?: string; error?: string; remainingToday?: number };
      if (res.status !== "sent") {
        toast.error(res.error || "No pudimos reenviar ahora mismo. Intenta de nuevo en unos minutos.");
        return;
      }
      const left = typeof res.remainingToday === "number" ? res.remainingToday : null;
      toast.success(`Te reenviamos el enlace a ${res.emailMasked ?? "tu correo"}.`, {
        description:
          left === null
            ? undefined
            : left > 0
              ? `Te quedan ${left} reenvío(s) hoy.`
              : "Es tu último reenvío de hoy; mañana se renueva el límite.",
      });
    } finally {
      setSending(false);
    }
  };


  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <Helmet>
        <title>Mi descarga | iLingue Relax</title>
        <meta name="description" content="Accede a los archivos digitales de tu pedido en iLingue Relax." />
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <div className="mx-auto w-full max-w-2xl space-y-6">
        {state.status === "loading" && (
          <Card>
            <CardContent className="flex items-center gap-3 py-10">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-muted-foreground">Verificando tu enlace…</span>
            </CardContent>
          </Card>
        )}

        {state.status === "invalid" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ban className="h-5 w-5 text-destructive" /> Enlace no válido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>Este enlace de descarga no existe o fue anulado.</p>
              <p>
                Busca en tu correo el mensaje de entrega de iLingue Relax, o escríbenos a{" "}
                <a className="text-primary underline" href="mailto:hola@ilinguerelax.com">
                  hola@ilinguerelax.com
                </a>{" "}
                con tu número de pedido.
              </p>
            </CardContent>
          </Card>
        )}

        {(state.status === "expired" || state.status === "exhausted") && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {state.status === "expired" ? (
                  <>
                    <Clock className="h-5 w-5 text-destructive" /> Enlace caducado
                  </>
                ) : (
                  <>
                    <Ban className="h-5 w-5 text-destructive" /> Descargas agotadas
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                {state.status === "expired"
                  ? `Tu enlace venció el ${fmtDate(state.expiresAt)}.`
                  : "Alcanzaste el número máximo de descargas de este pedido."}
              </p>
              <p className="text-sm text-muted-foreground">
                Pedido <strong>{state.orderNumber}</strong> · {state.emailMasked}
              </p>
              <Button onClick={resend} disabled={sending} className="w-full">
                {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                Reenviar el enlace a mi correo
              </Button>
              <p className="text-xs text-muted-foreground">
                Si el problema sigue, escríbenos a hola@ilinguerelax.com y lo resolvemos.
              </p>
            </CardContent>
          </Card>
        )}

        {state.status === "valid" && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" /> Tu descarga está lista
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Pedido <strong className="text-foreground">{state.orderNumber}</strong> · {state.emailMasked}
                </p>
                <p>Válido hasta el {fmtDate(state.expiresAt)}</p>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    {mainCount} producto{mainCount === 1 ? "" : "s"} habilitado{mainCount === 1 ? "" : "s"}
                  </span>
                  {upsellCount > 0 && (
                    <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent">
                      {upsellCount} complemento{upsellCount === 1 ? "" : "s"}
                    </span>
                  )}
                  {bonusCount > 0 && (
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
                      🎁 {bonusCount} bono{bonusCount === 1 ? "" : "s"}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>
                      Descargas restantes:{" "}
                      <strong className="text-foreground">{state.downloadsLeft}</strong>
                      {maxDownloads ? ` de ${maxDownloads}` : ""}
                    </span>
                    {maxDownloads > 0 && <span>{usedDownloads} usadas</span>}
                  </div>
                  {maxDownloads > 0 && (
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${Math.min(100, Math.round((state.downloadsLeft / maxDownloads) * 100))}%` }}
                      />
                    </div>
                  )}
                  {state.downloadsLeft <= 3 && (
                    <p className="text-xs text-destructive">
                      Te quedan pocas descargas. Guarda los archivos en tu dispositivo al abrirlos.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {items.length === 0 && (
              <Card>
                <CardContent className="py-8 text-muted-foreground">
                  Estamos preparando tus archivos. Vuelve en unos minutos o pide el reenvío por correo.
                </CardContent>
              </Card>
            )}

            {items.map((item) => (
              <Card key={item.sku}>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    {item.cover && (
                      <img
                        src={item.cover}
                        alt={item.name}
                        loading="lazy"
                        className="h-16 w-12 flex-shrink-0 rounded object-cover"
                      />
                    )}
                    <div className="space-y-1">
                      <CardTitle className="text-base">{item.name}</CardTitle>
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={
                            item.isUpsell
                              ? "rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent"
                              : "rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                          }
                        >
                          {item.isUpsell ? "Complemento" : "Producto principal"}
                        </span>
                        {item.bonuses.length > 0 && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            🎁 {item.bonuses.length} bono{item.bonuses.length === 1 ? "" : "s"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    className="w-full"
                    onClick={() => openFile(item.sku, "main")}
                    disabled={busy === `${item.sku}:main:0` || item.available === false || state.downloadsLeft <= 0}
                  >
                    {busy === `${item.sku}:main:0` ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    {item.available === false ? "Archivo en preparación" : "Descargar"}
                  </Button>

                  {item.bonuses.map((b) => (
                    <Button
                      key={b.index}
                      variant="outline"
                      className="w-full"
                      onClick={() => openFile(item.sku, "bonus", b.index)}
                      disabled={busy === `${item.sku}:bonus:${b.index}`}
                    >
                      {busy === `${item.sku}:bonus:${b.index}` ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="mr-2 h-4 w-4" />
                      )}
                      🎁 {b.title}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            ))}

            {(state.missingSkus?.length ?? 0) > 0 && (
              <Card>
                <CardContent className="py-5 text-sm text-muted-foreground">
                  Hay {state.missingSkus!.length} artículo(s) de tu pedido que aún no están listos para descargar.
                  Escríbenos a{" "}
                  <a className="text-primary underline" href="mailto:hola@ilinguerelax.com">
                    hola@ilinguerelax.com
                  </a>{" "}
                  con tu número de pedido y los enviamos enseguida.
                </CardContent>
              </Card>
            )}



            <Card>
              <CardContent className="space-y-3 py-6">
                <p className="text-sm text-muted-foreground">
                  ¿Quieres guardar este enlace? Te lo reenviamos al correo del pedido ({state.emailMasked}).
                </p>
                <Button variant="secondary" onClick={resend} disabled={sending} className="w-full">
                  {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                  Reenviar el enlace a mi correo
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
