import { describe, it, expect } from "vitest";
import { MANUAL_BANKS, manualBankFor, bankAmount, isManualBankId, SEPA_COUNTRIES } from "@/lib/manualBankTransfers";
import { exchangeRates } from "@/i18n";

describe("cuentas bancarias manuales (Wise)", () => {
  it("elige la cuenta según el país del comprador", () => {
    expect(manualBankFor("ES")?.id).toBe("sepa_eu");
    expect(manualBankFor("DE")?.id).toBe("sepa_eu");
    expect(manualBankFor("BE")?.id).toBe("sepa_eu");
    expect(manualBankFor("GB")?.id).toBe("gbp_uk");
    expect(manualBankFor("UK")?.id).toBe("gbp_uk");
    expect(manualBankFor("CA")?.id).toBe("cad_ca");
    expect(manualBankFor("CN")?.id).toBe("cny_cn");
    // Sin cuenta manual: países con su propio método o fuera de SEPA.
    for (const c of ["US", "MX", "CO", "PE", "TR", "UA", "AR", ""]) expect(manualBankFor(c)).toBeNull();
    expect(SEPA_COUNTRIES.has("GB")).toBe(false);
  });

  it("conserva los datos exactos de las cuentas", () => {
    const f = (id: keyof typeof MANUAL_BANKS) => Object.fromEntries(MANUAL_BANKS[id].fields.map((x) => [x.label, x.value]));
    expect(f("sepa_eu")).toEqual({ IBAN: "BE50 9030 6580 1718", "BIC / SWIFT": "TRWIBEB1XXX" });
    expect(f("gbp_uk")).toEqual({ "Sort code": "60-84-64", "Account number": "49021086", IBAN: "GB95 TRWI 6084 6449 0210 86" });
    expect(f("cad_ca")).toEqual({ "Institution number": "621", "Transit number": "16001", "Account number": "200117473724" });
    expect(f("cny_cn")).toEqual({ IBAN: "GB95 TRWI 6084 6449 0210 86", "SWIFT / BIC": "TRWIGB2LXXX" });
    for (const b of Object.values(MANUAL_BANKS)) expect(b.holder).toBe("Youtumundial");
    expect(isManualBankId("sepa_eu")).toBe(true);
    expect(isManualBankId("bre_b_co")).toBe(false);
  });

  it("calcula el monto: igual si ya está en esa moneda, convertido si no", () => {
    const eur = MANUAL_BANKS.sepa_eu;
    const gbp = MANUAL_BANKS.gbp_uk;
    // Ya en euros (con upsell y cupón incluidos): tal cual.
    expect(bankAmount(eur, { currency: "EUR", amount: 33.9 }, 37)).toBe(33.9);
    // El Reino Unido ve euros y paga en libras: se convierte desde euros.
    const r = exchangeRates as Record<string, number>;
    expect(bankAmount(gbp, { currency: "EUR", amount: 22 }, 24.4)).toBe(Math.round((22 / r.EUR) * r.GBP * 100) / 100);
    // Mientras no se conoce el precio local: desde US$.
    expect(bankAmount(gbp, { loading: true }, 10)).toBe(Math.round(10 * r.GBP * 100) / 100);
  });
});
