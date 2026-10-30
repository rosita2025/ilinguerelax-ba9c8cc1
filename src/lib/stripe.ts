import { loadStripe, Stripe } from "@stripe/stripe-js";
import { getPatronesConnection, isPatronesConstrainedConnection } from "@/lib/patronesNetwork";

type StripeEnv = "sandbox" | "live";

const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN;

function paymentsEnvironment(): StripeEnv {
  if (clientToken?.startsWith("pk_test_")) return "sandbox";
  if (clientToken?.startsWith("pk_live_")) return "live";
  throw new Error(
    "Stripe payments are not configured for this build. " +
      "Complete Stripe go-live in your Lovable project to enable production checkout.",
  );
}

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * En conexión lenta (3G/2G o ahorro de datos) stripe.js (~100 KB) NO se descarga al abrir el checkout, porque competiría
 * con el propio contenido de la página: se descarga recién cuando un formulario de Stripe lo usa (al hacer `.then`).
 * En conexiones normales se sigue descargando enseguida, como antes.
 */
function lazyStripe(load: () => Promise<Stripe | null>): Promise<Stripe | null> {
  let real: Promise<Stripe | null> | null = null;
  const get = () => (real ??= load());
  return {
    then: (ok: never, fail: never) => get().then(ok, fail),
    catch: (fail: never) => get().catch(fail),
    finally: (fn: never) => get().finally(fn),
    [Symbol.toStringTag]: "Promise",
  } as unknown as Promise<Stripe | null>;
}

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    paymentsEnvironment();
    const load = () => loadStripe(clientToken as string);
    stripePromise = isPatronesConstrainedConnection(getPatronesConnection()) ? lazyStripe(load) : load();
  }
  return stripePromise;
}

export function getStripeEnvironment(): StripeEnv {
  return paymentsEnvironment();
}
