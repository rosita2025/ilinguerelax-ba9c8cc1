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
type Item = { sku: string; name: string; cover: string | null; isUpsell: boolean; bonuses: Bonus[] };
type State =
  | { status: "loading" }
  | { status: "invalid" }
  | {
      status: "valid" | "expired" | "exhausted";
      orderNumber: string;
      emailMasked: string;
      expiresAt: string;
      downloadsLeft: number;
      items?: Item[];
    };

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });

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
        prev.status === "valid" ? { ...prev, downloadsLeft: Number(data.downloadsLeft ?? prev.downloadsLeft) } : prev,
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
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                <p>
                  Pedido <strong className="text-foreground">{state.orderNumber}</strong> · {state.emailMasked}
                </p>
                <p>
                  Válido hasta el {fmtDate(state.expiresAt)} · {state.downloadsLeft} descargas disponibles
                </p>
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
                  <CardTitle className="text-base">
                    {item.name}
                    {item.isUpsell && (
                      <span className="ml-2 rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent">Complemento</span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    className="w-full"
                    onClick={() => openFile(item.sku, "main")}
                    disabled={busy === `${item.sku}:main:0`}
                  >
                    {busy === `${item.sku}:main:0` ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Descargar
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
