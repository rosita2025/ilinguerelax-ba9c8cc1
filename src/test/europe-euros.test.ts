import { describe, expect, it } from "vitest";
import { detectCurrency } from "@/i18n";

// Toda Europa ve y paga en euros (un solo precio de Europa); LATAM, USA y Asia no cambian.
describe("moneda por país", () => {
  it.each(["ES", "FR", "DE", "IT", "PT", "GB", "CH", "SE", "NO", "DK", "PL", "CZ", "RO", "HU", "BG"])("%s → EUR", (c) => {
    expect(detectCurrency(c)).toBe("EUR");
  });
  it("el resto no cambia", () => {
    expect(detectCurrency("US")).toBe("USD");
    expect(detectCurrency("CA")).toBe("CAD");
    expect(detectCurrency("MX")).toBe("MXN");
    expect(detectCurrency("PE")).toBe("PEN");
    expect(detectCurrency("JP")).toBe("JPY");
    expect(detectCurrency("AU")).toBe("AUD");
  });
});
