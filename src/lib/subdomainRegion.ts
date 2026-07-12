/**
 * Regional subdomain configuration.
 *
 * All subdomains (us., pe., ca., mx., es., fr., br.) point to the SAME
 * Lovable project. This module is the single source of truth mapping
 * hostname → region, language, currency, and preferred payment gateway.
 *
 * Detection is client-side (`window.location.hostname`). During SSR
 * or on unknown hosts (localhost, *.lovable.app, root ilinguerelax.com)
 * we return null and callers should fall back to IP-based detection.
 */

export type PaymentGateway = "stripe" | "mercadopago" | "yape_plin" | "paypal";

export interface RegionConfig {
  /** Two-letter subdomain (empty string = root/global). */
  subdomain: string;
  /** ISO country code. */
  country: string;
  /** Primary UI language (BCP-47 base). */
  language: "es" | "en" | "fr" | "pt";
  /** Full BCP-47 locale used for hreflang. */
  locale: string;
  /** ISO 4217 currency. */
  currency: "USD" | "CAD" | "PEN" | "MXN" | "EUR" | "BRL";
  /** Preferred payment gateway shown first in checkout. */
  paymentGateway: PaymentGateway;
  /** Pricing tier — mirrors useRegionTier. */
  tier: "latam" | "global";
  /** Human-readable label for the region switcher. */
  label: string;
  /** Emoji flag for the region switcher. */
  flag: string;
}

/**
 * Canonical map. Keys are the subdomain (lowercase, 2-3 chars).
 * The `""` key is the fallback / root domain (www.ilinguerelax.com).
 */
export const REGIONS: Record<string, RegionConfig> = {
  "": {
    subdomain: "",
    country: "",
    language: "es",
    locale: "es",
    currency: "USD",
    paymentGateway: "stripe",
    tier: "global",
    label: "Global",
    flag: "🌎",
  },
  us: {
    subdomain: "us",
    country: "US",
    language: "en",
    locale: "en-US",
    currency: "USD",
    paymentGateway: "stripe",
    tier: "global",
    label: "United States",
    flag: "🇺🇸",
  },
  ca: {
    subdomain: "ca",
    country: "CA",
    language: "en",
    locale: "en-CA",
    currency: "CAD",
    paymentGateway: "stripe",
    tier: "global",
    label: "Canada",
    flag: "🇨🇦",
  },
  pe: {
    subdomain: "pe",
    country: "PE",
    language: "es",
    locale: "es-PE",
    currency: "PEN",
    paymentGateway: "yape_plin",
    tier: "latam",
    label: "Perú",
    flag: "🇵🇪",
  },
  mx: {
    subdomain: "mx",
    country: "MX",
    language: "es",
    locale: "es-MX",
    currency: "MXN",
    paymentGateway: "mercadopago",
    tier: "latam",
    label: "México",
    flag: "🇲🇽",
  },
  es: {
    subdomain: "es",
    country: "ES",
    language: "es",
    locale: "es-ES",
    currency: "EUR",
    paymentGateway: "stripe",
    tier: "global",
    label: "España",
    flag: "🇪🇸",
  },
  fr: {
    subdomain: "fr",
    country: "FR",
    language: "fr",
    locale: "fr-FR",
    currency: "EUR",
    paymentGateway: "stripe",
    tier: "global",
    label: "France",
    flag: "🇫🇷",
  },
  br: {
    subdomain: "br",
    country: "BR",
    language: "pt",
    locale: "pt-BR",
    currency: "BRL",
    paymentGateway: "mercadopago",
    tier: "latam",
    label: "Brasil",
    flag: "🇧🇷",
  },
};

/** All active regional subdomains (excludes the root fallback). */
export const ACTIVE_SUBDOMAINS = Object.keys(REGIONS).filter((k) => k !== "");

const ROOT_DOMAIN = "ilinguerelax.com";

/**
 * Reads the current hostname and returns the matching RegionConfig,
 * or null when running on localhost / preview / unknown host.
 */
export function getSubdomainRegion(): RegionConfig | null {
  if (typeof window === "undefined") return null;
  const host = window.location.hostname.toLowerCase();

  // Non-production hosts → let IP detection decide.
  if (!host.endsWith(ROOT_DOMAIN)) return null;

  // Root or www → global fallback (returned as null so IP detection wins).
  if (host === ROOT_DOMAIN || host === `www.${ROOT_DOMAIN}`) return null;

  const sub = host.slice(0, host.length - ROOT_DOMAIN.length - 1).toLowerCase();
  // Only single-label subdomains (no us.beta., etc.)
  if (sub.includes(".")) return null;

  return REGIONS[sub] ?? null;
}

/**
 * Maps an ISO country code to the best matching subdomain (or "" for root).
 * Used by the region-suggestion banner.
 */
export function subdomainForCountry(country: string): string {
  const c = country.toUpperCase();
  const match = Object.values(REGIONS).find((r) => r.country === c);
  return match?.subdomain ?? "";
}

/** Builds the absolute URL of `path` on the given subdomain. */
export function urlForSubdomain(sub: string, path: string = "/"): string {
  const host = sub ? `${sub}.${ROOT_DOMAIN}` : `www.${ROOT_DOMAIN}`;
  return `https://${host}${path.startsWith("/") ? path : `/${path}`}`;
}
