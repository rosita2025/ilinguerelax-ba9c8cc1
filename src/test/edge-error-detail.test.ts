import { describe, it, expect } from "vitest";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { extractEdgeErrorMessage } from "@/lib/edgeError";

describe("extractEdgeErrorMessage", () => {
  it("usa el detalle ya leído (edgeDetail) aunque el body ya se consumió: antes salía solo «HTTP 400»", async () => {
    const res = new Response(JSON.stringify({ error: "No pudimos procesar el pago" }), { status: 400 });
    const err = new FunctionsHttpError(res);
    // Primera lectura (invokeWithRetry): consume el body y guarda el mensaje.
    (err as { edgeDetail?: string }).edgeDetail = (await extractEdgeErrorMessage(err)) ?? undefined;
    expect(await extractEdgeErrorMessage(err)).toBe("No pudimos procesar el pago");
  });

  it("incluye el motivo de dLocal enviado en details", async () => {
    const res = new Response(JSON.stringify({ error: "No pudimos procesar el pago con dLocal Go.", details: { dlocal: ["5000: invalid document"] } }), { status: 400 });
    expect(await extractEdgeErrorMessage(new FunctionsHttpError(res))).toContain("dlocal: 5000: invalid document");
  });
});
