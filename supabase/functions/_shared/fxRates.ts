// Tipos de cambio AUTORITATIVOS del servidor (USD → moneda local).
//
// SEGURIDAD: el importe en moneda local que se cobra en dLocal Go se calcula
// SIEMPRE aquí, a partir del total USD del catálogo. Nunca se usa el `amount`
// ni el `expectedTotalUsd` que envía el navegador, porque la razón entre ambos
// permitía escalar el cobro a voluntad.
//
// La tabla es un espejo de `exchangeRates` en `src/i18n/index.ts`, para que el
// comprador pague exactamente lo que vio en la web. Si actualizas una, actualiza
// la otra.
export const FX_USD_TO_LOCAL: Record<string, number> = {
  USD: 1,
  EUR: 0.88,
  BRL: 5.20,
  MXN: 20.00,
  COP: 4200,
  ARS: 1250,
  GBP: 0.75,
  CAD: 1.38,
  AUD: 1.55,
  NZD: 1.65,
  PEN: 3.70,
  CLP: 950,
  BOB: 6.9,
  CRC: 510,
  DOP: 60,
  GTQ: 7.8,
  HNL: 24.8,
  NIO: 36.7,
  CUP: 24,
  PYG: 7300,
  UYU: 40,
  HTG: 132,
  VES: 754.21,
  CHF: 0.85,
  SEK: 10.5,
  NOK: 10.8,
  DKK: 6.9,
  PLN: 4.0,
  CZK: 23,
  JPY: 155,
  KRW: 1350,
  CNY: 7.2,
  INR: 84,
  SGD: 1.35,
  HKD: 7.8,
  TWD: 32,
};

/** Monedas que dLocal rechaza con decimales. */
export const ZERO_DECIMAL_CURRENCIES = new Set([
  "CLP", "PYG", "COP", "ARS", "CRC", "GTQ", "JPY",
]);

/**
 * Convierte un total USD autoritativo a moneda local usando la tasa del
 * servidor. Devuelve `null` si no hay tasa configurada: en ese caso el
 * llamador debe cobrar en USD en vez de confiar en el navegador.
 */
export function localAmountFromUsd(totalUsd: number, currency: string): number | null {
  const code = String(currency || "").toUpperCase();
  const rate = FX_USD_TO_LOCAL[code];
  if (!rate || !Number.isFinite(rate) || rate <= 0) return null;
  const raw = totalUsd * rate;
  return ZERO_DECIMAL_CURRENCIES.has(code) ? Math.round(raw) : Number(raw.toFixed(2));
}
