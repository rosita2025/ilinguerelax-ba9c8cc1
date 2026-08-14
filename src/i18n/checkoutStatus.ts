// Translations for post-payment pages (Success / Pending / Failure / Return)
// Selected automatically by IP-detected language in I18nContext.
import type { Language } from "./index";

export interface CheckoutStatusStrings {
  // meta / header
  metaSuccess: string;
  metaPending: string;
  metaFailure: string;
  metaReturn: string;

  // Success
  orderConfirmed: string;
  orderNumber: string;
  thanks: (name?: string) => string;
  successIntro: (email?: string) => string;
  whatsNext: string;
  checkInbox: string;
  checkInboxDesc: string;
  accessProduct: string;
  accessProductDesc: string;
  needHelp: string;
  messageUsOn: string;
  orderSummary: string;
  qty: string;
  subtotal: string;
  discount: string;
  totalPaid: string;
  paymentReference: string;
  paymentId: string;
  paymentStatus: string;
  paymentRef: string;
  continueShopping: string;
  contactSupport: string;
  shippingEligibility: string;
  shippingEligibilityDesc: string;
  paymentMethodConfirmed: string;
  digitalDeliveredFirst: string;
  physicalInProgress: string;
  trackingComingSoon: string;


  // Pending
  paymentPending: string;
  pendingDesc: string;
  confirmationEmail: string;
  confirmationEmailDesc: string;
  fasterReceipt: string;
  fasterReceiptDesc: string;
  backHome: string;
  whatsappSupport: string;

  // Failure
  paymentNotCompleted: string;
  failureDesc: string;
  tryAgain: string;

  // Return
  confirmingPayment: string;
}

const es: CheckoutStatusStrings = {
  metaSuccess: "¡Gracias por tu compra! · iLingue Relax",
  metaPending: "Pago pendiente · iLingue Relax",
  metaFailure: "Pago no completado · iLingue Relax",
  metaReturn: "Procesando pago · iLingue Relax",

  orderConfirmed: "Pedido confirmado",
  orderNumber: "Pedido",
  thanks: (name) => `¡Gracias${name ? `, ${name}` : ""}!`,
  successIntro: (email) =>
    email
      ? `Tu pedido está confirmado. Enviamos un correo de confirmación a ${email} con tus enlaces de descarga y comprobante.`
      : "Tu pedido está confirmado. Enviamos un correo con tus enlaces de descarga y comprobante.",
  whatsNext: "¿Qué sigue?",
  checkInbox: "Revisa tu correo",
  checkInboxDesc: "Los enlaces llegan en 1-5 minutos. Revisa spam si no lo ves.",
  accessProduct: "Accede a tu producto",
  accessProductDesc: "Sigue el enlace del correo para desbloquear tus materiales.",
  needHelp: "¿Necesitas ayuda?",
  messageUsOn: "Escríbenos por",
  orderSummary: "Resumen del pedido",
  qty: "Cant.",
  subtotal: "Subtotal",
  discount: "Descuento",
  totalPaid: "Total pagado",
  paymentReference: "Referencia de pago",
  paymentId: "ID",
  paymentStatus: "Estado",
  paymentRef: "Ref",
  continueShopping: "Seguir comprando",
  contactSupport: "Contactar soporte",
  shippingEligibility: "Elegibilidad de envío confirmada",
  shippingEligibilityDesc: "Tu pedido es elegible para envío internacional a Perú, Colombia, México, Argentina y más.",
  paymentMethodConfirmed: "Método de pago confirmado",
  digitalDeliveredFirst: "Material digital enviado (inmediato)",
  physicalInProgress: "Envío físico en preparación",
  trackingComingSoon: "El código de seguimiento se enviará pronto",


  paymentPending: "Pago pendiente",
  pendingDesc:
    "Tu pago se está procesando (PagoEfectivo, transferencia u otro método offline). Te avisaremos por correo apenas se confirme — normalmente entre 1 y 24 horas.",
  confirmationEmail: "Correo de confirmación",
  confirmationEmailDesc: "Recibirás tu enlace de descarga automáticamente al confirmarse.",
  fasterReceipt: "¿Más rápido? Envíanos el comprobante",
  fasterReceiptDesc: "Escríbenos por",
  backHome: "Volver al inicio",
  whatsappSupport: "Soporte por WhatsApp",

  paymentNotCompleted: "Pago no completado",
  failureDesc:
    "Tu pago fue rechazado o cancelado. Tu carrito sigue guardado — intenta con otro método o contáctanos.",
  tryAgain: "Intentar de nuevo",

  confirmingPayment: "Confirmando tu pago…",
};

const en: CheckoutStatusStrings = {
  metaSuccess: "Thanks for your purchase · iLingue Relax",
  metaPending: "Payment pending · iLingue Relax",
  metaFailure: "Payment not completed · iLingue Relax",
  metaReturn: "Processing payment · iLingue Relax",

  orderConfirmed: "Order confirmed",
  orderNumber: "Order",
  thanks: (name) => `Thanks${name ? `, ${name}` : ""}!`,
  successIntro: (email) =>
    email
      ? `Your order is confirmed. We've sent a confirmation email to ${email} with your download links and receipt.`
      : "Your order is confirmed. We've sent a confirmation email with your download links and receipt.",
  whatsNext: "What's next?",
  checkInbox: "Check your inbox",
  checkInboxDesc: "Your download links arrive in 1-5 minutes. Check spam if you don't see it.",
  accessProduct: "Access your product",
  accessProductDesc: "Follow the link in the email to unlock your materials.",
  needHelp: "Need help?",
  messageUsOn: "Message us on",
  orderSummary: "Order summary",
  qty: "Qty",
  subtotal: "Subtotal",
  discount: "Discount",
  totalPaid: "Total paid",
  paymentReference: "Payment reference",
  paymentId: "ID",
  paymentStatus: "Status",
  paymentRef: "Ref",
  continueShopping: "Continue shopping",
  contactSupport: "Contact support",
  shippingEligibility: "Shipping eligibility confirmed",
  shippingEligibilityDesc: "Your order is eligible for international shipping to Peru, Colombia, Mexico, Argentina, and more.",
  paymentMethodConfirmed: "Payment method confirmed",
  digitalDeliveredFirst: "Digital material sent (immediate)",
  physicalInProgress: "Physical shipping in preparation",
  trackingComingSoon: "Tracking code will be sent soon",


  paymentPending: "Payment pending",
  pendingDesc:
    "Your payment is being processed (PagoEfectivo, bank transfer, or another offline method). We'll email you the moment it's confirmed — usually within 1-24 hours.",
  confirmationEmail: "Confirmation email",
  confirmationEmailDesc: "You'll receive your download link automatically after confirmation.",
  fasterReceipt: "Faster? Send us the receipt",
  fasterReceiptDesc: "Message on",
  backHome: "Back to home",
  whatsappSupport: "WhatsApp support",

  paymentNotCompleted: "Payment not completed",
  failureDesc:
    "Your payment was declined or cancelled. Your cart is still saved — try again with a different method or contact us for help.",
  tryAgain: "Try again",

  confirmingPayment: "Confirming your payment…",
};

const pt: CheckoutStatusStrings = {
  metaSuccess: "Obrigado pela sua compra · iLingue Relax",
  metaPending: "Pagamento pendente · iLingue Relax",
  metaFailure: "Pagamento não concluído · iLingue Relax",
  metaReturn: "Processando pagamento · iLingue Relax",

  orderConfirmed: "Pedido confirmado",
  orderNumber: "Pedido",
  thanks: (name) => `Obrigado${name ? `, ${name}` : ""}!`,
  successIntro: (email) =>
    email
      ? `Seu pedido está confirmado. Enviamos um e-mail de confirmação para ${email} com seus links de download e recibo.`
      : "Seu pedido está confirmado. Enviamos um e-mail com seus links de download e recibo.",
  whatsNext: "Próximos passos",
  checkInbox: "Verifique seu e-mail",
  checkInboxDesc: "Os links chegam em 1-5 minutos. Verifique o spam se não aparecer.",
  accessProduct: "Acesse seu produto",
  accessProductDesc: "Siga o link do e-mail para desbloquear seus materiais.",
  needHelp: "Precisa de ajuda?",
  messageUsOn: "Fale conosco pelo",
  orderSummary: "Resumo do pedido",
  qty: "Qtd.",
  subtotal: "Subtotal",
  discount: "Desconto",
  totalPaid: "Total pago",
  paymentReference: "Referência do pagamento",
  paymentId: "ID",
  paymentStatus: "Status",
  paymentRef: "Ref",
  continueShopping: "Continuar comprando",
  contactSupport: "Contatar suporte",
  shippingEligibility: "Elegibilidade de envio confirmada",
  shippingEligibilityDesc: "Seu pedido é elegível para envio internacional para Peru, Colômbia, México, Argentina e mais.",
  paymentMethodConfirmed: "Método de pagamento confirmado",
  digitalDeliveredFirst: "Material digital enviado (imediato)",
  physicalInProgress: "Envio físico em preparação",
  trackingComingSoon: "O código de rastreamento será enviado em breve",


  paymentPending: "Pagamento pendente",
  pendingDesc:
    "Seu pagamento está sendo processado (PagoEfectivo, transferência ou outro método offline). Avisaremos por e-mail assim que for confirmado — normalmente em 1 a 24 horas.",
  confirmationEmail: "E-mail de confirmação",
  confirmationEmailDesc: "Você receberá seu link de download automaticamente após a confirmação.",
  fasterReceipt: "Mais rápido? Envie o comprovante",
  fasterReceiptDesc: "Fale conosco pelo",
  backHome: "Voltar ao início",
  whatsappSupport: "Suporte por WhatsApp",

  paymentNotCompleted: "Pagamento não concluído",
  failureDesc:
    "Seu pagamento foi recusado ou cancelado. Seu carrinho continua salvo — tente outro método ou fale conosco.",
  tryAgain: "Tentar novamente",

  confirmingPayment: "Confirmando seu pagamento…",
};

const fr: CheckoutStatusStrings = {
  metaSuccess: "Merci pour votre achat · iLingue Relax",
  metaPending: "Paiement en attente · iLingue Relax",
  metaFailure: "Paiement non complété · iLingue Relax",
  metaReturn: "Traitement du paiement · iLingue Relax",

  orderConfirmed: "Commande confirmée",
  orderNumber: "Commande",
  thanks: (name) => `Merci${name ? `, ${name}` : ""} !`,
  successIntro: (email) =>
    email
      ? `Votre commande est confirmée. Nous avons envoyé un e-mail de confirmation à ${email} avec vos liens de téléchargement et le reçu.`
      : "Votre commande est confirmée. Nous avons envoyé un e-mail avec vos liens de téléchargement et le reçu.",
  whatsNext: "Étapes suivantes",
  checkInbox: "Vérifiez votre boîte mail",
  checkInboxDesc: "Les liens arrivent en 1-5 minutes. Vérifiez les spams si vous ne les voyez pas.",
  accessProduct: "Accédez à votre produit",
  accessProductDesc: "Suivez le lien de l'e-mail pour débloquer vos supports.",
  needHelp: "Besoin d'aide ?",
  messageUsOn: "Écrivez-nous sur",
  orderSummary: "Récapitulatif de la commande",
  qty: "Qté",
  subtotal: "Sous-total",
  discount: "Remise",
  totalPaid: "Total payé",
  paymentReference: "Référence de paiement",
  paymentId: "ID",
  paymentStatus: "Statut",
  paymentRef: "Réf",
  continueShopping: "Continuer les achats",
  contactSupport: "Contacter le support",
  shippingEligibility: "Éligibilité à la livraison confirmée",
  shippingEligibilityDesc: "Votre commande est éligible à la livraison internationale vers le Pérou, la Colombie, le Mexique, l'Argentine et plus.",
  paymentMethodConfirmed: "Mode de paiement confirmé",

  paymentPending: "Paiement en attente",
  pendingDesc:
    "Votre paiement est en cours de traitement (PagoEfectivo, virement ou autre méthode hors ligne). Nous vous enverrons un e-mail dès qu'il sera confirmé — généralement sous 1 à 24 heures.",
  confirmationEmail: "E-mail de confirmation",
  confirmationEmailDesc: "Vous recevrez votre lien de téléchargement automatiquement après la confirmation.",
  fasterReceipt: "Plus rapide ? Envoyez-nous le reçu",
  fasterReceiptDesc: "Écrivez-nous sur",
  backHome: "Retour à l'accueil",
  whatsappSupport: "Support WhatsApp",

  paymentNotCompleted: "Paiement non complété",
  failureDesc:
    "Votre paiement a été refusé ou annulé. Votre panier est toujours enregistré — essayez avec une autre méthode ou contactez-nous.",
  tryAgain: "Réessayer",

  confirmingPayment: "Confirmation de votre paiement…",
};

const DICT: Record<string, CheckoutStatusStrings> = { es, en, pt, fr };

export function getCheckoutStrings(lang: Language): CheckoutStatusStrings {
  return DICT[lang] || es;
}
