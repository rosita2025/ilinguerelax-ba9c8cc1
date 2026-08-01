import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * La razón social "Youtumundial LLC" es información privada de la empresa.
 * Solo puede aparecer en:
 *   - páginas legales (términos, copyright, licencias, marca registrada),
 *     donde es obligatoria por ley
 *   - rutas de administración (no públicas)
 *
 * Nunca debe aparecer en el HTML público (index.html, home, productos, blog,
 * sobre nosotros, checkout...) ni en ningún dato estructurado JSON-LD.
 */

const ROOT = path.resolve(__dirname, "../..");
const FORBIDDEN = /youtumundial/i;

// Páginas legales: la razón social sí es válida (requisito legal).
const LEGAL_ALLOWLIST = [
  "src/pages/TermsPage.tsx",
  "src/pages/CopyrightPage.tsx",
  "src/pages/LicensesPage.tsx",
  "src/pages/TrademarkPage.tsx",
  "src/pages/PrivacyPage.tsx",
];

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "test") continue;
      walk(full, out);
    } else if (/\.(tsx?|html)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

function rel(file: string) {
  return path.relative(ROOT, file).split(path.sep).join("/");
}

function isAdmin(relPath: string) {
  return /(^|\/)Admin|\/admin\//i.test(relPath);
}

function isLegal(relPath: string) {
  return LEGAL_ALLOWLIST.includes(relPath);
}

describe("privacidad de marca: Youtumundial LLC no debe ser público", () => {
  it("index.html no menciona la razón social", () => {
    const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
    expect(FORBIDDEN.test(html)).toBe(false);
  });

  it("ningún bloque JSON-LD de index.html menciona la razón social", () => {
    const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
    const blocks = [...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)].map(
      (m) => m[1],
    );
    expect(blocks.length).toBeGreaterThan(0);
    for (const block of blocks) {
      // debe ser JSON válido y sin la razón social
      expect(() => JSON.parse(block)).not.toThrow();
      expect(FORBIDDEN.test(block)).toBe(false);
    }
  });

  it("el componente SEO no inyecta la razón social en datos estructurados", () => {
    const seo = fs.readFileSync(path.join(ROOT, "src/components/SEO.tsx"), "utf8");
    expect(FORBIDDEN.test(seo)).toBe(false);
  });

  it("las páginas y componentes públicos no muestran la razón social", () => {
    const offenders = walk(path.join(ROOT, "src"))
      .map(rel)
      .filter((r) => !isAdmin(r) && !isLegal(r))
      .filter((r) => FORBIDDEN.test(fs.readFileSync(path.join(ROOT, r), "utf8")));

    expect(offenders).toEqual([]);
  });
});
