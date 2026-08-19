import { useEffect, useState, useMemo } from "react";
import { PayPalScriptProvider, PayPalButtons as PayPalButtonsOfficial } from "@paypal/react-paypal-js";
import { Loader2, AlertTriangle, RefreshCw, Info, Check, Copy } from "lucide-react";
import { invokeWithRetry as invokeEdge } from "@/lib/invokeWithRetry";

interface Props {
  amountUsd: number;
  description: string;
  buyerEmail?: string;
  buyerName?: string;
  buyerPhone?: string;
  buyerCountry?: string;
  buyerAddress?: string;
  buyerCity?: string;
  buyerZip?: string;
  buyerState?: string;
  skus?: string[];
  localCurrency?: string;
  localAmount?: number;
  onApproved: (orderId: string) => void;
  onError?: (err: unknown) => void;
  couponCode?: string;
  items?: any[];
}

// Currencies natively supported by PayPal. Others fall back to USD.
const PAYPAL_SUPPORTED = new Set([
  "AUD", "BRL", "CAD", "CNY", "CZK", "DKK", "EUR", "HKD", "HUF", "ILS", "JPY",
  "MYR", "MXN", "TWD", "NZD", "NOK", "PHP", "PLN", "GBP", "RUB", "SGD", "SEK", "CHF", "THB", "USD",
]);

export function PayPalButtons({ 
  amountUsd, 
  description, 
  buyerEmail, 
  buyerName, 
  buyerPhone, 
  buyerCountry, 
  buyerAddress,
  buyerCity,
  buyerZip,
  buyerState,
  skus = [], 
  localCurrency, 
  localAmount, 
  onApproved, 
  onError, 
  couponCode, 
  items = [] 
}: Props) {
  const [clientId, setClientId] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [processing, setProcessing] = useState<"create" | "capture" | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [correlationId] = useState(() => globalThis.crypto?.randomUUID?.() ?? `pp-${Date.now()}`);
  const [copied, setCopied] = useState(false);

  // Determine currency and amount
  const providedLocal = !!localCurrency && localCurrency.toUpperCase() !== "USD" && !!localAmount && localAmount > 0;
  const localSupported = providedLocal && PAYPAL_SUPPORTED.has(localCurrency!.toUpperCase());
  const useLocal = providedLocal && localSupported;
  const currency = useLocal ? localCurrency!.toUpperCase() : "USD";
  const amount = Number(amountUsd.toFixed(2)); // Total exacto que incluye producto y envío
  const fallbackToUsd = providedLocal && !localSupported;

  useEffect(() => {
    async function fetchConfig() {
      try {
        setLoadingConfig(true);
        const { data, error } = await invokeEdge<{ clientId?: string }>("paypal-config", { 
          method: "GET",
          headers: { "x-correlation-id": correlationId }
        });
        
        if (error || !data?.clientId) {
          throw new Error(error ? (error as any).message : "PayPal no está configurado (faltan credenciales)");
        }
        setClientId(data.clientId);
      } catch (e) {
        console.error("[paypal-buttons] config error:", e);
        setConfigError((e as any)?.message || String(e));
      } finally {
        setLoadingConfig(false);
      }
    }
    fetchConfig();
  }, [correlationId]);

  const scriptOptions = useMemo(() => {
    if (!clientId) return null;
    return {
      clientId,
      currency,
      intent: "capture",
      components: "buttons"
    };
  }, [clientId, currency]);

  if (loadingConfig) {
    return (
      <div className="flex items-center justify-center py-6 text-sm text-neutral-500">
        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Preparando PayPal…
      </div>
    );
  }

  if (configError) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 space-y-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">PayPal no está disponible temporalmente</p>
            <p className="text-xs opacity-90 mt-1">Por favor, utiliza Tarjeta de Crédito/Débito u otro método de pago para completar tu pedido.</p>
          </div>
        </div>
        <p className="text-[10px] font-mono opacity-50 border-t border-amber-200/50 pt-2">
          Error: {configError}
        </p>
      </div>
    );
  }

  if (!scriptOptions) return null;

  const copyCorrelation = async () => {
    try {
      await navigator.clipboard.writeText(correlationId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  return (
    <div className="space-y-2">
      {fallbackToUsd && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-snug text-amber-800">
          <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <p className="flex-1">
            PayPal no procesa pagos en <span className="font-semibold">{localCurrency!.toUpperCase()}</span>, por eso el cobro se hará en <span className="font-semibold">USD ${amountUsd.toFixed(2)}</span>. Tu banco convertirá al tipo de cambio del día.
          </p>
        </div>
      )}

      {processing && (
        <div className="flex items-center justify-center py-2 text-xs text-neutral-500">
          <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
          {processing === "create" ? "Generando orden…" : "Confirmando pago…"}
        </div>
      )}

      <PayPalScriptProvider options={scriptOptions}>
        <PayPalButtonsOfficial
          style={{ layout: "vertical", color: "gold", shape: "pill", label: "paypal", height: 45 }}
          createOrder={async () => {
            // Re-validate fields before calling createOrder
            if (!buyerEmail || !buyerName) {
              window.dispatchEvent(new CustomEvent("checkout:showBuyerErrors"));
              // Use a generic error message that will be handled by PayPal buttons or captured in the toast
              throw new Error("Missing contact info");
            }

            const hasPhysical = items.some(i => i.isPhysical);
            if (hasPhysical && (!buyerAddress || !buyerCity || !buyerCountry)) {
              window.dispatchEvent(new CustomEvent("checkout:showBuyerErrors"));
              throw new Error("Missing shipping info");
            }

            setProcessing("create");
            setErr(null);
            try {
              const { data, error } = await invokeEdge<{ id: string }>("paypal-create-order", {
                method: "POST",
                body: { 
                  amount, 
                  currency, 
                  amountUsd: amount, // amount here is already amountUsd.toFixed(2) from the calculation above 
                  description, 
                  buyerEmail, 
                  buyerName, // Added name to payload
                  couponCode, 
                  country: buyerCountry,
                  shipping: hasPhysical ? {
                    full_name: buyerName,
                    address_line_1: buyerAddress,
                    admin_area_2: buyerCity,
                    admin_area_1: buyerState,
                    postal_code: buyerZip,
                    country_code: buyerCountry
                  } : undefined,
                  items,
                  correlationId 
                },
                headers: { "x-correlation-id": correlationId }
              });

              if (error || !data?.id) throw new Error(error ? (error as any).message : "No se pudo crear la orden");
              return data.id;
            } catch (e) {
              setErr((e as any)?.message || String(e));
              onError?.(e);
              throw e;
            } finally {
              setProcessing(null);
            }
          }}
          onApprove={async (data) => {
            setProcessing("capture");
            setErr(null);
            try {
              const { data: cap, error } = await invokeEdge<{ status: string }>("paypal-capture-order", {
                method: "POST",
                body: {
                  orderId: data.orderID,
                  buyerEmail,
                  buyerName,
                  buyerPhone,
                  buyerCountry,
                  skus: skus.map(s => String(s).trim()).filter(Boolean),
                  correlationId
                },
                headers: { "x-correlation-id": correlationId }
              });

              if (error || cap?.status !== "COMPLETED") {
                throw new Error(error ? (error as any).message : `Estado inesperado: ${cap?.status ?? "desconocido"}`);
              }
              onApproved(data.orderID);
            } catch (e) {
              setErr((e as any)?.message || String(e));
              onError?.(e);
            } finally {
              setProcessing(null);
            }
          }}
          onError={(e) => {
            console.warn("[paypal-buttons] sdk onError", e);
            setErr("Ocurrió un error con el SDK de PayPal. Por favor, intenta de nuevo o usa otro método.");
            onError?.(e);
          }}
        />
      </PayPalScriptProvider>

      {err && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 space-y-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">Error de PayPal</p>
              <p>{err}</p>
              <p className="mt-1 text-red-600/80">Si el problema persiste, intenta usar Tarjeta de Crédito/Débito.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-red-200 text-[11px] text-red-600/80">
            <span className="font-mono truncate">ID: {correlationId}</span>
            <button
              type="button"
              onClick={copyCorrelation}
              className="inline-flex items-center gap-1 hover:text-red-800"
            >
              {copied ? <><Check className="w-3 h-3" /> Copiado</> : <><Copy className="w-3 h-3" /> Copiar</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
