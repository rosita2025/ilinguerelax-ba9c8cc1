// Translations for the /checkouts/prueba-1 checkout page UI.
// Consumed by Checkout, BuyerInfoForm, PaymentMethodsGroup, OrderSummary.
import type { Language } from "./index";

export interface CheckoutUIStrings {
  verifiedReviewNotice: string;
  // Header
  securePayment: string;
  stripeSSL: string;
  stripeSslMP: string;

  // BuyerInfoForm
  yourDetails: string;
  yourDetailsHint: string;
  ready: string;
  required: string;
  fullName: string;
  fullNamePlaceholder: string;
  fullNameError: string;
  email: string;
  emailPlaceholder: string;
  emailError: string;
  emailHint: string;
  whatsappOptional: string;
  shippingAddress: string;
  addressPlaceholder: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  shippingCountry: string;
  selectCountry: string;
  shipping: string;
  shippingNoticeLatam: string;
  shippingNoticeGlobal: string;
  shippingNoticeAsia: string;
  freeDigitalDelivery: string;
  digitalAlternativeSuggest: string;
  standardShipping: string;
  freeShipping: string;
  digital: string;
  physical: string;
  configureShipping: string;

  // PaymentMethodsGroup
  choosePaymentMethod: string;
  cardPayment: string;
  cardTitlePeru: string;
  cardTitleGlobal: string;
  cardSubtitlePeru: (localBadge: string) => string;
  cardSubtitleGlobal: (currency: string, localBadge: string) => string;
  autoActivatesByCountry: string;
  ssl256: string;
  stripeVerified: string;
  support24h: string;
  processedBy: string;

  bankTransfer: string;
  bankTransferSub: (localBadge: string) => string;
  cashPayment: string;
  cashPaymentSub: (localBadge: string) => string;
  yapePlin: string;
  yapePlinSub: string;

  completeDataFirst: string;
  completeDataFirstDesc: string;
  selectMethod: string;
  mpError: string;
  tryAgain: string;
  errorPayment: string;
  completeYourData: string;

  redirecting: string;
  buyNow: string;
  enableMethods: string;

  // Yape manual
  sendPaymentTo: string;
  amountToPay: string;
  sendEquivalentSoles: string;
  yapeStep1: string;
  yapeStep2: (amount: string, phone: string, name: string) => string;
  yapeStep3: string;
  yapeStep4: string;
  alreadyPaid: string;
  sendReceiptWA: string;
  yapeVerifiedBy: string;
  copied: string;
  tapToCopy: string;

  // OrderSummary
  hideSummary: string;
  showSummary: string;
  yourOrder: string;
  emptyCart: string;
  couponPlaceholder: string;
  applyCoupon: string;
  invalidCoupon: string;
  removeCoupon: string;
  subtotal: string;
  discount: string;
  taxes: string;
  included: string;
  total: string;
  inYourCurrency: string;
  acceptedMethods: string;
  paymentMethod: string;
  currencyBreakdown: string;
  baseUsd: string;
  exchangeRate: string;
  adjustment: string;
  localPrice: string;
  localAdjustmentNotice: string;


  // Footer
  sslEncryption: string;
  mercadoPagoPeru: string;
  whatsappSupport: string;
  returnToProduct: string;
  resetTestProducts: string;
}

const es: CheckoutUIStrings = {
  verifiedReviewNotice: "Reseñas verificadas: ⭐⭐⭐⭐⭐ 5.0/5.0. Exactamente fue rápido envío digital sin demoras.",
  securePayment: "Pago seguro",
  stripeSSL: "Stripe SSL · Pago seguro",
  stripeSslMP: "Stripe SSL · Mercado Pago",

  yourDetails: "Tus datos",
  yourDetailsHint: "Tu acceso se enviará por email. Para libros físicos, la dirección es obligatoria.",
  ready: "Listo",
  required: "Requerido",
  fullName: "Nombre completo *",
  fullNamePlaceholder: "Ej. María López",
  fullNameError: "Ingresa tu nombre completo.",
  email: "Correo electrónico *",
  emailPlaceholder: "tucorreo@email.com",
  emailError: "Ingresa un correo válido.",
  emailHint: "Aquí enviaremos tu acceso al producto digital.",
  whatsappOptional: "WhatsApp (opcional)",
  shippingAddress: "Dirección de envío",
  addressPlaceholder: "Calle, número, departamento...",
  city: "Ciudad",
  stateProvince: "Estado / Provincia",
  postalCode: "Código Postal",
  shippingCountry: "País de envío",
  selectCountry: "Seleccionar país",
  shipping: "Envío",
  shippingNoticeLatam: "Envío a LATAM (Perú, Colombia, México, etc.): $9 USD (5-7 días). Preparación: 7-10 días.",
  shippingNoticeGlobal: "Envío USA/CAN/UK: 3-5 días. Preparación: 5-7 días.",
  shippingNoticeAsia: "Asia y resto del mundo: No disponible actualmente (próximamente).",
  freeDigitalDelivery: "Gratis (Entrega Digital)",
  digitalAlternativeSuggest: "Considera comprar la versión digital disponible para todo el mundo.",
  standardShipping: "Envío Estándar",
  freeShipping: "Envío Gratis",
  digital: "Digital",
  physical: "Físico",
  configureShipping: "Configurar envío e ir al checkout",

  choosePaymentMethod: "Método de pago",
  cardPayment: "Pago con tarjeta",
  cardTitlePeru: "Tarjeta, Apple Pay o Link",
  cardTitleGlobal: "Tarjeta débito o crédito",
  cardSubtitlePeru: (lb) => `Visa · Mastercard · Amex · Apple Pay · Link · Cobro en tu moneda local${lb}`,
  cardSubtitleGlobal: (curr, lb) => `Débito o crédito · Apple Pay · Google Pay · Link · Cobro en ${curr}${lb}`,
  autoActivatesByCountry: "Se activa automáticamente según tu país",
  ssl256: "SSL 256-bit",
  stripeVerified: "Stripe verificado",
  support24h: "Soporte 24h",
  processedBy: "Pago procesado de forma segura por Stripe",

  bankTransfer: "Transferencia bancaria",
  bankTransferSub: (lb) => `BCP · BBVA · Interbank · Scotiabank · Conversión automática${lb}`,
  cashPayment: "Pago en efectivo",
  cashPaymentSub: (lb) => `PagoEfectivo · Western Union · Tambo · Kasnet${lb}`,
  yapePlin: "Yape o Plin",
  yapePlinSub: "Pago manual · Verificación 1-24h por Supervisora Rosa",

  completeDataFirst: "Completa tus datos primero",
  completeDataFirstDesc: "Ingresa tu nombre y correo para continuar con el pago.",
  selectMethod: "Selecciona un método de pago",
  mpError: "Error Mercado Pago",
  tryAgain: "Intenta de nuevo",
  errorPayment: "Error de pago",
  completeYourData: "Completa tus datos",

  redirecting: "Redirigiendo…",
  buyNow: "Comprar ahora",
  enableMethods: "👆 Completa tu nombre y correo arriba para habilitar los métodos de pago.",

  sendPaymentTo: "Envía el pago a",
  amountToPay: "Monto a pagar",
  sendEquivalentSoles: "Envía el equivalente en soles al tipo de cambio del día.",
  yapeStep1: "Abre tu app de Yape o Plin.",
  yapeStep2: (a, p, n) => `Envía ${a} al número ${p} (${n}).`,
  yapeStep3: "Guarda la captura del comprobante.",
  yapeStep4: "Presiona “Ya pagué” y envíanos el comprobante por WhatsApp.",
  alreadyPaid: "Ya pagué → Enviar comprobante",
  sendReceiptWA: "Enviar comprobante directo por WhatsApp",
  yapeVerifiedBy: "Nuestra Supervisora Rosa revisa los pagos manualmente desde Perú. Recibirás tu producto en 1 a 24 horas tras confirmar el comprobante.",
  copied: "¡Copiado!",
  tapToCopy: "Toca para copiar el número",

  hideSummary: "Ocultar resumen",
  showSummary: "Ver resumen",
  yourOrder: "Tu pedido",
  emptyCart: "Carrito vacío",
  couponPlaceholder: "Código de descuento",
  applyCoupon: "Aplicar",
  invalidCoupon: "Cupón inválido",
  removeCoupon: "Quitar cupón",
  subtotal: "Subtotal",
  discount: "Descuento",
  taxes: "Impuestos",
  included: "Incluidos",
  total: "Total",
  inYourCurrency: "en tu moneda",
  acceptedMethods: "MÉTODOS DE PAGO ACEPTADOS:",
  paymentMethod: "Método de pago",
  currencyBreakdown: "Desglose de moneda",
  baseUsd: "Precio base USD",
  exchangeRate: "Tasa de cambio",
  adjustment: "Ajuste regional",
  localPrice: "Precio local",
  localAdjustmentNotice: "Aplicamos un ajuste regional para bajar el precio en moneda local.",


  sslEncryption: "Encriptación SSL Stripe",
  mercadoPagoPeru: "Mercado Pago Perú",
  whatsappSupport: "Soporte WhatsApp",
  returnToProduct: "Volver al producto",
  resetTestProducts: "Restablecer productos de prueba",
};

const en: CheckoutUIStrings = {
  verifiedReviewNotice: "Verified Reviews: ⭐⭐⭐⭐⭐ 5.0/5.0. Immediate digital delivery and high quality.",
  securePayment: "Secure payment",
  stripeSSL: "Stripe SSL · Secure payment",
  stripeSslMP: "Stripe SSL · Mercado Pago",

  yourDetails: "Your details",
  yourDetailsHint: "Access will be sent to your email. Shipping address required for physical books.",
  ready: "Ready",
  required: "Required",
  fullName: "Full Name *",
  fullNamePlaceholder: "e.g. Mary Dupont",
  fullNameError: "Please enter your full name.",
  email: "Email *",
  emailPlaceholder: "your@email.com",
  emailError: "Please enter a valid email.",
  emailHint: "Your digital access will be sent here immediately.",
  whatsappOptional: "WhatsApp (optional)",
  shippingAddress: "Shipping Address",
  addressPlaceholder: "Street, number, apartment...",
  city: "City",
  stateProvince: "State / Province",
  postalCode: "Postal Code",
  shippingCountry: "Shipping Country",
  selectCountry: "Select country",
  shipping: "Shipping",
  shippingNoticeLatam: "LATAM Shipping: $9 USD (5-7 business days).",
  shippingNoticeGlobal: "USA/CAN/UK Shipping: $8 USD (3-5 business days).",
  shippingNoticeAsia: "Asia & Oceania: Currently unavailable (coming soon).",
  freeDigitalDelivery: "Free (Digital Delivery)",
  digitalAlternativeSuggest: "Consider purchasing the digital version available worldwide.",
  standardShipping: "Standard Shipping",
  freeShipping: "Free Shipping",
  digital: "Digital",
  physical: "Physical",
  configureShipping: "Configure shipping & checkout",

  choosePaymentMethod: "Payment Method",
  cardPayment: "Card payment",
  cardTitlePeru: "Card, Apple Pay or Link",
  cardTitleGlobal: "Debit or Credit Card",
  cardSubtitlePeru: (lb) => `Visa · Mastercard · Amex · Apple Pay · Link${lb}`,
  cardSubtitleGlobal: (curr, lb) => `Credit or Debit Card · Apple Pay · Google Pay · Link · Charged in ${curr}${lb}`,
  autoActivatesByCountry: "Automatically enabled for your country",
  ssl256: "SSL 256-bit",
  stripeVerified: "Stripe verified",
  support24h: "24h support",
  processedBy: "Securely processed by Stripe",

  bankTransfer: "Bank transfer",
  bankTransferSub: (lb) => `BCP · BBVA · Interbank · Scotiabank · Automatic conversion${lb}`,
  cashPayment: "Cash payment",
  cashPaymentSub: (lb) => `PagoEfectivo · Western Union · Tambo · Kasnet${lb}`,
  yapePlin: "Yape or Plin",
  yapePlinSub: "Manual payment · 1-24h verification by Supervisor Rosa",

  completeDataFirst: "Complete your details first",
  completeDataFirstDesc: "Enter your name and email to continue with payment.",
  selectMethod: "Select a payment method",
  mpError: "Mercado Pago error",
  tryAgain: "Please try again",
  errorPayment: "Payment error",
  completeYourData: "Complete your details",

  redirecting: "Redirecting…",
  buyNow: "Buy now",
  enableMethods: "👆 Please complete your details to enable payment methods.",

  sendPaymentTo: "Send payment to",
  amountToPay: "Amount to pay",
  sendEquivalentSoles: "Send the equivalent in soles at today's exchange rate.",
  yapeStep1: "Open your Yape or Plin app.",
  yapeStep2: (a, p, n) => `Send ${a} to number ${p} (${n}).`,
  yapeStep3: "Save the payment receipt screenshot.",
  yapeStep4: 'Press "I paid" and send us the receipt on WhatsApp.',
  alreadyPaid: "I paid → Send receipt",
  sendReceiptWA: "Send receipt directly via WhatsApp",
  yapeVerifiedBy: "Our Supervisor Rosa reviews payments manually from Peru. You'll receive your product within 1 to 24 hours after receipt confirmation.",
  copied: "Copied!",
  tapToCopy: "Tap to copy the number",

  hideSummary: "Hide summary",
  showSummary: "Show summary",
  yourOrder: "Summary",
  emptyCart: "Empty cart",
  couponPlaceholder: "Discount code",
  applyCoupon: "Apply",
  invalidCoupon: "Invalid coupon",
  removeCoupon: "Remove coupon",
  subtotal: "Subtotal",
  discount: "Discount",
  taxes: "Taxes",
  included: "Included",
  total: "Total",
  inYourCurrency: "in your currency",
  acceptedMethods: "ACCEPTED PAYMENT METHODS:",
  paymentMethod: "Payment Method",
  currencyBreakdown: "Currency Breakdown",
  baseUsd: "Base Price USD",
  exchangeRate: "Exchange Rate",
  adjustment: "Regional Adjustment",
  localPrice: "Local Price",
  localAdjustmentNotice: "A regional adjustment was applied to lower the local price.",


  sslEncryption: "SSL Stripe encryption",
  mercadoPagoPeru: "Mercado Pago Peru",
  whatsappSupport: "WhatsApp support",
  returnToProduct: "Return to product",
  resetTestProducts: "Reset test products",
};

const pt: CheckoutUIStrings = {
  verifiedReviewNotice: "Avaliações verificadas: ⭐⭐⭐⭐⭐ 5.0/5.0. Entrega digital exatamente rápida e sem atrasos.",
  securePayment: "Pagamento seguro",
  stripeSSL: "Stripe SSL · Pagamento seguro",
  stripeSslMP: "Stripe SSL · Mercado Pago",

  yourDetails: "Seus dados",
  yourDetailsHint: "Seu acesso será enviado por e-mail. Para livros físicos, o endereço é obrigatório.",
  ready: "Pronto",
  required: "Obrigatório",
  fullName: "Nome completo *",
  fullNamePlaceholder: "Ex. Maria Silva",
  fullNameError: "Digite seu nome completo.",
  email: "E-mail *",
  emailPlaceholder: "seuemail@email.com",
  emailError: "Digite um e-mail válido.",
  emailHint: "Aqui enviaremos seu acesso ao produto digital.",
  whatsappOptional: "WhatsApp (opcional)",
  shippingAddress: "Endereço de entrega",
  addressPlaceholder: "Rua, número, apartamento...",
  city: "Cidade",
  stateProvince: "Estado / Província",
  postalCode: "Código Postal",
  shippingCountry: "País de entrega",
  selectCountry: "Selecionar país",
  shipping: "Envio",
  shippingNoticeLatam: "Envio para LATAM: $9 USD (5-7 dias). Preparação: 7-10 dias.",
  shippingNoticeGlobal: "Envio EUA/CAN/UK: 3-5 dias. Preparação: 5-7 dias.",
  shippingNoticeAsia: "Ásia: Não disponível no momento (em breve).",
  freeDigitalDelivery: "Grátis (Entrega Digital)",
  digitalAlternativeSuggest: "Considere comprar a versão digital disponível para todo o mundo.",
  standardShipping: "Envio Padrão",
  freeShipping: "Envio Grátis",
  digital: "Digital",
  physical: "Físico",
  configureShipping: "Configurar envio e checkout",

  choosePaymentMethod: "Método de pagamento",
  cardPayment: "Pagamento com cartão",
  cardTitlePeru: "Cartão, Apple Pay ou Link",
  cardTitleGlobal: "Cartão de débito ou crédito",
  cardSubtitlePeru: (lb) => `Visa · Mastercard · Amex · Apple Pay · Link · Cobrado na sua moeda local${lb}`,
  cardSubtitleGlobal: (curr, lb) => `Débito ou crédito · Apple Pay · Google Pay · Link · Cobrado em ${curr}${lb}`,
  autoActivatesByCountry: "Ativa-se automaticamente conforme seu país",
  ssl256: "SSL 256-bit",
  stripeVerified: "Stripe verificado",
  support24h: "Suporte 24h",
  processedBy: "Pagamento processado com segurança pela Stripe",

  bankTransfer: "Transferência bancária",
  bankTransferSub: (lb) => `BCP · BBVA · Interbank · Scotiabank · Conversão automática${lb}`,
  cashPayment: "Pagamento em dinheiro",
  cashPaymentSub: (lb) => `PagoEfectivo · Western Union · Tambo · Kasnet${lb}`,
  yapePlin: "Yape ou Plin",
  yapePlinSub: "Pagamento manual · Verificação 1-24h pela Supervisora Rosa",

  completeDataFirst: "Complete seus dados primeiro",
  completeDataFirstDesc: "Digite seu nome e e-mail para continuar com o pagamento.",
  selectMethod: "Selecione uma forma de pagamento",
  mpError: "Erro no Mercado Pago",
  tryAgain: "Tente novamente",
  errorPayment: "Erro de pagamento",
  completeYourData: "Complete seus dados",

  redirecting: "Redirecionando…",
  buyNow: "Comprar agora",
  enableMethods: "👆 Complete seu nome e e-mail acima para ativar as formas de pagamento.",

  sendPaymentTo: "Envie o pagamento para",
  amountToPay: "Valor a pagar",
  sendEquivalentSoles: "Envie o equivalente em soles pela taxa de câmbio do dia.",
  yapeStep1: "Abra seu app Yape ou Plin.",
  yapeStep2: (a, p, n) => `Envie ${a} para o número ${p} (${n}).`,
  yapeStep3: "Salve a captura do comprovante.",
  yapeStep4: 'Pressione "Já paguei" e nos envie o comprovante pelo WhatsApp.',
  alreadyPaid: "Já paguei → Enviar comprovante",
  sendReceiptWA: "Enviar comprovante direto pelo WhatsApp",
  yapeVerifiedBy: "Nossa Supervisora Rosa revisa os pagamentos manualmente do Peru. Você receberá seu produto em 1 a 24 horas após a confirmação do comprovante.",
  copied: "Copiado!",
  tapToCopy: "Toque para copiar o número",

  hideSummary: "Ocultar resumo",
  showSummary: "Ver resumo",
  yourOrder: "Seu pedido",
  emptyCart: "Carrinho vazio",
  couponPlaceholder: "Código de desconto",
  applyCoupon: "Aplicar",
  invalidCoupon: "Cupom inválido",
  removeCoupon: "Remover cupom",
  subtotal: "Subtotal",
  discount: "Desconto",
  taxes: "Impostos",
  included: "Inclusos",
  total: "Total",
  inYourCurrency: "na sua moeda",
  acceptedMethods: "MÉTODOS DE PAGAMENTO ACEITOS:",
  paymentMethod: "Método de pagamento",
  currencyBreakdown: "Detalhamento da moeda",
  baseUsd: "Preço base USD",
  exchangeRate: "Taxa de câmbio",
  adjustment: "Ajuste regional",
  localPrice: "Preço local",
  localAdjustmentNotice: "Um ajuste regional foi aplicado para baixar o preço local.",


  sslEncryption: "Criptografia SSL Stripe",
  mercadoPagoPeru: "Mercado Pago Peru",
  whatsappSupport: "Suporte WhatsApp",
  returnToProduct: "Voltar ao produto",
  resetTestProducts: "Redefinir produtos de teste",
};

const fr: CheckoutUIStrings = {
  verifiedReviewNotice: "Avis vérifiés : ⭐⭐⭐⭐⭐ 5.0/5.0. Livraison numérique exactement rapide et sans délai.",
  securePayment: "Paiement sécurisé",
  stripeSSL: "Stripe SSL · Paiement sécurisé",
  stripeSslMP: "Stripe SSL · Mercado Pago",

  yourDetails: "Vos coordonnées",
  yourDetailsHint: "Votre accès sera envoyé par e-mail. Pour les livres physiques, l'adresse est obligatoire.",
  ready: "Prêt",
  required: "Requis",
  fullName: "Nom complet *",
  fullNamePlaceholder: "Ex. Marie Dupont",
  fullNameError: "Veuillez saisir votre nom complet.",
  email: "Adresse e-mail *",
  emailPlaceholder: "vous@email.com",
  emailError: "Veuillez saisir un e-mail valide.",
  emailHint: "Nous vous enverrons l'accès au produit ici.",
  whatsappOptional: "WhatsApp (facultatif)",
  shippingAddress: "Adresse de livraison",
  addressPlaceholder: "Rue, numéro, appartement...",
  city: "Ville",
  stateProvince: "État / Province",
  postalCode: "Code postal",
  shippingCountry: "Pays de livraison",
  selectCountry: "Sélectionner le pays",
  shipping: "Livraison",
  shippingNoticeLatam: "Livraison LATAM : 9 $ USD (5-7 jours). Préparation : 7-10 jours.",
  shippingNoticeGlobal: "Livraison USA/CAN/UK : 3-5 jours. Préparation : 5-7 jours.",
  shippingNoticeAsia: "Asie : Non disponible pour le moment (bientôt disponible).",
  freeDigitalDelivery: "Gratuit (Livraison numérique)",
  digitalAlternativeSuggest: "Pensez à acheter la version numérique disponible dans le monde entier.",
  standardShipping: "Livraison standard",
  freeShipping: "Livraison gratuite",
  digital: "Numérique",
  physical: "Physique",
  configureShipping: "Configurer la livraison et commander",

  choosePaymentMethod: "Mode de paiement",
  cardPayment: "Paiement par carte",
  cardTitlePeru: "Carte, Apple Pay ou Link",
  cardTitleGlobal: "Carte de débit ou crédit",
  cardSubtitlePeru: (lb) => `Visa · Mastercard · Amex · Apple Pay · Link · Débité dans votre monnaie locale${lb}`,
  cardSubtitleGlobal: (curr, lb) => `Débit ou crédit · Apple Pay · Google Pay · Link · Débité en ${curr}${lb}`,
  autoActivatesByCountry: "Activé automatiquement selon votre pays",
  ssl256: "SSL 256 bits",
  stripeVerified: "Stripe vérifié",
  support24h: "Support 24h",
  processedBy: "Paiement traité en toute sécurité par Stripe",

  bankTransfer: "Virement bancaire",
  bankTransferSub: (lb) => `BCP · BBVA · Interbank · Scotiabank · Conversion automatique${lb}`,
  cashPayment: "Paiement en espèces",
  cashPaymentSub: (lb) => `PagoEfectivo · Western Union · Tambo · Kasnet${lb}`,
  yapePlin: "Yape ou Plin",
  yapePlinSub: "Paiement manuel · Vérification 1-24h par la Superviseure Rosa",

  completeDataFirst: "Complétez d'abord vos coordonnées",
  completeDataFirstDesc: "Saisissez votre nom et e-mail pour continuer.",
  selectMethod: "Sélectionnez un mode de paiement",
  mpError: "Erreur Mercado Pago",
  tryAgain: "Réessayez",
  errorPayment: "Erreur de paiement",
  completeYourData: "Complétez vos coordonnées",

  redirecting: "Redirection…",
  buyNow: "Acheter maintenant",
  enableMethods: "👆 Complétez votre nom et e-mail ci-dessus pour activer les modes de paiement.",

  sendPaymentTo: "Envoyer le paiement à",
  amountToPay: "Montant à payer",
  sendEquivalentSoles: "Envoyez l'équivalent en soles au taux du jour.",
  yapeStep1: "Ouvrez votre app Yape ou Plin.",
  yapeStep2: (a, p, n) => `Envoyez ${a} au numéro ${p} (${n}).`,
  yapeStep3: "Sauvegardez la capture du reçu.",
  yapeStep4: 'Appuyez sur "J\'ai payé" et envoyez-nous le reçu par WhatsApp.',
  alreadyPaid: "J'ai payé → Envoyer le reçu",
  sendReceiptWA: "Envoyer le reçu directement par WhatsApp",
  yapeVerifiedBy: "Notre Superviseure Rosa vérifie les paiements manuellement depuis le Pérou. Vous recevrez votre produit sous 1 à 24 heures après confirmation du reçu.",
  copied: "Copié !",
  tapToCopy: "Touchez pour copier le numéro",

  hideSummary: "Masquer le résumé",
  showSummary: "Voir le résumé",
  yourOrder: "Votre commande",
  emptyCart: "Panier vide",
  couponPlaceholder: "Code de réduction",
  applyCoupon: "Appliquer",
  invalidCoupon: "Coupon invalide",
  removeCoupon: "Retirer le coupon",
  subtotal: "Sous-total",
  discount: "Remise",
  taxes: "Taxes",
  included: "Incluses",
  total: "Total",
  inYourCurrency: "dans votre monnaie",
  acceptedMethods: "MODES DE PAIEMENT ACCEPTÉS :",
  paymentMethod: "Mode de paiement",
  currencyBreakdown: "Détail de la monnaie",
  baseUsd: "Prix de base USD",
  exchangeRate: "Taux de change",
  adjustment: "Ajustement régional",
  localPrice: "Prix local",
  localAdjustmentNotice: "Un ajustement régional a été appliqué pour baisser le prix local.",


  sslEncryption: "Chiffrement SSL Stripe",
  mercadoPagoPeru: "Mercado Pago Pérou",
  whatsappSupport: "Support WhatsApp",
  returnToProduct: "Retour au produit",
  resetTestProducts: "Réinitialiser les produits de test",
};

export const checkoutUIStrings: Record<Language, CheckoutUIStrings> = { es, en, pt, fr };

export function getCheckoutUI(lang: Language): CheckoutUIStrings {
  return checkoutUIStrings[lang] || checkoutUIStrings.es;
}
