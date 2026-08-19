import { useEffect, useRef, useState } from "react";
import { Loader2, AlertTriangle, RefreshCw, Copy, Check, Info } from "lucide-react";
import { invokeWithRetry as invokeEdge } from "@/lib/invokeWithRetry";
let sdkPromise = null;
let loadedClientId = null;
let loadedCurrency = null;
async function loadPayPalSdk(currency, attempts = 3) {
    const sdkCorrId = `sdk-${Date.now()}`;
    // Limpieza agresiva de scripts de PayPal previos para evitar conflictos
    document.querySelectorAll('script[src*="paypal.com/sdk/js"]').forEach((s) => {
        try {
            s.parentNode?.removeChild(s);
        }
        catch {
            s.remove();
        }
    });
    window.paypal = undefined;
    sdkPromise = null;
    let lastError = null;
    for (let i = 1; i <= attempts; i++) {
        try {
            const { data, error } = await invokeEdge("paypal-config", {
                method: "GET",
                headers: { "x-correlation-id": sdkCorrId }
            }, { attempts: 2 });
            if (error || !data?.clientId) {
                throw new Error("PayPal no está configurado");
            }
            const clientId = data.clientId;
            if (window.paypal && loadedClientId === clientId && loadedCurrency === currency)
                return;
            if (sdkPromise && loadedClientId === clientId && loadedCurrency === currency)
                return sdkPromise;
            document.querySelectorAll('script[data-paypal-sdk="1"]').forEach((s) => {
                try {
                    s.parentNode?.removeChild(s);
                }
                catch {
                    s.remove();
                }
            });
            window.paypal = undefined;
            loadedClientId = clientId;
            loadedCurrency = currency;
            sdkPromise = new Promise((resolve, reject) => {
                const s = document.createElement("script");
                s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${encodeURIComponent(currency)}&intent=capture&components=buttons`;
                s.async = true;
                s.dataset.paypalSdk = "1";
                s.onload = () => {
                    // Verify window.paypal is actually present
                    if (window.paypal) {
                        resolve();
                    }
                    else {
                        sdkPromise = null;
                        reject(new Error("Script de PayPal cargado pero no inicializado. Verifica si tienes un bloqueador de anuncios activo."));
                    }
                };
                s.onerror = () => {
                    sdkPromise = null;
                    reject(new Error("No se pudo cargar el script de PayPal. Verifica si tienes un bloqueador de anuncios."));
                };
                document.head.appendChild(s);
            });
            return await sdkPromise;
        }
        catch (err) {
            lastError = err;
            if (i < attempts) {
                console.warn(`[paypal] SDK load attempt ${i} failed, retrying in 2s...`, err);
                await new Promise(r => setTimeout(r, 2000));
                sdkPromise = null; // Clear promise to allow real retry
            }
        }
    }
    console.error("[paypal] loadPayPalSdk failed all attempts", lastError);
    throw lastError || new Error("PayPal no disponible");
}
// Currencies natively supported by PayPal. Others fall back to USD.
const PAYPAL_SUPPORTED = new Set([
    "AUD", "BRL", "CAD", "CNY", "CZK", "DKK", "EUR", "HKD", "HUF", "ILS", "JPY",
    "MYR", "MXN", "TWD", "NZD", "NOK", "PHP", "PLN", "GBP", "RUB", "SGD", "SEK", "CHF", "THB", "USD",
]);
const MAX_ATTEMPTS = 3;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
function friendlyMessage(phase, raw) {
    const r = (raw || "").toLowerCase();
    if (r.includes("failed to fetch") || r.includes("network") || r.includes("load failed")) {
        return "Problema de conexión. Verifica tu internet o desactiva bloqueadores de anuncios.";
    }
    if (r.includes("403") || r.includes("forbidden")) {
        return "Acceso denegado. Intenta recargar la página o usa otro navegador.";
    }
    if (r.includes("401") || r.includes("unauthorized")) {
        return "Sesión expirada o error de configuración. Por favor, recarga.";
    }
    if (r.includes("no está configurado") || r.includes("clientid")) {
        return "PayPal no está disponible en este momento.";
    }
    if (phase === "create")
        return "No se pudo crear la orden en PayPal.";
    if (phase === "capture")
        return "El pago no se pudo confirmar. Si se cobró, escríbenos con el ID para verificar.";
    return raw || "Ocurrió un error con PayPal.";
}
export function PayPalButtons({ amountUsd, description, buyerEmail, buyerName, buyerPhone, buyerCountry, skus = [], localCurrency, localAmount, onApproved, onError, couponCode, items = [] }) {
    const ref = useRef(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);
    const [copied, setCopied] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);
    const [processing, setProcessing] = useState(null);
    const providedLocal = !!localCurrency && localCurrency.toUpperCase() !== "USD" && !!localAmount && localAmount > 0;
    const localSupported = providedLocal && PAYPAL_SUPPORTED.has(localCurrency.toUpperCase());
    const useLocal = providedLocal && localSupported;
    const currency = useLocal ? localCurrency.toUpperCase() : "USD";
    const amount = useLocal ? Number(localAmount.toFixed(2)) : Number(amountUsd.toFixed(2));
    // Fallback ocurre cuando el comprador tiene una moneda local detectada
    // pero PayPal no la acepta (p. ej. PEN, ARS, COP, CLP).
    const fallbackToUsd = providedLocal && !localSupported;
    const skusKey = skus.map((sku) => String(sku).trim()).filter(Boolean).join(",");
    const correlationIdRef = useRef((globalThis.crypto?.randomUUID?.() ?? `pp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`));
    async function invokeWithRetry(fnName, body, phase) {
        const correlationId = correlationIdRef.current;
        // We use the shared invokeWithRetry which already has the directFetchFallback
        // for "Failed to send" errors.
        const { data, error } = await invokeEdge(fnName, {
            method: "POST",
            body: { ...body, correlationId },
            headers: { "x-correlation-id": correlationId },
        }, {
            attempts: MAX_ATTEMPTS,
            onAttemptError: (info) => {
                console.warn(`[paypal] ${fnName} attempt ${info.attempt} failed`, {
                    correlationId,
                    error: info.error?.message
                });
                setErr({
                    message: `${friendlyMessage(phase, info.error?.message)} Reintentando…`,
                    phase,
                    attempt: info.attempt,
                    canRetry: false,
                });
            }
        });
        if (error) {
            console.error(`[paypal] ${fnName} exhausted all attempts`, { correlationId, error });
            throw error;
        }
        console.info(`[paypal] ${fnName} ok`, { correlationId });
        return data;
    }
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setErr(null);
        (async () => {
            try {
                await loadPayPalSdk(currency);
                if (cancelled || !ref.current || !window.paypal)
                    return;
                ref.current.innerHTML = "";
                window.paypal.Buttons({
                    style: { layout: "vertical", color: "gold", shape: "pill", label: "paypal", height: 45 },
                    createOrder: async () => {
                        const correlationId = correlationIdRef.current;
                        console.info("[paypal] createOrder", { correlationId, currency, amount, amountUsd });
                        setErr(null);
                        setProcessing("create");
                        try {
                            const data = await invokeWithRetry("paypal-create-order", { amount, currency, amountUsd: Number(amountUsd.toFixed(2)), description, buyerEmail, couponCode, country: buyerCountry, items }, "create");
                            if (!data?.id)
                                throw new Error("No se pudo crear la orden");
                            setErr(null);
                            setProcessing(null);
                            return data.id;
                        }
                        catch (e) {
                            const msg = friendlyMessage("create", e.message);
                            setErr({ message: msg, phase: "create", attempt: MAX_ATTEMPTS, canRetry: true });
                            setProcessing(null);
                            onError?.(e);
                            throw e;
                        }
                    },
                    onApprove: async (data) => {
                        const correlationId = correlationIdRef.current;
                        console.info("[paypal] onApprove", { correlationId, orderId: data.orderID });
                        setErr(null);
                        setProcessing("capture");
                        try {
                            const cap = await invokeWithRetry("paypal-capture-order", {
                                orderId: data.orderID,
                                buyerEmail,
                                buyerName,
                                buyerPhone,
                                buyerCountry,
                                skus: skusKey.split(",").filter(Boolean),
                            }, "capture");
                            if (cap?.status !== "COMPLETED") {
                                throw new Error(`Estado inesperado: ${cap?.status ?? "desconocido"}`);
                            }
                            setErr(null);
                            setProcessing(null);
                            onApproved(data.orderID);
                        }
                        catch (e) {
                            const msg = friendlyMessage("capture", e.message);
                            setErr({ message: msg, phase: "capture", attempt: MAX_ATTEMPTS, canRetry: false });
                            setProcessing(null);
                            onError?.(e);
                        }
                    },
                    onError: (e) => {
                        console.warn("[paypal] sdk onError", e);
                        setErr({
                            message: "Ocurrió un error con PayPal. Intenta de nuevo.",
                            phase: "sdk",
                            attempt: 1,
                            canRetry: true,
                        });
                        setProcessing(null);
                        onError?.(e);
                    },
                    onCancel: () => {
                        setProcessing(null);
                    },
                }).render(ref.current);
                setLoading(false);
            }
            catch (e) {
                if (cancelled)
                    return;
                setErr({
                    message: friendlyMessage("sdk", e.message),
                    phase: "sdk",
                    attempt: 1,
                    canRetry: true,
                });
                setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [amount, amountUsd, currency, description, buyerEmail, buyerName, buyerPhone, buyerCountry, skusKey, reloadKey, onApproved, onError]);
    const correlationId = correlationIdRef.current;
    const copyCorrelation = async () => {
        try {
            await navigator.clipboard.writeText(correlationId);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        }
        catch {
            setCopied(false);
        }
    };
    const handleReload = () => {
        setErr(null);
        setReloadKey((k) => k + 1);
    };
    return (<div className="space-y-2">
      {loading && (<div className="flex items-center justify-center py-6 text-sm text-neutral-500">
          <Loader2 className="w-4 h-4 animate-spin mr-2"/> Cargando PayPal…
        </div>)}
      {processing && !err && (<div className="flex items-center justify-center py-2 text-xs text-neutral-500">
          <Loader2 className="w-3.5 h-3.5 animate-spin mr-2"/>
          {processing === "create" ? "Creando orden…" : "Confirmando pago…"}
        </div>)}
      {!loading && fallbackToUsd && (<div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-snug text-amber-800">
          <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"/>
          <p className="flex-1">
            PayPal no procesa pagos en <span className="font-semibold">{localCurrency.toUpperCase()}</span>, por eso el cobro se hará en <span className="font-semibold">USD ${amountUsd.toFixed(2)}</span>. Tu banco convertirá al tipo de cambio del día. Es un cobro normal y seguro.
          </p>
        </div>)}
      <div ref={ref}/>
      {err && (<div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 space-y-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0"/>
            <p className="flex-1">{err.message}</p>
          </div>
          {err.canRetry && (<button type="button" onClick={handleReload} className="inline-flex items-center gap-1.5 rounded-md bg-red-600 text-white px-3 py-1.5 font-medium hover:bg-red-700 transition">
              <RefreshCw className="w-3.5 h-3.5"/> Reintentar
            </button>)}
          <div className="flex items-center gap-2 pt-1 border-t border-red-200 text-[11px] text-red-600/80">
            <span className="font-mono truncate">ID: {correlationId}</span>
            <button type="button" onClick={copyCorrelation} className="inline-flex items-center gap-1 hover:text-red-800" aria-label="Copiar ID de referencia">
              {copied ? <><Check className="w-3 h-3"/> Copiado</> : <><Copy className="w-3 h-3"/> Copiar</>}
            </button>
          </div>
        </div>)}
    </div>);
}
