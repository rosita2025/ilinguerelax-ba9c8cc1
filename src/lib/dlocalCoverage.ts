/**
 * Cobertura real de dLocal Go por país, separada por tipo de cobro.
 *
 * - `transfer`: rails de transferencia bancaria / banca online / billeteras bancarias.
 * - `cash`: rails de efectivo (agentes, tiendas, vouchers, boletos).
 *
 * Si un país no tiene rails para un tipo, ese método NO debe mostrarse en el checkout.
 * Fuente: panel dLocal Go → Métodos de pago / Cobertura.
 */
export type DlocalKind = "transfer" | "cash";

export type DlocalCountry = {
  code: string;
  name: string;
  flag: string;
  currency: string;
  /** Bancos / rails de transferencia disponibles (vacío = no soportado). */
  transfer: string[];
  /** Redes de efectivo disponibles (vacío = no soportado). */
  cash: string[];
};

export const DLOCAL_COVERAGE: DlocalCountry[] = [
  { code: "AR", name: "Argentina", flag: "🇦🇷", currency: "ARS",
    transfer: ["Transferencia CBU/CVU", "Mercado Pago"], cash: ["Rapipago", "Pago Fácil"] },
  { code: "BO", name: "Bolivia", flag: "🇧🇴", currency: "BOB",
    transfer: ["QR bancario"], cash: ["Pago al Paso"] },
  { code: "BR", name: "Brasil", flag: "🇧🇷", currency: "BRL",
    transfer: ["Pix", "PicPay", "Santander"], cash: ["Boleto", "Lotérica"] },
  { code: "CL", name: "Chile", flag: "🇨🇱", currency: "CLP",
    transfer: ["Webpay", "Banco Bice"], cash: ["ServiPag", "Multicaja"] },
  { code: "CO", name: "Colombia", flag: "🇨🇴", currency: "COP",
    transfer: ["PSE", "Nequi", "Daviplata"], cash: ["Efecty", "Baloto"] },
  { code: "CR", name: "Costa Rica", flag: "🇨🇷", currency: "CRC",
    transfer: ["Transferencia bancaria", "SINPE"], cash: [] },
  { code: "EC", name: "Ecuador", flag: "🇪🇨", currency: "USD",
    transfer: ["Transferencia bancaria"], cash: ["Banco del Barrio", "Pago Efectivo"] },
  { code: "GT", name: "Guatemala", flag: "🇬🇹", currency: "GTQ",
    transfer: [], cash: ["Pago en efectivo (agentes)"] },
  { code: "MX", name: "México", flag: "🇲🇽", currency: "MXN",
    transfer: ["SPEI"], cash: ["OXXO", "7-Eleven"] },
  { code: "PA", name: "Panamá", flag: "🇵🇦", currency: "USD",
    transfer: ["Transferencia bancaria"], cash: [] },
  { code: "PE", name: "Perú", flag: "🇵🇪", currency: "PEN",
    transfer: ["Transferencia bancaria (BCP/Interbank)"], cash: ["PagoEfectivo", "Agentes"] },
  { code: "PY", name: "Paraguay", flag: "🇵🇾", currency: "PYG",
    transfer: ["Transferencia bancaria"], cash: ["Pago Express", "Aquí Pago"] },
  { code: "UY", name: "Uruguay", flag: "🇺🇾", currency: "UYU",
    transfer: ["Transferencia bancaria", "Banred"], cash: ["Abitab", "RedPagos"] },
];

const BY_CODE = new Map(DLOCAL_COVERAGE.map((c) => [c.code, c]));

export function getDlocalCountry(country?: string | null): DlocalCountry | undefined {
  if (!country) return undefined;
  return BY_CODE.get(country.toUpperCase());
}

/** ¿dLocal Go soporta este tipo de cobro en este país? */
export function dlocalSupports(country: string | null | undefined, kind: DlocalKind): boolean {
  const c = getDlocalCountry(country);
  if (!c) return false;
  return (kind === "cash" ? c.cash : c.transfer).length > 0;
}

/** Nombres de los rails disponibles para mostrar como sub-texto/badges. */
export function dlocalRails(country: string | null | undefined, kind: DlocalKind): string[] {
  const c = getDlocalCountry(country);
  if (!c) return [];
  return kind === "cash" ? c.cash : c.transfer;
}

export const DLOCAL_COUNTRY_CODES = DLOCAL_COVERAGE.map((c) => c.code);
