import { describe, it, expect } from "vitest";
import { signWhopPayload, verifyWhopWebhook, buildWhopCheckoutConfig, whopMoney, WHOP_COUNTRIES as SERVER_COUNTRIES } from "../../supabase/functions/_shared/whop";
import { WHOP_COUNTRIES } from "@/lib/whopCountries";

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
  it("arma la configuración de checkout en pesos con el importe del servidor", () => {
    const body = buildWhopCheckoutConfig({ accountId: "biz_1", productId: "prod_1", orderId: "ILR-WH-ABC123DEF4", title: "iLingue Relax · 1x Patrones", amount: 59900.4, currency: "COP", methods: ["nequi", "addi"] }) as any;
    expect(body.metadata).toEqual({ order_id: "ILR-WH-ABC123DEF4" });
    expect(body.account_id).toBe("biz_1");
    expect(body.variant.currency).toBe("cop");
    expect(body.variant.initial_price).toBe(59900);
    expect(body.variant.billing_type).toBe("one_time");
    expect(body.variant.visibility).toBe("hidden");
    expect(buildWhopCheckoutConfig({ orderId: "x", title: "Un título larguísimo de un producto de iLingue Relax", amount: 1000, currency: "COP", methods: ["nequi"] }) as any).toHaveProperty("variant.title");
    expect(((buildWhopCheckoutConfig({ orderId: "x", title: "Un título larguísimo de un producto de iLingue Relax", amount: 1000, currency: "COP", methods: ["nequi"] }) as any).variant.title as string).length).toBeLessThanOrEqual(30);
    expect(body.variant.payment_method_configuration).toEqual({ enabled: ["nequi", "addi"], disabled: [], include_platform_defaults: false });
    expect((buildWhopCheckoutConfig({ productId: "prod_1", orderId: "x", title: "t", amount: 1000, currency: "COP", methods: ["nequi"] }) as any).account_id).toBeUndefined();
    expect((buildWhopCheckoutConfig({ orderId: "x", title: "t", amount: 1000, currency: "CLP", methods: ["mercado_pago"] }) as any).variant.product_id).toBeUndefined();
  });
  it("los países de Whop del navegador y del servidor coinciden (Colombia, Chile, Argentina)", () => {
    expect(WHOP_COUNTRIES).toEqual(SERVER_COUNTRIES);
    expect(Object.keys(WHOP_COUNTRIES).sort()).toEqual(["AR", "CL", "CO"]);
    // Colombia: Nequi y Addi van en filas separadas; Chile y Argentina solo billetera.
    expect(WHOP_COUNTRIES.CO.wallet).toEqual(["nequi"]);
    expect(WHOP_COUNTRIES.CO.installments).toEqual(["addi"]);
    expect(WHOP_COUNTRIES.CL).toEqual({ currency: "CLP", wallet: ["mercado_pago"] });
    expect(WHOP_COUNTRIES.AR).toEqual({ currency: "ARS", wallet: ["mercado_pago_ar", "modo"] });
  });
  it("lee importes Money", () => {
    expect(whopMoney({ amount: "59900.00", currency: "cop" })).toEqual({ amount: 59900, currency: "COP" });
    expect(whopMoney(null)).toBeNull();
  });
});
