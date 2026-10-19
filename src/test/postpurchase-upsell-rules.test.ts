import { describe, expect, it } from "vitest";
import fs from "node:fs";

const source = fs.readFileSync("supabase/functions/process-postpurchase-upsell/index.ts", "utf8");
const pendingExpression = source.match(/const pending = (configured\.filter\([^\n]+);/)?.[1];
const languageExpression = source.match(/const lang = ([^\n]+);/)?.[1];
if (!pendingExpression || !languageExpression) throw new Error("Upsell rules not found");
const pending = new Function("configured", "info", "owned", `return ${pendingExpression}`) as
  (configured: string[], info: {mainSku: string}, owned: Set<string>) => string[];
const language = new Function("p", `return ${languageExpression.replace(/\(p as \{ learner_language\?: string \| null \}\)/, "p")}`) as
  (p: {learner_language: string}) => string;

describe("postpurchase offer rules", () => {
  it("offers all configured extras when none are owned", () => {
    expect(pending(["verbs", "questions"], {mainSku: "patterns"}, new Set(["patterns"]))).toEqual(["verbs", "questions"]);
  });
  it("offers only the missing extra", () => {
    expect(pending(["verbs", "questions"], {mainSku: "patterns"}, new Set(["verbs"]))).toEqual(["questions"]);
  });
  it("never offers the source product", () => {
    expect(pending(["patterns", "verbs"], {mainSku: "patterns"}, new Set())).toEqual(["verbs"]);
  });
  it("offers nothing for a complete bundle", () => {
    expect(pending(["verbs", "questions"], {mainSku: "patterns"}, new Set(["verbs", "questions"]))).toEqual([]);
  });
  it("offers nothing without configured extras", () => {
    expect(pending([], {mainSku: "patterns"}, new Set())).toEqual([]);
  });
  it("uses English for the English learner audience", () => {
    expect(language({learner_language: "en"})).toBe("en");
  });
  it("uses Spanish for other learner audiences", () => {
    expect(language({learner_language: "es"})).toBe("es");
    expect(language({learner_language: "fr"})).toBe("es");
  });
});