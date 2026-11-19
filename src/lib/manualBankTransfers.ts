import { exchangeRates, type Currency } from "@/i18n";

/**
 * Transferencias bancarias MANUALES (como SPEI, ACH y Bre-B): el comprador paga a una cuenta de Wise de Youtumundial y la dueña
 * verifica el pago a mano (1–24 h). Una sola lista de datos para el panel del checkout y para el correo al cliente.
 *
 * Los datos salen de las pantallas de Wise que dio la dueña; no cambiarlos sin que ella los dé.
 */
export type ManualBankId = "sepa_eu" | "gbp_uk" | "cad_ca" | "cny_cn";

export type BankField = { label: string; value: string; /** Se muestra con botón para copiar. */ copy?: boolean };

export type ManualBank = {
  id: ManualBankId;
  currency: "EUR" | "GBP" | "CAD" | "CNY";
  /** Prefijo del número de pedido (ILR-EU-1234). */
  orderPrefix: string;
  /** Nombre del método en admin, pedidos y correos. */
  methodLabel: string;
  holder: string;
  fields: BankField[];
  bank: string;
  /** Insignias cortas de la fila. */
  badges: string[];
};

export const MANUAL_BANKS: Record<ManualBankId, ManualBank> = {
  // Cuenta en euros (IBAN de Bélgica; recibe SEPA desde cualquier país de la zona SEPA).
  sepa_eu: {
    id: "sepa_eu",
    currency: "EUR",
    orderPrefix: "ILR-EU",
    methodLabel: "Transferencia SEPA (Europa · EUR)",
    holder: "Youtumundial",
    fields: [
      { label: "IBAN", value: "BE50 9030 6580 1718", copy: true },
      { label: "BIC / SWIFT", value: "TRWIBEB1XXX", copy: true },
    ],
    bank: "Wise Europe SA, Rue du Trône 100, 3rd floor, Brussels, 1050, Belgium",
    badges: ["SEPA", "IBAN", "EUR"],
  },
  // Cuenta en libras (Reino Unido; transferencias nacionales con sort code + número de cuenta).
  gbp_uk: {
    id: "gbp_uk",
    currency: "GBP",
    orderPrefix: "ILR-UK",
    methodLabel: "Transferencia bancaria (Reino Unido · GBP)",
    holder: "Youtumundial",
    fields: [
      { label: "Sort code", value: "60-84-64", copy: true },
      { label: "Account number", value: "49021086", copy: true },
      { label: "IBAN", value: "GB95 TRWI 6084 6449 0210 86", copy: true },
    ],
    bank: "Wise Payments Limited, Worship Square, 65 Clifton Street, London, EC2A 4JE, United Kingdom",
    badges: ["UK", "GBP"],
  },
  // Cuenta en dólares canadienses (transferencias nacionales de Canadá).
  cad_ca: {
    id: "cad_ca",
    currency: "CAD",
    orderPrefix: "ILR-CA",
    methodLabel: "Transferencia bancaria (Canadá · CAD)",
    holder: "Youtumundial",
    fields: [
      { label: "Institution number", value: "621", copy: true },
      { label: "Transit number", value: "16001", copy: true },
      { label: "Account number", value: "200117473724", copy: true },
    ],
    bank: "Peoples Trust, 595 Burrard Street, Vancouver, BC, V7X 1L7, Canada",
    badges: ["CA", "CAD"],
  },
  // Yuanes: Wise recibe CNY por SWIFT en la cuenta del Reino Unido (mismo IBAN).
  cny_cn: {
    id: "cny_cn",
    currency: "CNY",
    orderPrefix: "ILR-CN",
    methodLabel: "Transferencia SWIFT (China · CNY)",
    holder: "Youtumundial",
    fields: [
      { label: "IBAN", value: "GB95 TRWI 6084 6449 0210 86", copy: true },
      { label: "SWIFT / BIC", value: "TRWIGB2LXXX", copy: true },
    ],
    bank: "Wise Payments Limited, Worship Square, 65 Clifton Street, London, EC2A 4JE, United Kingdom",
    badges: ["SWIFT", "CNY"],
  },
};

export const MANUAL_BANK_IDS = Object.keys(MANUAL_BANKS) as ManualBankId[];
export const isManualBankId = (id: string): id is ManualBankId => id in MANUAL_BANKS;

/** Países de la zona SEPA que pagan a la cuenta en euros (el Reino Unido usa su cuenta en libras). */
export const SEPA_COUNTRIES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
  "IS", "LI", "NO", "CH", "MC", "SM", "VA", "AD",
]);

/** Qué cuenta manual corresponde al país del comprador (null = ninguna). */
export function manualBankFor(country: string | null | undefined): ManualBank | null {
  const c = (country || "").toUpperCase();
  if (c === "GB" || c === "UK") return MANUAL_BANKS.gbp_uk;
  if (c === "CA") return MANUAL_BANKS.cad_ca;
  if (c === "CN") return MANUAL_BANKS.cny_cn;
  if (SEPA_COUNTRIES.has(c)) return MANUAL_BANKS.sepa_eu;
  return null;
}

/**
 * Monto a transferir en la moneda de la cuenta. Si el precio que ve el comprador ya está en esa moneda se usa tal cual (incluye upsell y cupón);
 * si no (p. ej. el Reino Unido ve euros y paga en libras), se convierte desde la moneda mostrada, o desde US$ mientras no se conozca.
 */
export function bankAmount(
  bank: ManualBank,
  shown: { loading?: boolean; currency?: string | null; amount?: number | null } | null | undefined,
  totalUsd: number,
): number {
  const rates = exchangeRates as Record<string, number>;
  const to = rates[bank.currency];
  let usd = Number(totalUsd);
  if (shown && !shown.loading && shown.currency && shown.amount != null && Number.isFinite(Number(shown.amount))) {
    if (shown.currency === bank.currency) return Math.round(Number(shown.amount) * 100) / 100;
    const from = rates[shown.currency];
    if (from) usd = Number(shown.amount) / from;
  }
  return Math.round(usd * to * 100) / 100;
}

type L = "es" | "en" | "fr" | "it" | "pt";
const pick = (lang: string, o: Record<L, string>): string => o[(["es", "en", "fr", "it", "pt"].includes(lang) ? lang : "en") as L];

const TITLES: Record<ManualBankId, Record<L, string>> = {
  sepa_eu: { es: "Transferencia bancaria SEPA (euros)", en: "Bank transfer (SEPA · EUR)", fr: "Virement SEPA (euros)", it: "Bonifico SEPA (euro)", pt: "Transferência SEPA (euros)" },
  gbp_uk: { es: "Transferencia bancaria (Reino Unido · GBP)", en: "Bank transfer (UK · GBP)", fr: "Virement bancaire (Royaume-Uni · GBP)", it: "Bonifico bancario (Regno Unito · GBP)", pt: "Transferência bancária (Reino Unido · GBP)" },
  cad_ca: { es: "Transferencia bancaria (Canadá · CAD)", en: "Bank transfer (Canada · CAD)", fr: "Virement bancaire (Canada · CAD)", it: "Bonifico bancario (Canada · CAD)", pt: "Transferência bancária (Canadá · CAD)" },
  cny_cn: { es: "Transferencia internacional (China · CNY)", en: "International transfer (China · CNY)", fr: "Virement international (Chine · CNY)", it: "Bonifico internazionale (Cina · CNY)", pt: "Transferência internacional (China · CNY)" },
};

const NOTES: Record<ManualBankId, Record<L, string>> = {
  sepa_eu: { es: "Transferencia SEPA en euros desde cualquier banco europeo.", en: "SEPA transfer in euros from any European bank.", fr: "Virement SEPA en euros depuis n'importe quelle banque européenne.", it: "Bonifico SEPA in euro da qualsiasi banca europea.", pt: "Transferência SEPA em euros a partir de qualquer banco europeu." },
  gbp_uk: { es: "Transferencia nacional del Reino Unido en libras.", en: "UK domestic transfer in pounds.", fr: "Virement national britannique en livres.", it: "Bonifico nazionale britannico in sterline.", pt: "Transferência nacional do Reino Unido em libras." },
  cad_ca: { es: "Transferencia bancaria dentro de Canadá en dólares canadienses.", en: "Bank transfer within Canada in Canadian dollars.", fr: "Virement bancaire au Canada en dollars canadiens.", it: "Bonifico bancario in Canada in dollari canadesi.", pt: "Transferência bancária no Canadá em dólares canadenses." },
  cny_cn: { es: "Transferencia internacional (SWIFT): tu banco puede cobrar una comisión.", en: "International (SWIFT) transfer: your bank may charge a fee.", fr: "Virement international (SWIFT) : votre banque peut facturer des frais.", it: "Bonifico internazionale (SWIFT): la tua banca può addebitare una commissione.", pt: "Transferência internacional (SWIFT): seu banco pode cobrar uma taxa." },
};

const COPY = {
  heading: { es: "Transfiere a nuestra cuenta", en: "Send the transfer to our account", fr: "Faites le virement vers notre compte", it: "Invia il bonifico al nostro conto", pt: "Faça a transferência para nossa conta" },
  holder: { es: "Titular", en: "Account holder", fr: "Titulaire", it: "Intestatario", pt: "Titular" },
  bank: { es: "Banco", en: "Bank", fr: "Banque", it: "Banca", pt: "Banco" },
  exact: { es: "Envía el monto exacto y toca «Ya pagué».", en: "Send the exact amount, then tap \"I already paid\".", fr: "Envoyez le montant exact puis touchez « J'ai payé ».", it: "Invia l'importo esatto e tocca «Ho pagato».", pt: "Envie o valor exato e toque em «Já paguei»." },
  copied: { es: "Copiado", en: "Copied", fr: "Copié", it: "Copiato", pt: "Copiado" },
  shopPrice: { es: "Precio en la tienda", en: "Store price", fr: "Prix en boutique", it: "Prezzo nel negozio", pt: "Preço na loja" },
  sub: { es: "Paga desde tu banco · verificado en 1-24 h", en: "Pay from your bank · verified in 1-24h", fr: "Payez depuis votre banque · vérifié en 1-24 h", it: "Paga dalla tua banca · verificato in 1-24 h", pt: "Pague pelo seu banco · verificado em 1-24 h" },
};

export const bankTitle = (id: ManualBankId, lang: string) => pick(lang, TITLES[id]);
export const bankNote = (id: ManualBankId, lang: string) => pick(lang, NOTES[id]);
export const bankText = (key: keyof typeof COPY, lang: string) => pick(lang, COPY[key]);

export type { Currency };
