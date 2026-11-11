import { describe, expect, it } from "vitest";
import fs from "node:fs";

// El navegador y el servidor deben tener tasa para las MISMAS monedas y con los mismos valores: si falta una en el servidor, cobra en US$
// aunque la página muestre la moneda local (el comprador ve un monto y paga otro).
const table = (path: string, start: RegExp): Record<string, number> => {
  const s = fs.readFileSync(path, "utf8");
  const m = start.exec(s)!;
  const body = s.slice(m.index + m[0].length, s.indexOf("};", m.index));
  return Object.fromEntries([...body.matchAll(/\b([A-Z]{3}):\s*([\d.]+)/g)].map((x) => [x[1], Number(x[2])]));
};
const client = table("src/i18n/index.ts", /export let exchangeRates[^=]*=\s*\{/);
const server = table("supabase/functions/_shared/fxRates.ts", /export const FX_USD_TO_LOCAL[^=]*=\s*\{/);

describe("tasas de cambio: navegador = servidor", () => {
  it("el servidor tiene tasa para cada moneda del navegador", () => {
    expect(Object.keys(client).filter((c) => !(c in server))).toEqual([]);
  });
  it("las tasas estáticas coinciden", () => {
    for (const [c, r] of Object.entries(client)) expect(server[c], c).toBe(r);
  });
});
