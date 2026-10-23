import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { CheckoutLanguageProvider, I18nProvider, useI18n } from "@/i18n/I18nContext";
import { detectCurrency, detectLanguage, detectLanguageFromCountry } from "@/i18n";
import { defaultPairFor, parsePairSlug } from "@/lib/learnPairs";

vi.mock("@/lib/geoDetection", () => ({ detectCountryByIp: () => new Promise(() => {}) }));

afterEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks(); });

describe("Italian audience language rules", () => {
  it("recognizes an Italian browser", () => {
    vi.spyOn(navigator, "language", "get").mockReturnValue("it-IT");
    expect(detectLanguage()).toBe("it");
  });
  it("uses Italian for Italy without changing its euro currency", () => {
    expect(detectLanguageFromCountry("IT")).toBe("it");
    expect(detectCurrency("IT")).toBe("EUR");
  });
  it("supports Italian speakers learning Spanish", () => {
    expect(parsePairSlug("it-es")).toEqual(["it", "es"]);
    expect(defaultPairFor("it")).toEqual(["it", "es"]);
  });
  it("scopes Italian to the product audience while keeping country and currency", () => {
    localStorage.setItem("ilingue_language", "es");
    localStorage.setItem("ilr_country", "US");
    const Probe = ({ name }: { name: string }) => {
      const { language, countryCode, currency } = useI18n();
      return <output data-testid={name}>{JSON.stringify({ language, countryCode, currency })}</output>;
    };
    render(<I18nProvider><Probe name="site" /><CheckoutLanguageProvider language="it"><Probe name="product" /></CheckoutLanguageProvider></I18nProvider>);
    expect(JSON.parse(screen.getByTestId("site").textContent || "{}")).toEqual({ language: "es", countryCode: "US", currency: "USD" });
    expect(JSON.parse(screen.getByTestId("product").textContent || "{}")).toEqual({ language: "it", countryCode: "US", currency: "USD" });
    expect(localStorage.getItem("ilingue_language")).toBe("es");
  });
  it("preserves the four existing browser languages", () => {
    for (const lang of ["es", "en", "fr", "pt"]) {
      vi.spyOn(navigator, "language", "get").mockReturnValue(lang);
      expect(detectLanguage()).toBe(lang);
    }
  });
});