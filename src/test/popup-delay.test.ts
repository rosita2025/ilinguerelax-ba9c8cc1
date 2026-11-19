import { describe, it, expect, beforeEach } from "vitest";
import { popupDelayFor } from "@/components/EmailSubscribePopup";

const PATRONES = "/products/patrones-especiales-alfabeto-combinaciones-secretas-ingles";

describe("popupDelayFor", () => {
  beforeEach(() => sessionStorage.clear());
  it("otras páginas: 15 s", () => {
    expect(popupDelayFor("/")).toBe(15000);
    expect(popupDelayFor("/products/otro")).toBe(15000);
  });
  it("Patrones: 1 minuto y 55 segundos después de entrar", () => {
    expect(popupDelayFor(PATRONES, 0)).toBe(115_000);
  });
  it("Patrones: no se reinicia al recargar", () => {
    const first = popupDelayFor(PATRONES, 0);
    expect(popupDelayFor(PATRONES, 20_000)).toBe(first - 20_000);
    expect(popupDelayFor(PATRONES, 130_000)).toBe(0);
  });
});
