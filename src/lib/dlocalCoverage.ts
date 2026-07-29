/**
 * Cobertura real de dLocal Go por país, separada por tipo de cobro.
 *
 * - `transfer`: rails de transferencia bancaria / banca online / billeteras bancarias.
 * - `cash`: rails de efectivo (agentes, tiendas, vouchers, boletos).
 *
 * Si un país no tiene rails para un tipo, ese método NO debe mostrarse en el checkout.
 * Fuente: panel dLocal Go → Métodos de pago / Cobertura.
 */
export type DlocalKind = "transfer" | "cash" | "wallet";

export type DlocalCountry = {
  code: string;
  name: string;
  flag: string;
  currency: string;
  /** Bancos / rails de transferencia disponibles (vacío = no soportado). */
  transfer: string[];
  /** Redes de efectivo disponibles (vacío = no soportado). */
  cash: string[];
  /** Billeteras / tarjetas Mercado Pago (bloque separado, vacío = no soportado). */
  wallet?: string[];
  /** Título del bloque separado (por defecto Mercado Pago). */
  walletLabel?: string;
  /** Clave de método para el bloque separado (por defecto dlocal_mercadopago). */
  walletKey?: string;
};

export const DLOCAL_COVERAGE: DlocalCountry[] = [
  { code: "AR", name: "Argentina", flag: "🇦🇷", currency: "ARS",
    transfer: ["Transferencia CBU/CVU", "Banco Nación", "Santander", "Galicia", "BBVA", "Macro"],
    cash: ["Rapipago", "Pago Fácil", "Cobro Express", "Provincia NET"],
    wallet: ["Mercado Pago (saldo)", "Tarjeta Mercado Pago", "Tarjeta de crédito/débito vía Mercado Pago"] },
  { code: "BO", name: "Bolivia", flag: "🇧🇴", currency: "BOB",
    transfer: ["Transferencia bancaria"], cash: ["Pago al Paso", "Efectivo (agentes)"],
    wallet: ["QR bancario (Simple / Tigo Money)", "Tarjeta de crédito/débito"], walletLabel: "QR y tarjeta", walletKey: "dlocal_wallet" },
  { code: "BR", name: "Brasil", flag: "🇧🇷", currency: "BRL",
    transfer: ["Pix", "PicPay", "Santander", "Itaú", "Bradesco", "Banco do Brasil"],
    cash: ["Boleto bancário", "Lotérica"] },
  { code: "CL", name: "Chile", flag: "🇨🇱", currency: "CLP",
    transfer: ["Banco de Chile", "BancoEstado", "BBVA", "Webpay"],
    cash: ["Prepago Los Héroes", "Dale Coopeuch", "ServiPag", "Multicaja"] },
  { code: "CO", name: "Colombia", flag: "🇨🇴", currency: "COP",
    transfer: ["PSE", "Bancolombia", "Davivienda", "Banco de Bogotá"],
    cash: ["Efecty", "Baloto", "Gana", "Punto Red"],
    wallet: ["Nequi", "Daviplata", "Movii", "Dale"], walletLabel: "Billetera digital", walletKey: "dlocal_wallet" },
  { code: "CR", name: "Costa Rica", flag: "🇨🇷", currency: "CRC",
    transfer: ["SINPE", "SINPE Móvil"], cash: ["BN Servicios", "PayCash", "PuntoXpress"] },
  { code: "EC", name: "Ecuador", flag: "🇪🇨", currency: "USD",
    transfer: ["Transferencia bancaria"], cash: ["Pago Efectivo", "Almacenes TIA", "Banco Amazonas", "Banco del Barrio"] },
  { code: "GT", name: "Guatemala", flag: "🇬🇹", currency: "GTQ",
    transfer: [], cash: ["PAYCASH (agentes)"] },
  { code: "MX", name: "México", flag: "🇲🇽", currency: "MXN",
    transfer: ["SPEI", "BBVA Bancomer", "Banorte", "Banregio", "Banbajío", "Citibanamex", "Compartamos", "HSBC", "Inbursa", "Santander", "Scotiabank"],
    cash: ["OXXO", "7-Eleven"],
    wallet: ["Mercado Pago (saldo)", "Tarjeta Mercado Pago"] },
  { code: "PA", name: "Panamá", flag: "🇵🇦", currency: "USD",
    transfer: ["Transferencia bancaria"], cash: [] },
  { code: "PE", name: "Perú", flag: "🇵🇪", currency: "PEN",
    transfer: ["Transferencia bancaria", "BCP", "Interbank", "BBVA", "Scotiabank"],
    cash: ["PagoEfectivo", "Agentes / bodegas"] },
  { code: "PY", name: "Paraguay", flag: "🇵🇾", currency: "PYG",
    transfer: ["Transferencia bancaria"], cash: ["Infonet", "QR", "Pago Express", "Aquí Pago"] },
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
  return dlocalRails(country, kind).length > 0;
}

/** Nombres de los rails disponibles para mostrar como sub-texto/badges. */
export function dlocalRails(country: string | null | undefined, kind: DlocalKind): string[] {
  const c = getDlocalCountry(country);
  if (!c) return [];
  if (kind === "cash") return c.cash;
  if (kind === "wallet") return c.wallet ?? [];
  return c.transfer;
}

export const DLOCAL_COUNTRY_CODES = DLOCAL_COVERAGE.map((c) => c.code);
