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
  /** Si true, transferencia bancaria se muestra como "Muy pronto" y no permite comprar. */
  transferComingSoon?: boolean;
  /** Si true, pago en efectivo se muestra como "Muy pronto" y no permite comprar. */
  cashComingSoon?: boolean;
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
    transfer: ["Banco Pichincha", "Banco Guayaquil", "Banco del Pacífico"], cash: ["Pago Efectivo", "Almacenes TIA", "Banco Amazonas", "Facilito"],
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
    transfer: ["Banco General", "Banistmo", "BAC Credomatic", "Global Bank"], transferComingSoon: true,
    cash: ["Punto Pago"], cashComingSoon: true,
    wallet: ["Yappy", "Nequi Panamá"], walletLabel: "Billetera digital", walletKey: "dlocal_wallet",
    walletComingSoon: true },
  { code: "PE", name: "Perú", flag: "🇵🇪", currency: "PEN",
    transfer: ["BCP", "Interbank", "BBVA", "Scotiabank"],
    cash: ["PagoEfectivo", "Agentes / bodegas"],
    wallet: ["Yape", "Plin", "Mercado Pago"], walletLabel: "Billetera digital", walletKey: "dlocal_wallet" },
  { code: "PY", name: "Paraguay", flag: "🇵🇾", currency: "PYG",
    transfer: ["Banco Central del Paraguay", "Itaú Paraguay", "Banco GNB"], cash: ["Infonet"],
    wallet: ["Ueno", "Personal Pay", "Tigo Money"], walletLabel: "Billetera digital", walletKey: "dlocal_wallet" },
  { code: "UY", name: "Uruguay", flag: "🇺🇾", currency: "UYU",
    transfer: ["BROU", "Itaú Uruguay", "Santander", "Scotiabank"], cash: ["RedPagos"],
    wallet: [], walletComingSoon: true, walletLabel: "Billetera digital", walletKey: "dlocal_wallet" },
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

/* ------------------------------------------------------------------
 * Etiquetas visuales (badges) generadas SIEMPRE desde la cobertura real
 * mostrada en /admin/dlocal, para que el checkout y el panel coincidan
 * en todos los países (transferencia, efectivo y billetera digital).
 * ------------------------------------------------------------------ */

export type DlocalBadge = { label: string; bg: string; color: string };

const BRAND_COLORS: Record<string, { bg: string; color: string }> = {
  // Transferencia / banca
  pix: { bg: "#32BCAD", color: "#06211F" },
  pse: { bg: "#0B5AA6", color: "#ffffff" },
  spei: { bg: "#0F766E", color: "#ffffff" },
  sinpe: { bg: "#0B5AA6", color: "#ffffff" },
  "sinpe movil": { bg: "#0B5AA6", color: "#ffffff" },
  "transferencia cbu/cvu": { bg: "#0F766E", color: "#ffffff" },
  bcp: { bg: "#F58220", color: "#1F2937" },
  interbank: { bg: "#00A94F", color: "#ffffff" },
  bbva: { bg: "#004481", color: "#ffffff" },
  "bbva mexico": { bg: "#004481", color: "#ffffff" },
  scotiabank: { bg: "#EC111A", color: "#ffffff" },
  santander: { bg: "#EC0000", color: "#ffffff" },
  banorte: { bg: "#EB0029", color: "#ffffff" },
  citibanamex: { bg: "#003B70", color: "#ffffff" },
  bancolombia: { bg: "#FDDA24", color: "#1F2937" },
  davivienda: { bg: "#E1251B", color: "#ffffff" },
  itau: { bg: "#EC7000", color: "#1F2937" },
  "banco do brasil": { bg: "#FAE128", color: "#1F2937" },
  bradesco: { bg: "#CC092F", color: "#ffffff" },
  brou: { bg: "#0B5AA6", color: "#ffffff" },
  "bac credomatic": { bg: "#E4002B", color: "#ffffff" },
  "banco pichincha": { bg: "#FFD100", color: "#1F2937" },
  // Efectivo
  oxxo: { bg: "#E31E24", color: "#ffffff" },
  pagoefectivo: { bg: "#EC0928", color: "#ffffff" },
  "pago efectivo": { bg: "#EC0928", color: "#ffffff" },
  rapipago: { bg: "#F5A623", color: "#1F2937" },
  "pago facil": { bg: "#E4002B", color: "#ffffff" },
  efecty: { bg: "#FFD400", color: "#1F2937" },
  baloto: { bg: "#0B5AA6", color: "#ffffff" },
  "boleto bancario": { bg: "#1F2937", color: "#ffffff" },
  loterica: { bg: "#ffffff", color: "#1F2937" },
  servipag: { bg: "#111827", color: "#00C08B" },
  multicaja: { bg: "#ffffff", color: "#1F2937" },
  redpagos: { bg: "#E4002B", color: "#ffffff" },
  abitab: { bg: "#F5A623", color: "#1F2937" },
  infonet: { bg: "#0B5AA6", color: "#ffffff" },
  // Billeteras
  yape: { bg: "#6B1FA0", color: "#ffffff" },
  plin: { bg: "#00C2C7", color: "#04252B" },
  nequi: { bg: "#200020", color: "#DA0081" },
  daviplata: { bg: "#E1251B", color: "#ffffff" },
  "mercado pago": { bg: "#00A6E0", color: "#00263A" },
  "spin by oxxo": { bg: "#E31E24", color: "#ffffff" },
  uala: { bg: "#FF4E4E", color: "#ffffff" },
  "personal pay": { bg: "#00B2E3", color: "#00263A" },
  modo: { bg: "#111827", color: "#00E0A1" },
  picpay: { bg: "#21C25E", color: "#04250F" },
  pagbank: { bg: "#0F9D58", color: "#ffffff" },
  "ame digital": { bg: "#FF3C82", color: "#ffffff" },
  mach: { bg: "#111827", color: "#00E0A1" },
  tenpo: { bg: "#00E08F", color: "#04250F" },
  "tigo money": { bg: "#0033A0", color: "#ffffff" },
  yappy: { bg: "#00A9E0", color: "#00263A" },
  deuna: { bg: "#E1251B", color: "#ffffff" },
  // Transferencia / banca (resto de países)
  "banco nacion": { bg: "#0B5AA6", color: "#ffffff" },
  galicia: { bg: "#F5822A", color: "#1F2937" },
  "banco de chile": { bg: "#0033A0", color: "#ffffff" },
  bancoestado: { bg: "#F58220", color: "#1F2937" },
  bci: { bg: "#F0B323", color: "#1F2937" },
  "banco de bogota": { bg: "#0B2C5E", color: "#ffffff" },
  "banco nacional (bncr)": { bg: "#0B5AA6", color: "#ffffff" },
  "banco de costa rica": { bg: "#0055A5", color: "#ffffff" },
  "banco guayaquil": { bg: "#E1251B", color: "#ffffff" },
  "banco del pacifico": { bg: "#0B5AA6", color: "#ffffff" },
  "banco de credito de bolivia": { bg: "#F58220", color: "#1F2937" },
  "itau uruguay": { bg: "#EC7000", color: "#1F2937" },
  "itau paraguay": { bg: "#EC7000", color: "#1F2937" },
  "banco central del paraguay": { bg: "#0B5AA6", color: "#ffffff" },
  "banco gnb": { bg: "#7B1FA2", color: "#ffffff" },
  "banco general": { bg: "#0B5AA6", color: "#ffffff" },
  banistmo: { bg: "#E4002B", color: "#ffffff" },
  "global bank": { bg: "#111827", color: "#ffffff" },
  // Efectivo (resto de países)
  "cobro express": { bg: "#0B5AA6", color: "#ffffff" },
  "provincia net": { bg: "#00A94F", color: "#ffffff" },
  "prepago los heroes": { bg: "#0B5AA6", color: "#ffffff" },
  "dale coopeuch": { bg: "#E4002B", color: "#ffffff" },
  gana: { bg: "#E4002B", color: "#ffffff" },
  "punto red": { bg: "#0B5AA6", color: "#ffffff" },
  "bn servicios": { bg: "#0B5AA6", color: "#ffffff" },
  paycash: { bg: "#00A94F", color: "#ffffff" },
  puntoxpress: { bg: "#F5A623", color: "#1F2937" },
  "almacenes tia": { bg: "#E1251B", color: "#ffffff" },
  "banco amazonas": { bg: "#0B5AA6", color: "#ffffff" },
  facilito: { bg: "#00A94F", color: "#ffffff" },
  "pago al paso": { bg: "#F5A623", color: "#1F2937" },
  "punto pago": { bg: "#0B5AA6", color: "#ffffff" },
  "agentes / bodegas": { bg: "#111827", color: "#ffffff" },
  // Billeteras (resto de países)
  chek: { bg: "#00E0A1", color: "#04250F" },
  fpay: { bg: "#111827", color: "#00E0A1" },
  movii: { bg: "#E4002B", color: "#ffffff" },
  dale: { bg: "#111827", color: "#ffffff" },
  kash: { bg: "#00B2E3", color: "#00263A" },
  tapp: { bg: "#7B1FA2", color: "#ffffff" },
  peigo: { bg: "#00A9E0", color: "#00263A" },
  bimo: { bg: "#111827", color: "#00E0A1" },
  zigi: { bg: "#0033A0", color: "#ffffff" },
  ueno: { bg: "#00E08F", color: "#04250F" },
  belo: { bg: "#111827", color: "#00E0A1" },
  takenos: { bg: "#7B1FA2", color: "#ffffff" },
  "nequi panama": { bg: "#200020", color: "#DA0081" },
};

const KIND_FALLBACK: Record<DlocalKind, { bg: string; color: string }> = {
  transfer: { bg: "#0F766E", color: "#ffffff" },
  cash: { bg: "#F5A623", color: "#1F2937" },
  wallet: { bg: "#4F46E5", color: "#ffffff" },
};

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

/**
 * Badges del checkout para un país + tipo de cobro, tomados de la misma
 * cobertura que muestra /admin/dlocal (una sola fuente de verdad).
 */
export function dlocalBadges(
  country: string | null | undefined,
  kind: DlocalKind,
  max = 3,
): DlocalBadge[] {
  const rails = dlocalRails(country, kind).slice(0, max);
  return rails.map((rail) => {
    const key = normalize(rail);
    const brand =
      BRAND_COLORS[key] ??
      BRAND_COLORS[key.replace(/\s*\(.*\)\s*/g, "").trim()] ??
      Object.entries(BRAND_COLORS).find(([k]) => key.startsWith(k))?.[1] ??
      KIND_FALLBACK[kind];
    return { label: rail, bg: brand.bg, color: brand.color };
  });
}


/* ------------------------------------------------------------------
 * Validación automática del checkout ↔ /admin/dlocal
 * Garantiza que cada método dLocal mostrado (y sus etiquetas/badges)
 * corresponda EXACTAMENTE a la cobertura activa del país seleccionado.
 * ------------------------------------------------------------------ */

export type DlocalMethodId =
  | "dlocal_transfer"
  | "dlocal_cash"
  | "dlocal_wallet"
  | "dlocal_card";

export const DLOCAL_METHOD_KIND: Record<Exclude<DlocalMethodId, "dlocal_card">, DlocalKind> = {
  dlocal_transfer: "transfer",
  dlocal_cash: "cash",
  dlocal_wallet: "wallet",
};

export function isDlocalMethodId(id: string): id is DlocalMethodId {
  return id === "dlocal_transfer" || id === "dlocal_cash" || id === "dlocal_wallet" || id === "dlocal_card";
}

/** ¿Este rail está marcado como "Muy pronto" en /admin/dlocal? */
export function dlocalComingSoon(country: string | null | undefined, kind: DlocalKind): boolean {
  const c = getDlocalCountry(country);
  if (!c) return false;
  if (kind === "transfer") return !!c.transferComingSoon;
  if (kind === "cash") return !!c.cashComingSoon;
  return !!c.walletComingSoon;
}

export type DlocalValidation = { ok: boolean; reason?: string };

/**
 * Valida que un método dLocal pueda usarse en el país seleccionado según la
 * cobertura activa. Se usa tanto para filtrar la lista como para bloquear el
 * pago justo antes de crear la orden (defensa en profundidad).
 */
export function validateDlocalMethod(
  country: string | null | undefined,
  methodId: string,
): DlocalValidation {
  if (!isDlocalMethodId(methodId)) return { ok: true };
  const code = (country || "").toUpperCase();
  const c = getDlocalCountry(code);
  if (!c) return { ok: false, reason: `dLocal Go no tiene cobertura activa para ${code || "este país"}.` };
  if (methodId === "dlocal_card" && !DLOCAL_CARD_ENABLED) {
    return { ok: false, reason: "dLocal Go: el cobro con tarjeta está desactivado." };
  }
  if (methodId === "dlocal_wallet" && !DLOCAL_WALLET_ENABLED) {
    return { ok: false, reason: "dLocal Go: la billetera digital está desactivada." };
  }
  if (methodId === "dlocal_card") return { ok: true };
  const kind = DLOCAL_METHOD_KIND[methodId];
  if (dlocalRails(code, kind).length === 0) {
    return { ok: false, reason: `${c.name}: este método no tiene rails activos en la cobertura de dLocal.` };
  }
  if (dlocalComingSoon(code, kind)) {
    return { ok: false, reason: `${c.name}: este método está marcado como "Muy pronto" y aún no acepta pagos.` };
  }
  return { ok: true };
}


/**
 * Valida que las etiquetas/badges mostradas en el checkout provengan de la
 * cobertura del país. Devuelve las etiquetas que NO existen en /admin/dlocal.
 */
export function findDlocalLabelMismatches(
  country: string | null | undefined,
  kind: DlocalKind,
  labels: string[],
): string[] {
  const rails = dlocalRails(country, kind).map(normalize);
  return labels.filter((l) => !rails.includes(normalize(l)));
}

/**
 * Chequeo automático (solo en desarrollo) de que los badges renderizados
 * coincidan con la cobertura. Avisa por consola si algo se desincroniza.
 */
export function auditDlocalCheckout(
  country: string | null | undefined,
  shown: { methodId: string; labels: string[] }[],
): string[] {
  const problems: string[] = [];
  for (const m of shown) {
    const v = validateDlocalMethod(country, m.methodId);
    if (!v.ok) problems.push(`${m.methodId}: ${v.reason}`);
    if (isDlocalMethodId(m.methodId) && m.methodId !== "dlocal_card") {
      const bad = findDlocalLabelMismatches(country, DLOCAL_METHOD_KIND[m.methodId], m.labels);
      if (bad.length) problems.push(`${m.methodId}: etiquetas fuera de cobertura → ${bad.join(", ")}`);
    }
  }
  return problems;
}
