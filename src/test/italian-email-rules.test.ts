import { describe, expect, it } from "vitest";
import fs from "node:fs";
import ts from "typescript";

const compile = (source: string) => ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
const delivery = fs.readFileSync("supabase/functions/send-digital-ilinguerelax/index.ts", "utf8");
const declarations = delivery.slice(delivery.indexOf("type Lang ="), delivery.indexOf("const T:"));
const resolver = delivery.slice(delivery.indexOf("async function resolveLang("), delivery.indexOf("/**", delivery.indexOf("async function resolveLang(")));
const resolveDelivery = new Function("detectLangFromIP", `${compile(declarations + resolver)}; return resolveLang;`)(async () => ({})) as
  (client: unknown, explicit?: string, country?: string) => Promise<{lang: string}>;
const countryClient = { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) }) };

const thanks = fs.readFileSync("supabase/functions/_shared/thankYouEmail.ts", "utf8");
const thanksResolver = thanks.slice(thanks.indexOf("async function resolveEmailLang("), thanks.indexOf("function getClient()"));
const resolveThanks = (rows: {sku: string; learner_language: string}[], skus: string[]) => {
  const getClient = () => ({ from: () => ({ select: () => ({ in: async () => ({ data: rows }) }) }) });
  return new Function("getClient", `${compile(thanksResolver)}; return resolveEmailLang;`)(getClient)(skus) as Promise<string | undefined>;
};

const drip = fs.readFileSync("supabase/functions/_shared/dripTemplates.ts", "utf8");
const cardSource = drip.slice(drip.indexOf("const CARDS_HISPANO"), drip.indexOf("// ---------------- Per-step"));
const cardsFor = new Function(`${compile(cardSource)}; return cardsFor;`)() as (lang: string) => {name: string; slug: string}[];

describe("Italian email audience rules without sending", () => {
  it("uses Italy, San Marino and Vatican as Italian delivery fallbacks", async () => {
    for (const country of ["IT", "SM", "VA"]) expect((await resolveDelivery(countryClient, undefined, country)).lang).toBe("it");
  });
  it("retains explicit product language above country fallback", async () => {
    expect((await resolveDelivery(countryClient, "it", "US")).lang).toBe("it");
    expect((await resolveDelivery(countryClient, "es", "IT")).lang).toBe("es");
  });
  it("retains Spanish, English, French and Portuguese delivery", async () => {
    for (const lang of ["es", "en", "fr", "pt"]) expect((await resolveDelivery(countryClient, lang, "IT")).lang).toBe(lang);
  });
  it("uses the primary SKU order for Italian thank-you language", async () => {
    const rows = [{sku: "extra", learner_language: "es"}, {sku: "main", learner_language: "it"}];
    expect(await resolveThanks(rows, ["main", "extra"])).toBe("it");
    expect(await resolveThanks(rows, ["extra", "main"])).toBeUndefined();
  });
  it("keeps other thank-you audiences on the previous default", async () => {
    for (const lang of ["es", "en", "fr", "pt"]) expect(await resolveThanks([{sku: "main", learner_language: lang}], ["main"])).toBeUndefined();
    expect(await resolveThanks([], [])).toBeUndefined();
  });
  it("keeps Italian marketing recommendations empty rather than recommending Spanish-audience products", () => {
    expect(cardsFor("it")).toEqual([]);
    expect(cardsFor("es")).toHaveLength(5);
    expect(cardsFor("pt")).toEqual(cardsFor("es"));
    expect(cardsFor("en")[0].slug).toBe("5-000-spanish-words-with-english-pronunciation-digital");
  });
});