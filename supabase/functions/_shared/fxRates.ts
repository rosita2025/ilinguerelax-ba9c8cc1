// Precios autoritativos del servidor.
import { createClient } from "npm:@supabase/supabase-js@2";

let cachedRates: Record<string, { rate: number; markup: number }> | null = null;
let lastFetch = 0;
const CACHE_TTL = 1000 * 60 * 10; // 10 minutes

async function getLiveRates() {
  const now = Date.now();
  if (cachedRates && (now - lastFetch) < CACHE_TTL) {
    return cachedRates;
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data, error } = await supabase
      .from("exchange_rates")
      .select("code, rate, markup_percent");

    if (error) {
      console.warn("[fxRates] Error fetching live rates:", error.message);
      return null;
    }

    if (data) {
      const map: Record<string, { rate: number; markup: number }> = {};
      for (const r of data) {
        map[r.code] = { rate: Number(r.rate), markup: Number(r.markup_percent) };
      }
      cachedRates = map;
      lastFetch = now;
      return map;
    }
  } catch (err) {
    console.error("[fxRates] Unexpected error fetching rates:", err);
  }
  return null;
}

/**
 * Tipos de cambio AUTORITATIVOS del servidor (USD → moneda local).
 * Estos son los valores estáticos de fallback si la base de datos falla.
 */
export const FX_USD_TO_LOCAL: Record<string, number> = {
  USD: 1,
  EUR: 0.90,
  BRL: 5.50,
  MXN: 20.5,
  COP: 4500,
  ARS: 1000,
  GBP: 0.78,
  CAD: 1.35,
  AUD: 1.50,
  NZD: 1.65,
  PEN: 3.75,
  CLP: 940,
  BOB: 6.9,
  CRC: 520,
  DOP: 59,
  GTQ: 7.8,
  HNL: 24.7,
  NIO: 36.6,
  CUP: 24,
  PYG: 7500,
  UYU: 40,
  HTG: 130,
  VES: 750.00,
  CHF: 0.88,
  SEK: 10.6,
  NOK: 10.7,
  DKK: 6.9,
  PLN: 4.0,
  CZK: 23,
  JPY: 150,
  KRW: 1360,
  CNY: 7.2,
  INR: 83,
  SGD: 1.34,
  HKD: 7.8,
  TWD: 32,
};

/** Monedas que dLocal rechaza con decimales. */
export const ZERO_DECIMAL_CURRENCIES = new Set([
  "CLP", "PYG", "COP", "ARS", "CRC", "GTQ", "JPY",
]);

/**
 * Convierte un total USD autoritativo a moneda local usando la tasa del
 * servidor (DB o fallback estático).
 */
export async function localAmountFromUsd(totalUsd: number, currency: string): Promise<number | null> {
  const code = String(currency || "").toUpperCase();
  
  const liveRates = await getLiveRates();
  let rate = FX_USD_TO_LOCAL[code];
  let markup = 0;

  if (liveRates && liveRates[code]) {
    rate = liveRates[code].rate;
    markup = liveRates[code].markup;
  }

  if (!rate || !Number.isFinite(rate) || rate <= 0) return null;

  // Aplicar markup: PrecioLocal = PrecioUSD * (Tasa * (1 + markup/100))
  const adjustedRate = rate * (1 + markup / 100);
  const raw = totalUsd * adjustedRate;
  
  return ZERO_DECIMAL_CURRENCIES.has(code) ? Math.round(raw) : Number(raw.toFixed(2));
}
