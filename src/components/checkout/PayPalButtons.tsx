import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    paypal?: any;
  }
}

let sdkPromise: Promise<void> | null = null;
let loadedClientId: string | null = null;
let loadedCurrency: string | null = null;

async function loadPayPalSdk(currency: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke("paypal-config", { method: "GET" });
  if (error || !data?.clientId) throw new Error("PayPal no está configurado");
  const clientId = data.clientId as string;
  // If SDK is already loaded with a different client id or currency, reload it.
  if (window.paypal && loadedClientId === clientId && loadedCurrency === currency) return;
  if (sdkPromise && loadedClientId === clientId && loadedCurrency === currency) return sdkPromise;
  // Remove any previous script
  document.querySelectorAll('script[data-paypal-sdk="1"]').forEach((s) => s.remove());
  delete (window as any).paypal;
  loadedClientId = clientId;
  loadedCurrency = currency;
  sdkPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${encodeURIComponent(currency)}&intent=capture&components=buttons`;
    s.async = true;
    s.dataset.paypalSdk = "1";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("No se pudo cargar PayPal"));
    document.head.appendChild(s);
  });
  return sdkPromise;
}

// Currencies natively supported by PayPal. Others fall back to USD.
// Ref: https://developer.paypal.com/api/rest/reference/currency-codes/
const PAYPAL_SUPPORTED = new Set([
  "AUD","BRL","CAD","CNY","CZK","DKK","EUR","HKD","HUF","ILS","JPY",
  "MYR","MXN","TWD","NZD","NOK","PHP","PLN","GBP","RUB","SGD","SEK","CHF","THB","USD",
]);

interface Props {
  amountUsd: number;
  description: string;
  buyerEmail?: string;
  /** Local currency code detected by IP (e.g. MXN, EUR, CAD). */
  localCurrency?: string;
  /** Local amount already converted from USD. */
  localAmount?: number;
  onApproved: (orderId: string) => void;
  onError?: (err: unknown) => void;
}

export function PayPalButtons({ amountUsd, description, buyerEmail, localCurrency, localAmount, onApproved, onError }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  // Use the local currency when PayPal supports it, otherwise fall back to USD.
  const useLocal = !!localCurrency && PAYPAL_SUPPORTED.has(localCurrency.toUpperCase()) && !!localAmount && localAmount > 0;
  const currency = useLocal ? localCurrency!.toUpperCase() : "USD";
  const amount = useLocal ? Number(localAmount!.toFixed(2)) : Number(amountUsd.toFixed(2));

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr(null);
    (async () => {
      try {
        await loadPayPalSdk(currency);
        if (cancelled || !ref.current || !window.paypal) return;
        ref.current.innerHTML = "";
        window.paypal.Buttons({
          style: { layout: "vertical", color: "gold", shape: "pill", label: "paypal", height: 45 },
          createOrder: async () => {
            const { data, error } = await supabase.functions.invoke("paypal-create-order", {
              body: { amount, currency, description, buyerEmail },
            });

            if (error || !data?.id) throw new Error(error?.message || "No se pudo crear la orden");
            return data.id as string;
          },
          onApprove: async (data: { orderID: string }) => {
            const { data: cap, error } = await supabase.functions.invoke("paypal-capture-order", {
              body: { orderId: data.orderID },
            });
            if (error || cap?.status !== "COMPLETED") {
              const msg = error?.message || "El pago no se completó";
              setErr(msg);
              onError?.(new Error(msg));
              return;
            }
            onApproved(data.orderID);
          },
          onError: (e: unknown) => {
            setErr("Ocurrió un error con PayPal. Intenta de nuevo.");
            onError?.(e);
          },
        }).render(ref.current);
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        setErr((e as Error).message);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // Re-render buttons when amount/email/description change.
  }, [amountUsd, description, buyerEmail]);

  return (
    <div className="space-y-2">
      {loading && (
        <div className="flex items-center justify-center py-6 text-sm text-neutral-500">
          <Loader2 className="w-4 h-4 animate-spin mr-2" /> Cargando PayPal…
        </div>
      )}
      <div ref={ref} />
      {err && <p className="text-xs text-red-600 text-center">{err}</p>}
    </div>
  );
}
