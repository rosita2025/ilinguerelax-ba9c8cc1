import type { LangCode } from "@/data/products";

export const LANG_LABEL: Record<LangCode, { flag: string; native: string; es: string; en: string }> = {
  es: { flag: "🇪🇸", native: "Español", es: "español", en: "Spanish" },
  en: { flag: "🇬🇧", native: "English", es: "inglés", en: "English" },
  fr: { flag: "🇫🇷", native: "Français", es: "francés", en: "French" },
  pt: { flag: "🇵🇹", native: "Português", es: "portugués", en: "Portuguese" },
  ko: { flag: "🇰🇷", native: "한국어", es: "coreano", en: "Korean" },
  de: { flag: "🇩🇪", native: "Deutsch", es: "alemán", en: "German" },
  it: { flag: "🇮🇹", native: "Italiano", es: "italiano", en: "Italian" },
  ja: { flag: "🇯🇵", native: "日本語", es: "japonés", en: "Japanese" },
  nl: { flag: "🇳🇱", native: "Nederlands", es: "neerlandés", en: "Dutch" },
  zh: { flag: "🇨🇳", native: "中文", es: "chino", en: "Chinese" },
};

/** Learning pairs that have real products in the catalog. */
export const LEARN_PAIRS: Array<[LangCode, LangCode]> = [
  ["es", "en"],
  ["es", "ko"],
  ["es", "fr"],
  ["es", "de"],
  ["es", "it"],
  ["es", "pt"],
  ["es", "nl"],
  ["en", "es"],
];

export const LEARN_PAIR_SLUGS = LEARN_PAIRS.map(([f, t]) => `${f}-${t}`);

export function parsePairSlug(slug?: string): [LangCode, LangCode] | null {
  if (!slug) return null;
  const [from, to] = slug.toLowerCase().split("-");
  const pair = LEARN_PAIRS.find(([f, t]) => f === from && t === to);
  return pair ?? null;
}

/** Best-guess pair for a visitor's UI language (from IP-based i18n). */
export function defaultPairFor(uiLang: string): [LangCode, LangCode] {
  switch (uiLang) {
    case "en": return ["en", "es"];
    case "fr": return ["fr", "es"] as any; // fr→es not yet, falls back
    case "pt": return ["pt", "es"] as any;
    case "es":
    default:  return ["es", "en"];
  }
}
