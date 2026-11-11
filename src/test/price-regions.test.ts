import { describe, expect, it } from "vitest";
import { priceRegionOf as clientRegion, priceTierOf as clientTier, tierUsd } from "@/lib/priceRegions";
import { priceRegionOf as serverRegion, priceTierOf as serverTier } from "../../supabase/functions/_shared/priceRegions";

// Todos los códigos ISO-2 (AA..ZZ): el navegador y el servidor deben clasificar IGUAL, si no el cobro no coincide con el precio mostrado.
const ALL: string[] = [];
for (let a = 65; a <= 90; a++) for (let b = 65; b <= 90; b++) ALL.push(String.fromCharCode(a, b));

describe("regiones de precio: navegador = servidor", () => {
  it("misma región y mismo precio para todos los países", () => {
    for (const c of ALL) {
      expect(serverRegion(c), c).toBe(clientRegion(c));
      expect(serverTier(c), c).toBe(clientTier(c));
    }
  });

  it("clasificación esperada", () => {
    expect(clientRegion("MX")).toBe("latam");
    expect(clientRegion("VE")).toBe("latam");
    expect(clientRegion("ES")).toBe("europe");
    expect(clientRegion("US")).toBe("northam");
    expect(clientRegion("CA")).toBe("northam");
    expect(clientRegion("JP")).toBe("asia");
    expect(clientRegion("NG")).toBe("rest");
    expect(clientTier("PE")).toBe("latam");
    expect(clientTier("DE")).toBe("global");
    expect(clientTier("US")).toBe("global");
    expect(clientTier("JP")).toBe("tienda");
    expect(clientTier("AU")).toBe("global");
  });

  it("sin precio propio de la región se usa el global", () => {
    const row = { price_usd: 70, price_usd_latam: null, price_usd_tienda: null };
    expect(tierUsd(row, "latam")).toBe(70);
    expect(tierUsd(row, "tienda")).toBe(70);
    expect(tierUsd({ ...row, price_usd_latam: 45, price_usd_tienda: 60 }, "latam")).toBe(45);
    expect(tierUsd({ ...row, price_usd_latam: 45, price_usd_tienda: 60 }, "tienda")).toBe(60);
    expect(tierUsd({ ...row, price_usd_latam: 45, price_usd_tienda: 60 }, "global")).toBe(70);
  });
});
