import { adminInvoke } from "@/lib/adminInvoke";

// Pedidos y Pedidos físicos leen la misma función pesada (`list-admin-orders`,
// 10 tablas). Aquí se comparte la respuesta: si ya hay una consulta en curso se
// reutiliza, y al pasar de una pantalla a otra se puede reusar la última
// respuesta reciente en vez de volver a pedirla.

type Result = { data: unknown; error: unknown };

let inflight: Promise<Result> | null = null;
let last: { ts: number; result: Result } | null = null;

export function fetchAdminOrders(adminKey: string, maxAgeMs = 0): Promise<Result> {
  if (maxAgeMs > 0 && last && Date.now() - last.ts < maxAgeMs) {
    return Promise.resolve(last.result);
  }
  if (inflight) return inflight;
  inflight = adminInvoke("list-admin-orders", { body: { adminKey } })
    .then((result) => {
      if (!result.error && result.data) last = { ts: Date.now(), result };
      return result;
    })
    .finally(() => { inflight = null; });
  return inflight;
}
