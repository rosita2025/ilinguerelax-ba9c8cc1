import { describe, it, expect, beforeEach } from "vitest";
import { popupDelayFor } from "@/components/EmailSubscribePopup";

const PATRONES = "/products/patrones-especiales-alfabeto-combinaciones-secretas-ingles";

describe("popupDelayFor", () => {
  beforeEach(() => sessionStorage.clear());
  it("otras páginas: 15 s", () => {
    expect(popupDelayFor("/")).toBe(15000);
    expect(popupDelayFor("/products/otro")).toBe(15000);
  });
  it("Patrones: entre 2 y 55 min", () => {
    expect(popupDelayFor(PATRONES, 0, 0)).toBe(2 * 60_000);
    sessionStorage.clear();
    expect(popupDelayFor(PATRONES, 0, 1)).toBe(55 * 60_000);
  });
  it("Patrones: no se vuelve a sortear al recargar", () => {
    const first = popupDelayFor(PATRONES, 0, 0.5);
    expect(popupDelayFor(PATRONES, 60_000, 0.99)).toBe(first - 60_000);
  });
});
