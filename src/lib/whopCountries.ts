/**
 * Países donde el checkout cobra por Whop, con su moneda y los métodos de cada fila: `wallet` (billetera) e `installments` (cuotas).
 * Colombia: Nequi y, en una fila aparte, Addi; Chile y Argentina: Mercado Pago. Espejo de `WHOP_COUNTRIES` en
 * `supabase/functions/_shared/whop.ts`: si cambias uno, cambia el otro (`src/test/whop.test.ts` lo comprueba).
 */
export type WhopKind = "wallet" | "installments";

export const WHOP_COUNTRIES: Record<string, { currency: string; wallet: string[]; installments?: string[] }> = {
  CO: { currency: "COP", wallet: ["nequi"], installments: ["addi"] },
  CL: { currency: "CLP", wallet: ["mercado_pago"] },
  AR: { currency: "ARS", wallet: ["mercado_pago_ar"] },
};
