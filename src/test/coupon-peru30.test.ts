import { beforeEach, describe, expect, it } from "vitest";
import { useCheckoutPruebaStore } from "@/stores/checkoutStore";

const item = (id: string) => ({ id, name: id, price: 20, quantity: 1 }) as never;

describe("cupón PERU30 (30 %, solo Perú y solo con Patrones)", () => {
  beforeEach(() => {
    localStorage.clear();
    useCheckoutPruebaStore.setState({ items: [item("patrones-ingles")], coupon: null, couponPercent: 0 });
  });
  it("se aplica en Perú con Patrones en el carrito", () => {
    localStorage.setItem("ilr_country", "PE");
    expect(useCheckoutPruebaStore.getState().applyCoupon("peru30")).toBe(true);
    expect(useCheckoutPruebaStore.getState().couponPercent).toBe(30);
  });
  it("no se aplica fuera de Perú ni sin país conocido", () => {
    localStorage.setItem("ilr_country", "MX");
    expect(useCheckoutPruebaStore.getState().applyCoupon("PERU30")).toBe(false);
    localStorage.removeItem("ilr_country");
    expect(useCheckoutPruebaStore.getState().applyCoupon("PERU30")).toBe(false);
  });
  it("no se aplica si el carrito no lleva Patrones", () => {
    localStorage.setItem("ilr_country", "PE");
    useCheckoutPruebaStore.setState({ items: [item("5000-palabras-ingles")] });
    expect(useCheckoutPruebaStore.getState().applyCoupon("PERU30")).toBe(false);
  });
});
