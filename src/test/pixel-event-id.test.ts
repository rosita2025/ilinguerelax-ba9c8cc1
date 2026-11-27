// @vitest-environment jsdom
// @vitest-environment-options {"url":"https://ilinguerelax.com/checkouts/success"}
import { beforeEach, describe, expect, it, vi } from "vitest";

// Meta solo junta el evento del navegador con el del servidor (CAPI) si el eventID va en el 4.º argumento de fbq
// (`fbq('track', nombre, datos, { eventID })`). Dentro de los datos no cuenta como ID y cada compra se contaba dos veces.
describe("fbq envía eventID como opción", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 200 })));
  });

  it("Purchase usa Purchase_<pedido> en el 4.º argumento y no en los datos", async () => {
    const calls: unknown[][] = [];
    (window as any).fbq = (...a: unknown[]) => { calls.push(a); };
    document.cookie = "_fbc=fb.1.1700000000000.TESTCLICK"; // visita que vino de un anuncio de Meta
    const mod = await import("@/hooks/useMetaPixel");
    mod.trackHotmartEvent("Purchase", { value: 10, currency: "USD", order_id: "ILR-ST-ABCD1234", __skipFunnelLog: true });
    const purchase = calls.find((c) => c[0] === "track" && c[1] === "Purchase");
    expect(purchase).toBeDefined();
    expect(purchase[3]).toEqual({ eventID: "Purchase_ILR-ST-ABCD1234" });
    expect((purchase[2] as Record<string, unknown>).eventID).toBeUndefined();
  });
});

// index.html y la app comparten marcas para no iniciar el Pixel dos veces ni mandar dos PageView por carga.
import { readFileSync } from "node:fs";
describe("Pixel: sin doble inicio ni doble PageView", () => {
  it("index.html solo inicia el Pixel si la app no lo hizo y marca el PageView", () => {
    const html = readFileSync("index.html", "utf8");
    expect(html).toContain("if (!window.__ilrFbInit)");
    expect(html).toContain("if (!window.__ilrPvSent)");
  });
  it("la app marca __ilrFbInit al iniciar el Pixel y __ilrPvSent al mandar PageView", () => {
    const src = readFileSync("src/hooks/useMetaPixel.ts", "utf8");
    expect(src).toContain("window.__ilrFbInit = true;");
    expect(src).toContain("w.__ilrPvSent = true;");
  });
});
