import { describe, expect, it } from "vitest";
import { itemPrice } from "@/stores/checkoutStore";
import { priceTierOf } from "@/lib/priceRegions";

// El checkout debe cobrar el mismo precio de región que muestra la página y calcula el servidor.
const item = { id: "x", name: "x", price: 70, quantity: 1, image: "", regionPrices: { latam: 45, global: 70, tienda: 60 } };

describe("precio de región en el checkout", () => {
  it.each([["MX", 45], ["VE", 45], ["CU", 45], ["NI", 45], ["PE", 45], ["US", 70], ["CA", 70], ["ES", 70], ["GB", 70], ["JP", 60], ["AE", 60], ["NG", 60], ["TH", 60]])("%s → US$ %s", (country, usd) => {
    localStorage.setItem("ilr_country", country); // el caso viejo de VE/CU/NI leía esta clave
    expect(itemPrice(item, priceTierOf(country))).toBe(usd);
  });
  it("sin precio de región usa el precio base", () => {
    expect(itemPrice({ ...item, regionPrices: undefined }, "tienda")).toBe(70);
  });
});
