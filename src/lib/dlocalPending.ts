// Guarda el pedido de dLocal en curso para poder consultar su estado real
// cuando el comprador vuelve desde checkout.dlocal.com (aprobado o rechazado).
const KEY = "ilr_dlocal_pending";
const MAX_AGE_MS = 6 * 60 * 60 * 1000; // 6 h

export interface DlocalPending {
  orderId: string;
  email: string;
  ts: number;
}

export function saveDlocalPending(orderId: string, email: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ orderId, email, ts: Date.now() } satisfies DlocalPending));
  } catch { /* almacenamiento bloqueado */ }
}

export function readDlocalPending(): DlocalPending | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as DlocalPending;
    if (!p?.orderId || !p?.email) return null;
    if (Date.now() - (p.ts || 0) > MAX_AGE_MS) return null;
    return p;
  } catch {
    return null;
  }
}

export function clearDlocalPending() {
  try { localStorage.removeItem(KEY); } catch { /* noop */ }
}
