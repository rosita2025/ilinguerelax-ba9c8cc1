import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { currencyConfig, detectCurrency, exchangeRates, formatCurrencyAmount, formatPrice, type Currency } from "@/i18n";
import { CURRENCY_COUNT, LOCAL_CURRENCY_CARDS } from "@/lib/adminCurrencyGroups";

const server = fs.readFileSync("supabase/functions/_shared/fxRates.ts", "utf8");

describe("catálogo de monedas del admin", () => {
  it("tiene las 79 monedas del catálogo (o más)", () => {
    expect(CURRENCY_COUNT).toBeGreaterThanOrEqual(79);
    const codes = LOCAL_CURRENCY_CARDS.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length); // sin repetidas
  });
  it("cada moneda tiene formato, tasa en el navegador y tasa en el servidor", () => {
    for (const { code } of LOCAL_CURRENCY_CARDS) {
      expect(currencyConfig[code as keyof typeof currencyConfig], `formato ${code}`).toBeTruthy();
      expect(exchangeRates[code as keyof typeof exchangeRates], `tasa ${code}`).toBeGreaterThan(0);
      expect(new RegExp(`\\b${code}:\\s*[\\d.]+`).test(server), `servidor ${code}`).toBe(true);
    }
  });
  it("los países ven moneda cobrable (las de 3 decimales no: ven US$)", () => {
    for (const cc of ["TH", "PH", "VN", "PK", "AE", "SA", "IL", "SN", "FJ", "JM"]) expect(detectCurrency(cc)).not.toBe("USD");
    for (const cc of ["KW", "BH", "OM", "JO", "TN"]) expect(detectCurrency(cc)).toBe("USD");
    for (const cc of ["TR", "UA", "RS", "IS"]) expect(detectCurrency(cc)).toBe("EUR");
  });
  it("las 82 monedas se muestran bien (sin NaN ni vacío) en la página y el checkout", () => {
    for (const { code } of LOCAL_CURRENCY_CARDS) {
      const c = code as Currency;
      const manual = formatCurrencyAmount(60 * exchangeRates[c], c);
      const auto = formatPrice(60, c);
      const withFixed = formatPrice(60, c, { [c]: 1234 } as Partial<Record<Currency, number>>);
      for (const text of [manual, auto, withFixed]) {
        expect(text, code).toMatch(/\d/);
        expect(text, code).not.toMatch(/NaN|undefined|Infinity/);
      }
    }
  });
});
