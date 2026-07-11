// Plantillas regionales de códigos ISO-3166-1 alpha-2 para exclusiones por canal.

export const REGIONS: Record<string, { label: string; codes: string[] }> = {
  latam: {
    label: "🌎 LATAM (América Latina)",
    codes: ["MX", "GT", "HN", "SV", "NI", "CR", "PA", "CU", "DO", "PR", "CO", "VE", "EC", "PE", "BO", "BR", "PY", "UY", "AR", "CL"],
  },
  south_america: {
    label: "🌎 América del Sur",
    codes: ["CO", "VE", "EC", "PE", "BO", "BR", "PY", "UY", "AR", "CL", "GY", "SR"],
  },
  central_america: {
    label: "🌎 América Central",
    codes: ["GT", "HN", "SV", "NI", "CR", "PA", "BZ"],
  },
  north_america: {
    label: "🌎 América del Norte",
    codes: ["US", "CA", "MX"],
  },
  caribbean: {
    label: "🏝️ Caribe (incl. Puerto Rico)",
    codes: ["CU", "DO", "PR", "JM", "HT", "TT", "BS", "BB"],
  },
  english_speaking: {
    label: "🇺🇸 Angloparlantes",
    codes: ["US", "CA", "GB", "IE", "AU", "NZ", "ZA"],
  },
  europe: {
    label: "🇪🇺 Europa",
    codes: ["ES", "PT", "FR", "GB", "IE", "DE", "IT", "NL", "BE", "CH", "AT", "SE", "NO", "DK", "FI", "PL", "CZ", "RO", "GR", "TR", "UA"],
  },
  asia: {
    label: "🌏 Asia",
    codes: ["CN", "JP", "KR", "TW", "HK", "SG", "MY", "TH", "VN", "ID", "PH", "IN", "PK", "BD", "AE", "SA", "IL"],
  },
  oceania: {
    label: "🌏 Oceanía",
    codes: ["AU", "NZ", "FJ", "PG"],
  },
  africa: {
    label: "🌍 África",
    codes: ["ZA", "NG", "KE", "EG", "MA", "DZ", "TN", "GH", "ET", "TZ", "UG", "SN", "CI"],
  },
  spain_only: {
    label: "🇪🇸 Solo España",
    codes: ["ES"],
  },
};

export const REGION_KEYS = Object.keys(REGIONS);
