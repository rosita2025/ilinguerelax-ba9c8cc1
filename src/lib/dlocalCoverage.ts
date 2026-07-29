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
  /** Si true, el bloque de billetera se muestra como "Muy pronto" y no permite comprar. */
  walletComingSoon?: boolean;
};

export const DLOCAL_COVERAGE: DlocalCountry[] = [
  { code: "AR", name: "Argentina", flag: "🇦🇷", currency: "ARS",
    transfer: ["Transferencia CBU/CVU", "Banco Nación", "Santander", "Galicia"],
    cash: ["Rapipago", "Pago Fácil", "Cobro Express", "Provincia NET"],
    wallet: ["Mercado Pago", "Ualá", "Personal Pay", "MODO"],
    walletLabel: "Billetera digital", walletKey: "dlocal_mercadopago" },
  { code: "BO", name: "Bolivia", flag: "🇧🇴", currency: "BOB",
    transfer: ["Banco de Crédito de Bolivia"], cash: ["Pago al Paso"],
    wallet: ["Yape", "Belo", "Takenos"],
    walletLabel: "Billetera digital (QR)", walletKey: "dlocal_wallet" },
  { code: "BR", name: "Brasil", flag: "🇧🇷", currency: "BRL",
    transfer: ["Pix", "Itaú", "Banco do Brasil", "Bradesco"],
    cash: ["Boleto bancário", "Lotérica"],
    wallet: ["PicPay", "Mercado Pago", "PagBank", "Ame Digital"],
    walletLabel: "Billetera digital", walletKey: "dlocal_wallet" },
  { code: "CL", name: "Chile", flag: "🇨🇱", currency: "CLP",
    transfer: ["Banco de Chile", "BancoEstado", "Santander", "BCI"],
    cash: ["Prepago Los Héroes", "Dale Coopeuch", "ServiPag", "Multicaja"],
    wallet: ["MACH", "Tenpo", "Chek", "Fpay"], walletLabel: "Billetera digital", walletKey: "dlocal_wallet" },
  { code: "CO", name: "Colombia", flag: "🇨🇴", currency: "COP",
    transfer: ["PSE", "Bancolombia", "Davivienda", "Banco de Bogotá"],
    cash: ["Efecty", "Baloto", "Gana", "Punto Red"],
    wallet: ["Nequi", "Daviplata", "Movii", "Dale"], walletLabel: "Billetera digital", walletKey: "dlocal_wallet" },
  { code: "CR", name: "Costa Rica", flag: "🇨🇷", currency: "CRC",
    transfer: ["BAC Credomatic", "Banco Nacional (BNCR)", "Banco de Costa Rica", "SINPE"], cash: ["BN Servicios", "PayCash", "PuntoXpress"],
    wallet: ["SINPE Móvil", "Kash", "Tapp"], walletLabel: "Billetera digital", walletKey: "dlocal_wallet" },
  { code: "EC", name: "Ecuador", flag: "🇪🇨", currency: "USD",
    transfer: ["Banco Pichincha", "Banco Guayaquil", "Produbanco", "Banco del Pacífico"], cash: ["Pago Efectivo", "Almacenes TIA", "Banco Amazonas", "Facilito"],
    wallet: ["DeUna", "Peigo", "Bimo"], walletLabel: "Billetera digital", walletKey: "dlocal_wallet" },
  { code: "GT", name: "Guatemala", flag: "🇬🇹", currency: "GTQ",
    transfer: [], cash: ["PAYCASH (agentes)"],
    wallet: ["Tigo Money", "Zigi"], walletLabel: "Billetera digital", walletKey: "dlocal_wallet",
    walletComingSoon: true },
  { code: "MX", name: "México", flag: "🇲🇽", currency: "MXN",
    transfer: ["BBVA México", "Banorte", "Santander", "Citibanamex"],
    cash: ["OXXO"],
    wallet: ["Mercado Pago", "Spin by OXXO"],
    walletLabel: "Billetera digital", walletKey: "dlocal_mercadopago" },
  { code: "PA", name: "Panamá", flag: "🇵🇦", currency: "USD",
    transfer: ["Banco General", "Banistmo", "BAC Credomatic", "Global Bank"], cash: [],
    wallet: ["Yappy", "Nequi Panamá"], walletLabel: "Billetera digital", walletKey: "dlocal_wallet" },
  { code: "PE", name: "Perú", flag: "🇵🇪", currency: "PEN",
    transfer: ["BCP", "Interbank", "BBVA", "Scotiabank"],
    cash: ["PagoEfectivo", "Agentes / bodegas"],
    wallet: ["Yape", "Plin", "Mercado Pago"], walletLabel: "Billetera digital", walletKey: "dlocal_wallet" },
  { code: "PY", name: "Paraguay", flag: "🇵🇾", currency: "PYG",
    transfer: ["Banco Continental", "Itaú Paraguay", "Banco Familiar", "Ueno Bank"], cash: ["Infonet", "Pago Express", "Aquí Pago"],
    wallet: ["Tigo Money", "Billetera Personal", "Zimple", "QR"], walletLabel: "Billetera digital", walletKey: "dlocal_wallet" },
  { code: "UY", name: "Uruguay", flag: "🇺🇾", currency: "UYU",
    transfer: ["BROU", "Itaú Uruguay", "Santander", "Scotiabank"], cash: ["Abitab", "RedPagos"],
    wallet: ["Prex", "Mi Dinero", "OCA Blue"], walletLabel: "Billetera digital", walletKey: "dlocal_wallet" },
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
