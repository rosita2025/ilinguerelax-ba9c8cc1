export type CountryDetectionSource = "ip" | "timezone" | "fallback";

export interface CountryDetectionResult {
  countryCode: string;
  source: CountryDetectionSource;
  provider?: string;
}

const DEFAULT_TIMEOUT_MS = 2500;

const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  "America/Lima": "PE",
  "America/Bogota": "CO",
  "America/Mexico_City": "MX", "America/Monterrey": "MX", "America/Cancun": "MX", "America/Tijuana": "MX", "America/Chihuahua": "MX", "America/Hermosillo": "MX", "America/Merida": "MX", "America/Mazatlan": "MX",
  "America/Argentina/Buenos_Aires": "AR", "America/Argentina/Cordoba": "AR", "America/Argentina/Mendoza": "AR", "America/Argentina/Salta": "AR", "America/Argentina/Tucuman": "AR", "America/Argentina/Ushuaia": "AR", "America/Argentina/Rio_Gallegos": "AR", "America/Argentina/San_Juan": "AR", "America/Argentina/San_Luis": "AR", "America/Argentina/La_Rioja": "AR", "America/Argentina/Catamarca": "AR", "America/Argentina/Jujuy": "AR", "America/Buenos_Aires": "AR",
  "America/Santiago": "CL", "Pacific/Easter": "CL",
  "America/Sao_Paulo": "BR", "America/Bahia": "BR", "America/Fortaleza": "BR", "America/Recife": "BR", "America/Manaus": "BR", "America/Belem": "BR", "America/Cuiaba": "BR", "America/Maceio": "BR", "America/Noronha": "BR", "America/Porto_Velho": "BR", "America/Rio_Branco": "BR", "America/Araguaina": "BR",
  "America/Montevideo": "UY",
  "America/La_Paz": "BO",
  "America/Asuncion": "PY",
  "America/Guatemala": "GT",
  "America/Santo_Domingo": "DO",
  "America/Costa_Rica": "CR",
  "America/Tegucigalpa": "HN",
  "America/Managua": "NI",
  "America/Caracas": "VE",
  "America/Panama": "PA",
  "America/Guayaquil": "EC", "Pacific/Galapagos": "EC",
  "America/El_Salvador": "SV",
  "America/New_York": "US", "America/Chicago": "US", "America/Denver": "US", "America/Los_Angeles": "US", "America/Phoenix": "US", "America/Anchorage": "US", "Pacific/Honolulu": "US",
  "America/Toronto": "CA", "America/Vancouver": "CA", "America/Edmonton": "CA", "America/Winnipeg": "CA", "America/Halifax": "CA", "America/St_Johns": "CA", "America/Montreal": "CA",
  "Europe/Madrid": "ES", "Europe/Paris": "FR", "Europe/Berlin": "DE", "Europe/Rome": "IT", "Europe/Lisbon": "PT", "Europe/Dublin": "IE", "Europe/Amsterdam": "NL", "Europe/Brussels": "BE", "Europe/Vienna": "AT", "Europe/Helsinki": "FI", "Europe/Athens": "GR", "Europe/Luxembourg": "LU", "Europe/Bratislava": "SK", "Europe/Ljubljana": "SI", "Europe/Tallinn": "EE", "Europe/Riga": "LV", "Europe/Vilnius": "LT", "Europe/Malta": "MT", "Asia/Nicosia": "CY", "Europe/Zagreb": "HR",
  "Europe/London": "GB",
  "Australia/Sydney": "AU", "Australia/Melbourne": "AU", "Australia/Brisbane": "AU", "Australia/Perth": "AU", "Australia/Adelaide": "AU", "Australia/Hobart": "AU", "Australia/Darwin": "AU",
  "Pacific/Auckland": "NZ", "Pacific/Chatham": "NZ",
  "Europe/Stockholm": "SE",
  "Europe/Oslo": "NO",
  "Europe/Copenhagen": "DK",
  "Europe/Zurich": "CH",
  "Asia/Tokyo": "JP",
  "Asia/Seoul": "KR",
  "Asia/Singapore": "SG",
  "Asia/Hong_Kong": "HK",
  "Asia/Taipei": "TW",
};

const PROVIDERS: Array<{
  name: string;
  url: string;
  parse: (data: unknown) => string | null;
}> = [
  {
    name: "ipapi",
    url: "https://ipapi.co/json/",
    parse: (data) => {
      const row = data as { error?: boolean; country_code?: string; country?: string };
      if (row?.error) return null;
      return row.country_code || row.country || null;
    },
  },
  {
    name: "ipwho",
    url: "https://ipwho.is/",
    parse: (data) => {
      const row = data as { success?: boolean; country_code?: string; country?: string };
      if (row?.success === false) return null;
      return row.country_code || row.country || null;
    },
  },
  {
    name: "country-is",
    url: "https://api.country.is/",
    parse: (data) => (data as { country?: string })?.country || null,
  },
];

function cleanCountryCode(value: string | null | undefined): string | null {
  const code = value?.trim().toUpperCase();
  return code && /^[A-Z]{2}$/.test(code) ? code : null;
}

function timeoutSignal(ms: number): AbortSignal | undefined {
  try {
    if (typeof AbortSignal !== "undefined" && "timeout" in AbortSignal) {
      return AbortSignal.timeout(ms);
    }
  } catch { /* ignore */ }
  return undefined;
}

export function getCountryFromTimezone(): string | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return cleanCountryCode(TIMEZONE_TO_COUNTRY[tz]);
  } catch {
    return null;
  }
}

export async function detectCountryByIp(options: {
  timeoutMs?: number;
  allowTimezoneFallback?: boolean;
  fallbackCountry?: string | null;
} = {}): Promise<CountryDetectionResult | null> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  for (const provider of PROVIDERS) {
    try {
      const res = await fetch(provider.url, {
        cache: "no-store",
        signal: timeoutSignal(timeoutMs),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const countryCode = cleanCountryCode(provider.parse(data));
      if (countryCode) return { countryCode, source: "ip", provider: provider.name };
    } catch {
      // Continue to next provider; a blocked/rate-limited IP service must never blank the app.
    }
  }

  if (options.allowTimezoneFallback !== false) {
    const timezoneCountry = getCountryFromTimezone();
    if (timezoneCountry) return { countryCode: timezoneCountry, source: "timezone" };
  }

  const fallbackCountry = options.fallbackCountry === null ? null : cleanCountryCode(options.fallbackCountry || "US");
  return fallbackCountry ? { countryCode: fallbackCountry, source: "fallback" } : null;
}