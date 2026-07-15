// Mapa oficial de métodos Stripe disponibles por país (comprador).
// Fuente: https://docs.stripe.com/payments/payment-methods/payment-method-support
// Se mantiene sincronizado con la matriz oficial de Stripe. El admin
// puede sobrescribir o desactivar cualquiera después de auto-rellenar.

export type StripeMethodDef = {
  method_key: string;
  label: string;
  icon: string;
  note: string;
};

// Métodos globales — funcionan en (casi) todos los países que soporta Stripe.
const GLOBAL: StripeMethodDef[] = [
  { method_key: "stripe_card", label: "Tarjeta débito/crédito", icon: "CreditCard", note: "Visa, Mastercard, Amex vía Stripe" },
  { method_key: "stripe_link", label: "Link (Stripe)", icon: "Wallet", note: "Autocompletado con 1 clic de Stripe" },
];

// Wallets móviles — Stripe los muestra automáticamente si el dispositivo/navegador los soporta.
const WALLETS: StripeMethodDef[] = [
  { method_key: "stripe_apple_pay", label: "Apple Pay", icon: "Smartphone", note: "iPhone / Safari" },
  { method_key: "stripe_google_pay", label: "Google Pay", icon: "Smartphone", note: "Android / Chrome" },
];

// Definiciones reutilizables
const M = {
  sepa:      { method_key: "stripe_sepa_debit",       label: "SEPA débito directo",  icon: "Banknote",    note: "Zona euro" },
  klarna:    { method_key: "stripe_klarna",           label: "Klarna",               icon: "CreditCard",  note: "Compra ahora, paga después" },
  affirm:    { method_key: "stripe_affirm",           label: "Affirm",               icon: "CreditCard",  note: "Compra ahora, paga después" },
  afterpay:  { method_key: "stripe_afterpay_clearpay",label: "Afterpay / Clearpay",  icon: "CreditCard",  note: "Paga en 4" },
  amazonpay: { method_key: "stripe_amazon_pay",       label: "Amazon Pay",           icon: "Wallet",      note: "Cuenta Amazon" },
  revolut:   { method_key: "stripe_revolut_pay",      label: "Revolut Pay",          icon: "Wallet",      note: "Cuenta Revolut" },
  paypal:    { method_key: "stripe_paypal",           label: "PayPal (vía Stripe)",  icon: "Wallet",      note: "PayPal procesado por Stripe" },
  ideal:     { method_key: "stripe_ideal",            label: "iDEAL",                icon: "Building2",   note: "Banca online Países Bajos" },
  bancontact:{ method_key: "stripe_bancontact",       label: "Bancontact",           icon: "Building2",   note: "Bélgica" },
  giropay:   { method_key: "stripe_giropay",          label: "Giropay",              icon: "Building2",   note: "Banca online Alemania" },
  sofort:    { method_key: "stripe_sofort",           label: "Sofort",               icon: "Building2",   note: "Transferencia instantánea DE/AT" },
  eps:       { method_key: "stripe_eps",              label: "EPS",                  icon: "Building2",   note: "Banca online Austria" },
  p24:       { method_key: "stripe_p24",              label: "Przelewy24 (P24)",     icon: "Building2",   note: "Banca online Polonia" },
  blik:      { method_key: "stripe_blik",             label: "BLIK",                 icon: "Smartphone",  note: "Pago móvil Polonia" },
  multibanco:{ method_key: "stripe_multibanco",       label: "Multibanco",           icon: "Banknote",    note: "Portugal" },
  twint:     { method_key: "stripe_twint",            label: "TWINT",                icon: "Smartphone",  note: "Suiza" },
  mobilepay: { method_key: "stripe_mobilepay",        label: "MobilePay",            icon: "Smartphone",  note: "Dinamarca / Finlandia" },
  bacs:      { method_key: "stripe_bacs_debit",       label: "Bacs débito directo",  icon: "Banknote",    note: "Reino Unido" },
  becs:      { method_key: "stripe_au_becs_debit",    label: "BECS débito",          icon: "Banknote",    note: "Australia" },
  acss:      { method_key: "stripe_acss_debit",       label: "Débito bancario",      icon: "Banknote",    note: "Débito preautorizado Canadá" },
  us_ach:    { method_key: "stripe_us_bank_account",  label: "US Bank (ACH)",        icon: "Banknote",    note: "Transferencia bancaria USA" },
  cashapp:   { method_key: "stripe_cashapp",          label: "Cash App Pay",         icon: "Smartphone",  note: "Solo compradores USA" },
  oxxo:      { method_key: "stripe_oxxo",             label: "OXXO",                 icon: "Banknote",    note: "Voucher efectivo México" },
  boleto:    { method_key: "stripe_boleto",           label: "Boleto",               icon: "Banknote",    note: "Voucher bancario Brasil" },
  pix:       { method_key: "stripe_pix",              label: "Pix",                  icon: "Smartphone",  note: "Transferencia instantánea Brasil" },
  alipay:    { method_key: "stripe_alipay",           label: "Alipay",               icon: "Smartphone",  note: "China / Asia" },
  wechat:    { method_key: "stripe_wechat_pay",       label: "WeChat Pay",           icon: "Smartphone",  note: "China" },
  grabpay:   { method_key: "stripe_grabpay",          label: "GrabPay",              icon: "Smartphone",  note: "Sudeste asiático" },
  fpx:       { method_key: "stripe_fpx",              label: "FPX",                  icon: "Building2",   note: "Banca online Malasia" },
  paynow:    { method_key: "stripe_paynow",           label: "PayNow",               icon: "Smartphone",  note: "Singapur" },
  promptpay: { method_key: "stripe_promptpay",        label: "PromptPay",            icon: "Smartphone",  note: "Tailandia" },
  konbini:   { method_key: "stripe_konbini",          label: "Konbini",              icon: "Banknote",    note: "Tiendas de conveniencia Japón" },
  // Nuevos / emergentes 2025-2026
  mbway:     { method_key: "stripe_mb_way",           label: "MB WAY",               icon: "Smartphone",  note: "Pago móvil Portugal" },
  satispay:  { method_key: "stripe_satispay",         label: "Satispay",             icon: "Smartphone",  note: "Italia" },
  zip:       { method_key: "stripe_zip",              label: "Zip",                  icon: "CreditCard",  note: "Compra ahora, paga después (AU/US)" },
  kakaopay:  { method_key: "stripe_kakao_pay",        label: "Kakao Pay",            icon: "Smartphone",  note: "Corea del Sur" },
  naverpay:  { method_key: "stripe_naver_pay",        label: "Naver Pay",            icon: "Smartphone",  note: "Corea del Sur" },
  payco:     { method_key: "stripe_payco",            label: "PAYCO",                icon: "Smartphone",  note: "Corea del Sur" },
  samsungpay:{ method_key: "stripe_samsung_pay",      label: "Samsung Pay",          icon: "Smartphone",  note: "Corea del Sur" },
  billie:    { method_key: "stripe_billie",           label: "Billie",               icon: "CreditCard",  note: "B2B pay-later (DE/AT/NL/SE)" },
} as const;

const EURO = [M.sepa];

// Mapa por código ISO de país → métodos locales adicionales.
const LOCAL: Record<string, StripeMethodDef[]> = {
  US: [M.cashapp, M.us_ach, M.affirm, M.klarna, M.afterpay, M.amazonpay, M.paypal],
  CA: [M.acss, M.klarna, M.afterpay, M.paypal],
  MX: [M.oxxo, M.paypal],
  BR: [M.boleto, M.pix, M.paypal],
  AR: [M.paypal],
  CL: [M.paypal],
  CO: [M.paypal],
  PE: [M.pagoefectivo, M.paypal],
  UY: [M.paypal],

  // Zona euro — SEPA + locales
  DE: [...EURO, M.giropay, M.sofort, M.klarna, M.paypal, M.amazonpay],
  AT: [...EURO, M.eps, M.sofort, M.klarna, M.paypal],
  NL: [...EURO, M.ideal, M.klarna, M.paypal],
  BE: [...EURO, M.bancontact, M.klarna, M.paypal],
  FR: [...EURO, M.klarna, M.paypal, M.revolut],
  ES: [...EURO, M.klarna, M.paypal, M.revolut],
  IT: [...EURO, M.klarna, M.paypal, M.revolut, M.satispay],
  PT: [...EURO, M.multibanco, M.mbway, M.paypal],
  IE: [...EURO, M.klarna, M.paypal, M.revolut],
  FI: [...EURO, M.klarna, M.mobilepay, M.paypal],
  GR: [...EURO, M.paypal],
  LU: [...EURO, M.paypal],
  SK: [...EURO, M.paypal],
  SI: [...EURO, M.paypal],
  EE: [...EURO, M.paypal],
  LV: [...EURO, M.paypal],
  LT: [...EURO, M.paypal],
  MT: [...EURO, M.paypal],
  CY: [...EURO, M.paypal],

  PL: [M.p24, M.blik, M.klarna, M.paypal],
  CZ: [M.klarna, M.paypal],
  RO: [M.paypal],
  HU: [M.paypal],
  BG: [M.paypal],
  HR: [...EURO, M.paypal],

  // Europa no-euro
  GB: [M.bacs, M.klarna, M.afterpay, M.paypal, M.amazonpay, M.revolut],
  CH: [M.twint, M.klarna, M.paypal, M.revolut],
  NO: [M.klarna, M.paypal],
  SE: [M.klarna, M.paypal],
  DK: [M.mobilepay, M.klarna, M.paypal],

  // Oceanía
  AU: [M.becs, M.afterpay, M.zip, M.paypal, M.amazonpay],
  NZ: [M.afterpay, M.paypal],

  // Asia
  JP: [M.konbini, M.paypal],
  KR: [M.kakaopay, M.naverpay, M.payco, M.samsungpay, M.paypal],
  SG: [M.paynow, M.grabpay, M.alipay, M.paypal],
  MY: [M.fpx, M.grabpay, M.paypal],
  HK: [M.alipay, M.wechat, M.paypal],
  TH: [M.promptpay, M.paypal],
  IN: [M.paypal],
  AE: [M.paypal],
  ZA: [M.paypal],
};

// País "*" = fallback global (solo tarjeta + Link + wallets + PayPal).
export function stripeMethodsFor(countryCodes: string[]): StripeMethodDef[] {
  const seen = new Set<string>();
  const out: StripeMethodDef[] = [];
  const push = (m: StripeMethodDef) => {
    if (seen.has(m.method_key)) return;
    seen.add(m.method_key);
    out.push(m);
  };
  GLOBAL.forEach(push);
  WALLETS.forEach(push);
  const codes = (countryCodes || []).map((c) => String(c || "").toUpperCase());
  if (codes.length === 0 || codes.includes("*")) {
    push(M.paypal);
    push(M.klarna);
    push(M.affirm);
  }
  for (const cc of codes) {
    if (!cc || cc === "*") continue;
    const locals = LOCAL[cc];
    if (locals) locals.forEach(push);
  }
  return out;
}
