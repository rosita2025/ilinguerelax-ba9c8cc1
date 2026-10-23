import { getStripeEnvironment } from "@/lib/stripe";
import { invokeWithRetry } from "@/lib/invokeWithRetry";

export type StripeQuote = { amount: number; currency: string };

type Params = {
  items: { id: string; quantity: number }[];
  currency: string;
  country: string;
  couponCode?: string | null;
};

const TTL_MS = 30_000;
const cache = new Map<string, { at: number; promise: Promise<StripeQuote | null> }>();

/**
 * Cotización de Stripe compartida: "Pago rápido" y el formulario de tarjeta piden
 * lo mismo; con esto se hace UNA sola llamada al servidor en vez de dos.
 */
export function fetchStripeQuote(p: Params): Promise<StripeQuote | null> {
  const body = {
    environment: getStripeEnvironment(),
    action: "quote",
    items: p.items.map((i) => ({ id: i.id, quantity: i.quantity })),
    currency: String(p.currency || "USD").toLowerCase(),
    country: p.country,
    couponCode: p.couponCode ?? undefined,
  };
  const key = JSON.stringify(body);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.promise;
  const promise = (async () => {
    const { data, error } = await invokeWithRetry<{ amount?: number; currency?: string }>(
      "create-express-intent",
      { body },
      { attempts: 2, baseDelayMs: 500 },
    );
    if (error || !data?.amount || !data.currency) {
      cache.delete(key);
      return null;
    }
    return { amount: data.amount, currency: data.currency };
  })();
  cache.set(key, { at: Date.now(), promise });
  return promise;
}
