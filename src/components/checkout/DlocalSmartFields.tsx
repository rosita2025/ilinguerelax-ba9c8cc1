import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { saveDlocalPending } from "@/lib/dlocalPending";
import { extractEdgeErrorMessage, looksTechnical } from "@/lib/edgeError";
import { invokeWithRetry } from "@/lib/invokeWithRetry";
import { Button } from "@/components/ui/button";

/**
 * dLocal Go — SmartFields (campos de tarjeta embebidos).
 * Los datos de la tarjeta se escriben dentro de iframes de dLocal: nunca pasan
 * por nuestro dominio ni por nuestro backend. Solo enviamos el token temporal
 * a la Edge Function `dlocal-create-card-payment`.
 */

const SDK_URL = "https://js.dlocalgo.com/sdk/v1/dlocal-go.min.js";

interface DlocalGoInstance {
  fields: (opts: Record<string, unknown>) => {
    create: (type: string, opts?: Record<string, unknown>) => {
      mount: (el: HTMLElement) => void;
      unmount?: () => void;
      on?: (ev: string, cb: (e: unknown) => void) => void;
    };
  };
  createToken: (
    field: unknown,
    data?: Record<string, unknown>,
  ) => Promise<{ token?: string; error?: { message?: string } }>;
}

declare global {
  interface Window { DlocalGo?: new (apiKey: string, opts?: Record<string, unknown>) => DlocalGoInstance }
}

let sdkPromise: Promise<void> | null = null;
function loadSdk(): Promise<void> {
  if (window.DlocalGo) return Promise.resolve();
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SDK_URL;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => { sdkPromise = null; reject(new Error("No se pudo cargar SmartFields")); };
    document.head.appendChild(s);
  });
  return sdkPromise;
}

export interface DlocalSmartFieldsProps {
  country: string;
  currency: string;
  /** Monto a cobrar en `currency`. */
  amount: number;
  /** Total equivalente en USD, revalidado en el servidor. */
  expectedTotalUsd: number;
  items: Array<{ id: string; name: string; price: number; quantity: number }>;
  couponPercent: number;
  couponCode?: string;
  payerName: string;
  payerEmail: string;
  payerPhone?: string;
  /** Dirección de envío (solo se envía cuando hay productos físicos). */
  payerAddress?: string;
  payerCity?: string;
  payerState?: string;
  payerZip?: string;
  language?: string;
  onPaid: (orderId: string) => void;
  onError?: (message: string) => void;
}

export function DlocalSmartFields(props: DlocalSmartFieldsProps) {
  const { country, currency, amount, expectedTotalUsd, items, couponPercent, couponCode,
    payerName, payerEmail, payerPhone, payerAddress, payerCity, payerState, payerZip,
    language = "es", onPaid, onError } = props;

  const cardRef = useRef<HTMLDivElement | null>(null);
  const fieldRef = useRef<unknown>(null);
  const goRef = useRef<DlocalGoInstance | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data, error: cfgErr } = await supabase.functions.invoke<{ apiKey?: string }>(
          "dlocal-smartfields-config",
          { body: {} },
        );
        if (cfgErr || !data?.apiKey) throw new Error("SmartFields no está configurado");
        await loadSdk();
        if (!alive || !window.DlocalGo || !cardRef.current) return;
        const go = new window.DlocalGo(data.apiKey, { country: country.toUpperCase() });
        goRef.current = go;
        const fields = go.fields({ locale: language, country: country.toUpperCase() });
        const card = fields.create("card", {
          style: {
            base: { fontSize: "16px", color: "#111827", fontFamily: "inherit" },
            invalid: { color: "#dc2626" },
          },
        });
        card.mount(cardRef.current);
        card.on?.("error", (e: unknown) => {
          const msg = (e as { error?: { message?: string } })?.error?.message;
          if (msg) setError(msg);
        });
        fieldRef.current = card;
        if (alive) setReady(true);
      } catch (e) {
        if (alive) {
          const msg = e instanceof Error ? e.message : "No se pudo iniciar el pago con tarjeta";
          setError(msg);
          onError?.(msg);
        }
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, language]);

  const submit = useCallback(async () => {
    if (!goRef.current || !fieldRef.current || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await goRef.current.createToken(fieldRef.current, { name: payerName });
      if (res?.error || !res?.token) {
        throw new Error(res?.error?.message || "Revisa los datos de tu tarjeta");
      }
      const { data, error: fnErr } = await invokeWithRetry<{
        orderId?: string; status?: string; redirect_url?: string | null; error?: string;
      }>("dlocal-create-card-payment", {
        body: {
          cardToken: res.token,
          items,
          couponPercent,
          couponCode,
          payerEmail: payerEmail.trim(),
          payerName: payerName.trim(),
          payerPhone: (payerPhone ?? "").trim() || undefined,
          payerAddress: (payerAddress ?? "").trim().slice(0, 160) || undefined,
          payerCity: (payerCity ?? "").trim().slice(0, 80) || undefined,
          payerState: (payerState ?? "").trim().slice(0, 80) || undefined,
          payerZip: (payerZip ?? "").trim().slice(0, 24) || undefined,
          country: country.toUpperCase(),
          currency: currency.toUpperCase(),
          amount: Number(amount.toFixed(2)),
          expectedTotalUsd: Number(expectedTotalUsd.toFixed(2)),
          successUrl: `${window.location.origin}/checkouts/return?provider=dlocal`,
          backUrl: `${window.location.origin}/checkouts/return?provider=dlocal`,
        },
      }, { attempts: 2, baseDelayMs: 400 });

      if (fnErr || !data || data.error) {
        const detail = data?.error || (await extractEdgeErrorMessage(fnErr));
        throw new Error(
          detail && !looksTechnical(detail)
            ? detail
            : "No pudimos procesar el pago con esta tarjeta. No se realizó ningún cobro: prueba con otra tarjeta o elige otro método.",
        );
      }
      if (data.redirect_url) {
        // 3DS: al volver, la pantalla puente consulta el estado real del pago.
        if (data.orderId) saveDlocalPending(data.orderId, payerEmail.trim());
        window.location.assign(data.redirect_url);
        return;
      }
      const status = (data.status || "").toUpperCase();
      if (status === "PAID" || status === "AUTHORIZED" || status === "PENDING") {
        onPaid(data.orderId || "");
        return;
      }
      throw new Error(
        "El banco no aprobó el pago y no se realizó ningún cobro. Prueba con otra tarjeta o elige transferencia, efectivo o billetera digital.",
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudo procesar el pago";
      setError(msg);
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  }, [amount, country, couponCode, couponPercent, currency, expectedTotalUsd, items, loading, onError, onPaid, payerEmail, payerName, payerPhone, payerAddress, payerCity, payerState, payerZip]);

  return (
    <div className="space-y-3">
      <div
        ref={cardRef}
        className="min-h-[52px] rounded-xl border border-border bg-background px-3 py-3"
      />
      {!ready && !error && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> Conectando con procesador de pago…
        </p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button className="w-full" disabled={!ready || loading} onClick={submit}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
        Pagar con tarjeta
      </Button>
      <p className="text-[11px] text-muted-foreground">
        Procesado por dLocal Go. Tus datos de tarjeta viajan cifrados y nunca se guardan en nuestro sitio.
      </p>
    </div>
  );
}

export default DlocalSmartFields;
