/**
 * Etiqueta corta por método de pago (solo presentación) para /admin/checkout-methods.
 * Usa los mismos textos y colores que ve el comprador en el checkout.
 */
export type MethodTag = { text: string; cls: string };

const T = {
  recommended: { text: "Recomendado", cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200" },
  card: { text: "Tarjeta", cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200" },
  fast: { text: "Pago rápido", cls: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200" },
  bank: { text: "Desde tu banco", cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200" },
  debit: { text: "Débito directo", cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200" },
  noCard: { text: "Sin tarjeta", cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200" },
  installments: { text: "En cuotas", cls: "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-200" },
  crypto: { text: "Cripto", cls: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200" },
  oneClick: { text: "1 clic", cls: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200" },
} satisfies Record<string, MethodTag>;

const BY_KEY: Record<string, MethodTag> = {
  stripe_card: T.recommended,
  stripe_link: T.fast, stripe_apple_pay: T.fast, stripe_google_pay: T.fast,
  stripe_cashapp: T.fast, stripe_pix: T.fast, stripe_mb_way: T.fast, stripe_blik: T.fast,
  stripe_twint: T.fast, stripe_mobilepay: T.fast, stripe_grabpay: T.fast, stripe_paynow: T.fast,
  stripe_alipay: T.fast, stripe_wechat_pay: T.fast, stripe_paypal: T.fast, paypal: T.fast,
  yape_plin: T.fast, dlocal_wallet: T.fast, dlocal_mercadopago: T.fast,
  stripe_us_bank_account: T.bank, stripe_ideal: T.bank, stripe_bancontact: T.bank, stripe_sofort: T.bank,
  stripe_giropay: T.bank, stripe_eps: T.bank, stripe_p24: T.bank, stripe_acss_debit: T.bank,
  mercadopago_transfer: T.bank, dlocal_transfer: T.bank, clabe_mx: T.bank,
  stripe_sepa_debit: T.debit, stripe_bacs_debit: T.debit,
  stripe_klarna: T.installments, stripe_affirm: T.installments, stripe_afterpay_clearpay: T.installments,
  stripe_oxxo: T.noCard, stripe_boleto: T.noCard, stripe_multibanco: T.noCard, stripe_konbini: T.noCard,
  mercadopago_cash: T.noCard, dlocal_cash: T.noCard,
  binance_pay: T.crypto,
  hotmart_1click: T.oneClick,
  stripe_amazon_pay: T.fast, stripe_satispay: T.fast, stripe_bizum: T.fast,
  stripe_kakao_pay: T.fast, stripe_naver_pay: T.fast, stripe_payco: T.fast, stripe_samsung_pay: T.fast,
  stripe_kr_card: T.card,
  stripe_scalapay: T.installments, stripe_zip: T.installments,
  stripe_pay_by_bank: T.bank, stripe_customer_balance: T.bank,
  stripe_crypto: T.crypto,
};

export const getMethodTag = (methodKey: string): MethodTag | null => BY_KEY[(methodKey || "").toLowerCase()] ?? null;

/** Color del icono según el tipo de método (igual que en el checkout). */
export const getMethodTone = (methodKey: string): string => {
  const k = (methodKey || "").toLowerCase();
  const tag = BY_KEY[k];
  if (tag === T.recommended || tag === T.card) return "text-emerald-600";
  if (tag === T.bank || tag === T.debit) return "text-blue-600";
  if (tag === T.noCard) return "text-amber-600";
  if (tag === T.fast) return "text-purple-600";
  if (tag === T.crypto) return "text-yellow-600";
  if (tag === T.installments) return "text-pink-600";
  if (tag === T.oneClick) return "text-orange-600";
  return "text-foreground/70";
};
