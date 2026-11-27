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
