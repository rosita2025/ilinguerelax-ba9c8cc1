import { describe, it, expect } from "vitest";
import { signWhopPayload, verifyWhopWebhook, parseWhopPlanMap, whopMoney } from "../../supabase/functions/_shared/whop";

const SECRET = "ws_0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const BODY = JSON.stringify({ id: "msg_1", type: "payment.succeeded", data: { id: "pay_1" } });

describe("whop webhook", () => {
  it("acepta una firma válida y reciente", async () => {
    const ts = String(Math.floor(Date.now() / 1000));
    const sig = await signWhopPayload(SECRET, "msg_1", ts, BODY);
    expect(await verifyWhopWebhook(BODY, { "webhook-id": "msg_1", "webhook-timestamp": ts, "webhook-signature": sig }, SECRET)).toBe(true);
  });
  it("acepta varias firmas en el encabezado", async () => {
    const ts = String(Math.floor(Date.now() / 1000));
    const sig = await signWhopPayload(SECRET, "msg_1", ts, BODY);
    expect(await verifyWhopWebhook(BODY, { "webhook-id": "msg_1", "webhook-timestamp": ts, "webhook-signature": `v1,AAAA ${sig}` }, SECRET)).toBe(true);
  });
  it("rechaza cuerpo alterado, secreto distinto y avisos viejos", async () => {
    const ts = String(Math.floor(Date.now() / 1000));
    const sig = await signWhopPayload(SECRET, "msg_1", ts, BODY);
    const h = { "webhook-id": "msg_1", "webhook-timestamp": ts, "webhook-signature": sig };
    expect(await verifyWhopWebhook(BODY.replace("pay_1", "pay_2"), h, SECRET)).toBe(false);
    expect(await verifyWhopWebhook(BODY, h, "ws_otro")).toBe(false);
    expect(await verifyWhopWebhook(BODY, h, undefined)).toBe(false);
    expect(await verifyWhopWebhook(BODY, h, SECRET, { nowMs: Date.now() + 10 * 60 * 1000 })).toBe(false);
    expect(await verifyWhopWebhook(BODY, { "webhook-id": "msg_1" }, SECRET)).toBe(false);
  });
  it("lee el mapa de planes y descarta valores inválidos", () => {
    expect(parseWhopPlanMap('{"Patrones-Ingles":"plan_AbC123","x":"nope"}')).toEqual({ "patrones-ingles": "plan_AbC123" });
    expect(parseWhopPlanMap("no es json")).toEqual({});
    expect(parseWhopPlanMap(undefined)).toEqual({});
  });
  it("lee importes Money", () => {
    expect(whopMoney({ amount: "59900.00", currency: "cop" })).toEqual({ amount: 59900, currency: "COP" });
    expect(whopMoney(null)).toBeNull();
  });
});
