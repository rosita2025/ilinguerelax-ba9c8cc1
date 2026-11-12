/**
 * Países donde el checkout cobra por Whop (billeteras y cuotas). Espejo de `WHOP_COUNTRIES` en
 * `supabase/functions/_shared/whop.ts`: si cambias uno, cambia el otro (`src/test/whop.test.ts` lo comprueba).
 */
export const WHOP_COUNTRIES: Record<string, { currency: string; methods: string[] }> = {
  CO: { currency: "COP", methods: ["nequi", "addi"] },
  CL: { currency: "CLP", methods: ["mercado_pago"] },
  AR: { currency: "ARS", methods: ["mercado_pago_ar"] },
};
