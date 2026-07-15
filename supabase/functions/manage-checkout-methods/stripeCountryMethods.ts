// Mapa oficial de métodos Stripe disponibles por país (comprador).
// Fuente: https://docs.stripe.com/payments/payment-methods/payment-method-support
// Cada método se representa como { method_key, label, icon, note }.
// El admin puede sobreescribir o desactivar cualquiera después de auto-rellenar.

export type StripeMethodDef = {
  method_key: string;
  label: string;
  icon: string;
  note: string;
};

// Métodos globales — funcionan en casi todos los países que soporta Stripe.
const GLOBAL: StripeMethodDef[] = [
  { method_key: "stripe_card", label: "Tarjeta débito/crédito", icon: "CreditCard", note: "Visa, Mastercard, Amex vía Stripe" },
  { method_key: "stripe_link", label: "Link (Stripe)", icon: "Wallet", note: "Autocompletado con 1 clic de Stripe" },
];

// Wallets móviles — se activan automáticamente en Stripe si el dispositivo/navegador los soporta.
const WALLETS: StripeMethodDef[] = [
  { method_key: "stripe_apple_pay", label: "Apple Pay", icon: "Smartphone", note: "iPhone / Safari" },
  { method_key: "stripe_google_pay", label: "Google Pay", icon: "Smartphone", note: "Android / Chrome" },
];

// Mapa por código ISO de país → métodos locales adicionales.
const LOCAL: Record<string, StripeMethodDef[]> = {
  US: [
    { method_key: "stripe_cashapp", label: "Cash App Pay", icon: "Smartphone", note: "Solo compradores en USA" },
    { method_key: "stripe_us_bank_account", label: "US Bank (ACH)", icon: "Banknote", note: "Transferencia bancaria ACH" },
    { method_key: "stripe_affirm", label: "Affirm", icon: "CreditCard", note: "Compra ahora, paga después (USA)" },
    { method_key: "stripe_klarna", label: "Klarna", icon: "CreditCard", note: "Paga en 4 (USA)" },
  ],
  CA: [
    { method_key: "stripe_acss_debit", label: "Débito bancario (Canadá)", icon: "Banknote", note: "Débito preautorizado canadiense" },
    { method_key: "stripe_klarna", label: "Klarna", icon: "CreditCard", note: "Paga en 4 (Canadá)" },
  ],
  MX: [
    { method_key: "stripe_oxxo", label: "OXXO", icon: "Banknote", note: "Voucher pago en efectivo (México)" },
  ],
  BR: [
    { method_key: "stripe_boleto", label: "Boleto", icon: "Banknote", note: "Voucher bancario (Brasil)" },
    { method_key: "stripe_pix", label: "Pix", icon: "Smartphone", note: "Transferencia instantánea (Brasil)" },
  ],
  // Europa — SEPA aplica en toda la zona euro
  DE: [
    { method_key: "stripe_sepa_debit", label: "SEPA débito directo", icon: "Banknote", note: "Zona euro" },
    { method_key: "stripe_giropay", label: "Giropay", icon: "Building2", note: "Banca online (Alemania)" },
    { method_key: "stripe_klarna", label: "Klarna", icon: "CreditCard", note: "Paga después (Alemania)" },
  ],
  NL: [
    { method_key: "stripe_sepa_debit", label: "SEPA débito directo", icon: "Banknote", note: "Zona euro" },
    { method_key: "stripe_ideal", label: "iDEAL", icon: "Building2", note: "Banca online (Países Bajos)" },
  ],
  BE: [
    { method_key: "stripe_sepa_debit", label: "SEPA débito directo", icon: "Banknote", note: "Zona euro" },
    { method_key: "stripe_bancontact", label: "Bancontact", icon: "Building2", note: "Bélgica" },
  ],
  FR: [
    { method_key: "stripe_sepa_debit", label: "SEPA débito directo", icon: "Banknote", note: "Zona euro" },
    { method_key: "stripe_klarna", label: "Klarna", icon: "CreditCard", note: "Paga después (Francia)" },
  ],
  ES: [
    { method_key: "stripe_sepa_debit", label: "SEPA débito directo", icon: "Banknote", note: "Zona euro" },
    { method_key: "stripe_klarna", label: "Klarna", icon: "CreditCard", note: "Paga después (España)" },
  ],
  IT: [{ method_key: "stripe_sepa_debit", label: "SEPA débito directo", icon: "Banknote", note: "Zona euro" }],
  PT: [{ method_key: "stripe_sepa_debit", label: "SEPA débito directo", icon: "Banknote", note: "Zona euro" }],
  AT: [{ method_key: "stripe_sepa_debit", label: "SEPA débito directo", icon: "Banknote", note: "Zona euro" }],
  IE: [{ method_key: "stripe_sepa_debit", label: "SEPA débito directo", icon: "Banknote", note: "Zona euro" }],
  PL: [
    { method_key: "stripe_p24", label: "Przelewy24 (P24)", icon: "Building2", note: "Banca online (Polonia)" },
  ],
  GB: [
    { method_key: "stripe_bacs_debit", label: "Bacs débito directo", icon: "Banknote", note: "Reino Unido" },
    { method_key: "stripe_klarna", label: "Klarna", icon: "CreditCard", note: "Paga después (UK)" },
  ],
  AU: [
    { method_key: "stripe_au_becs_debit", label: "BECS débito (Australia)", icon: "Banknote", note: "Débito bancario AU" },
    { method_key: "stripe_afterpay_clearpay", label: "Afterpay", icon: "CreditCard", note: "Paga en 4 (Australia)" },
  ],
  NZ: [
    { method_key: "stripe_afterpay_clearpay", label: "Afterpay", icon: "CreditCard", note: "Nueva Zelanda" },
  ],
  JP: [],
  SG: [{ method_key: "stripe_grabpay", label: "GrabPay", icon: "Smartphone", note: "Sudeste asiático" }],
  MY: [{ method_key: "stripe_grabpay", label: "GrabPay", icon: "Smartphone", note: "Malasia" }],
  HK: [{ method_key: "stripe_alipay", label: "Alipay", icon: "Smartphone", note: "Asia" }],
  IN: [{ method_key: "stripe_upi", label: "UPI", icon: "Smartphone", note: "India" }],
};

// País "*" = fallback global (solo tarjeta + wallets).
export function stripeMethodsFor(countryCodes: string[]): StripeMethodDef[] {
  const seen = new Set<string>();
  const out: StripeMethodDef[] = [];
  const push = (m: StripeMethodDef) => {
    if (seen.has(m.method_key)) return;
    seen.add(m.method_key);
    out.push(m);
  };
  // siempre añadir card + wallets + link
  GLOBAL.forEach(push);
  WALLETS.forEach(push);
  // sumar métodos locales por cada país listado
  for (const raw of countryCodes) {
    const cc = String(raw || "").toUpperCase();
    if (!cc || cc === "*") continue;
    const locals = LOCAL[cc];
    if (locals) locals.forEach(push);
  }
  return out;
}
