// Normaliza país a { code: ISO alpha-2, name: nombre en español } para
// que Brevo reciba SIEMPRE el mismo formato en compras y abandonos.

const NAME_TO_CODE: Record<string, string> = {
  "peru": "PE", "perú": "PE",
  "mexico": "MX", "méxico": "MX",
  "argentina": "AR",
  "colombia": "CO",
  "chile": "CL",
  "venezuela": "VE",
  "cuba": "CU",
  "nicaragua": "NI",
  "ecuador": "EC",
  "bolivia": "BO",
  "paraguay": "PY",
  "uruguay": "UY",
  "guatemala": "GT",
  "honduras": "HN",
  "el salvador": "SV",
  "costa rica": "CR",
  "panama": "PA", "panamá": "PA",
  "republica dominicana": "DO", "república dominicana": "DO", "dominican republic": "DO",
  "puerto rico": "PR",
  "brasil": "BR", "brazil": "BR",
  "estados unidos": "US", "united states": "US", "usa": "US", "eeuu": "US", "ee.uu.": "US",
  "canada": "CA", "canadá": "CA",
  "espana": "ES", "españa": "ES", "spain": "ES",
  "francia": "FR", "france": "FR",
  "alemania": "DE", "germany": "DE",
  "italia": "IT", "italy": "IT",
  "portugal": "PT",
  "reino unido": "GB", "united kingdom": "GB", "uk": "GB",
  "paises bajos": "NL", "países bajos": "NL", "netherlands": "NL", "holanda": "NL",
  "belgica": "BE", "bélgica": "BE",
  "suiza": "CH", "switzerland": "CH",
  "austria": "AT",
  "irlanda": "IE",
  "japon": "JP", "japón": "JP", "japan": "JP",
  "china": "CN",
  "corea del sur": "KR", "corea": "KR", "south korea": "KR",
  "india": "IN",
  "australia": "AU",
  "nueva zelanda": "NZ", "new zealand": "NZ",
};

const CODE_TO_NAME: Record<string, string> = {
  PE: "Perú", MX: "México", AR: "Argentina", CO: "Colombia", CL: "Chile",
  VE: "Venezuela", CU: "Cuba", NI: "Nicaragua", EC: "Ecuador", BO: "Bolivia",
  PY: "Paraguay", UY: "Uruguay", GT: "Guatemala", HN: "Honduras", SV: "El Salvador",
  CR: "Costa Rica", PA: "Panamá", DO: "República Dominicana", PR: "Puerto Rico",
  BR: "Brasil", US: "Estados Unidos", CA: "Canadá", ES: "España", FR: "Francia",
  DE: "Alemania", IT: "Italia", PT: "Portugal", GB: "Reino Unido", NL: "Países Bajos",
  BE: "Bélgica", CH: "Suiza", AT: "Austria", IE: "Irlanda",
  JP: "Japón", CN: "China", KR: "Corea del Sur", IN: "India",
  AU: "Australia", NZ: "Nueva Zelanda",
};

export interface NormalizedCountry {
  code?: string;  // ISO alpha-2 (ej. "PE")
  name?: string;  // nombre legible (ej. "Perú")
  status: "ok" | "missing" | "invalid";
  raw?: string;
}

export function normalizeCountry(raw?: string | null): NormalizedCountry {
  const trimmed = (raw ?? "").toString().trim();
  if (!trimmed) return { status: "missing" };

  // ISO alpha-2 directo
  if (/^[a-zA-Z]{2}$/.test(trimmed)) {
    const code = trimmed.toUpperCase();
    return { code, name: CODE_TO_NAME[code] ?? code, status: "ok", raw: trimmed };
  }

  // Nombre en español/inglés
  const key = trimmed.toLowerCase().normalize("NFC");
  const code = NAME_TO_CODE[key];
  if (code) {
    return { code, name: CODE_TO_NAME[code] ?? trimmed, status: "ok", raw: trimmed };
  }

  return { status: "invalid", raw: trimmed };
}
