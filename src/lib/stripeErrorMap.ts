// Mapeo de errores comunes de Stripe / red / sesión a mensajes claros
// localizados. Se usa en el checkout embebido cuando la creación de la
// sesión falla o cuando el iframe no logra abrirse — los errores de
// tarjeta (declinada, 3DS, CVC) los muestra el propio iframe de Stripe
// ya localizados por Stripe.

export type Lang = "es" | "en" | "pt" | "fr";

export interface MappedStripeError {
  title: string;
  message: string;
  code:
    | "network"
    | "timeout"
    | "auth"
    | "rate_limit"
    | "invalid_request"
    | "currency_restricted"
    | "card_declined"
    | "insufficient_funds"
    | "incorrect_cvc"
    | "expired_card"
    | "processing"
    | "3ds_required"
    | "3ds_failed"
    | "3ds_canceled"
    | "3ds_unsupported"
    | "coupon"
    | "amount"
    | "config"
    | "unknown";
  retryable: boolean;
  instructions?: string[];
}

const DICT: Record<
  MappedStripeError["code"],
  Record<Lang, { title: string; message: string }>
> = {
  network: {
    es: { title: "Sin conexión", message: "Conexión inestable detectada. Por favor verifica tu red o intenta de nuevo." },
    en: { title: "Connection error", message: "Unstable connection detected. Please check your network or try again." },
    pt: { title: "Sem conexão", message: "Conexão instável detectada. Por favor, verifique sua rede ou tente novamente." },
    fr: { title: "Pas de connexion", message: "Connexion instable détectée. Veuillez vérifier votre réseau ou réessayer." },
  },
  timeout: {
    es: { title: "Tiempo agotado", message: "Stripe está tardando demasiado en responder. Intenta de nuevo." },
    en: { title: "Request timeout", message: "Stripe is taking too long. Please try again." },
    pt: { title: "Tempo esgotado", message: "A Stripe está demorando demais. Tente novamente." },
    fr: { title: "Délai dépassé", message: "Stripe met trop de temps à répondre. Réessaie." },
  },
  auth: {
    es: { title: "Sesión de pago inválida", message: "No pudimos abrir el formulario seguro. Vuelve a intentarlo." },
    en: { title: "Invalid payment session", message: "We couldn't open the secure form. Please retry." },
    pt: { title: "Sessão de pagamento inválida", message: "Não conseguimos abrir o formulário seguro. Tente novamente." },
    fr: { title: "Session de paiement invalide", message: "Impossible d’ouvrir le formulaire sécurisé. Réessaie." },
  },
  rate_limit: {
    es: { title: "Demasiados intentos", message: "Espera unos segundos y vuelve a intentar." },
    en: { title: "Too many attempts", message: "Please wait a few seconds and try again." },
    pt: { title: "Muitas tentativas", message: "Aguarde alguns segundos e tente novamente." },
    fr: { title: "Trop de tentatives", message: "Attends quelques secondes et réessaie." },
  },
  invalid_request: {
    es: { title: "Datos incorrectos", message: "Revisa tus datos e intenta de nuevo. Si persiste, escríbenos por WhatsApp." },
    en: { title: "Invalid data", message: "Please review your details and try again. Contact us on WhatsApp if it persists." },
    pt: { title: "Dados incorretos", message: "Revise seus dados e tente novamente. Fale conosco no WhatsApp se persistir." },
    fr: { title: "Données invalides", message: "Vérifie tes informations et réessaie. Contacte-nous sur WhatsApp si le problème persiste." },
  },
  currency_restricted: {
    es: { title: "Moneda no compatible", message: "Tu banco no permite pagos en moneda local. Intentaremos procesar el pago en USD para mayor seguridad." },
    en: { title: "Currency not supported", message: "Your bank doesn't allow payments in local currency. We'll try processing in USD for better reliability." },
    pt: { title: "Moeda não suportada", message: "Seu banco não permite pagamentos em moeda local. Tentaremos processar em USD para mayor seguridad." },
    fr: { title: "Devise non supportée", message: "Votre banque n'autorise pas les paiements en devise locale. Nous allons essayer de traiter en USD." },
  },
  card_declined: {
    es: { title: "Tarjeta rechazada", message: "Tu banco rechazó el pago. Prueba con otra tarjeta o PayPal." },
    en: { title: "Card declined", message: "Your bank declined the payment. Try another card or PayPal." },
    pt: { title: "Cartão recusado", message: "Seu banco recusou o pagamento. Tente outro cartão ou PayPal." },
    fr: { title: "Carte refusée", message: "Ta banque a refusé le paiement. Essaie une autre carte ou PayPal." },
  },
  insufficient_funds: {
    es: { title: "Fondos insuficientes", message: "La tarjeta no tiene saldo suficiente. Prueba con otra." },
    en: { title: "Insufficient funds", message: "Not enough balance on this card. Try another one." },
    pt: { title: "Saldo insuficiente", message: "O cartão não tem saldo suficiente. Tente outro." },
    fr: { title: "Fonds insuffisants", message: "Solde insuffisant sur cette carte. Essaie-en une autre." },
  },
  incorrect_cvc: {
    es: { title: "CVC incorrecto", message: "El código de seguridad no es correcto. Revísalo e intenta de nuevo." },
    en: { title: "Incorrect CVC", message: "The security code is wrong. Please check and retry." },
    pt: { title: "CVC incorreto", message: "O código de segurança está errado. Verifique e tente novamente." },
    fr: { title: "CVC incorrect", message: "Le code de sécurité est incorrect. Vérifie et réessaie." },
  },
  expired_card: {
    es: { title: "Tarjeta vencida", message: "La tarjeta expiró. Usa otra tarjeta o PayPal." },
    en: { title: "Expired card", message: "This card has expired. Use another card or PayPal." },
    pt: { title: "Cartão vencido", message: "O cartão expirou. Use outro cartão ou PayPal." },
    fr: { title: "Carte expirée", message: "Cette carte a expiré. Utilise une autre carte ou PayPal." },
  },
  processing: {
    es: { title: "Error al procesar", message: "Ocurrió un error al procesar la tarjeta. Intenta de nuevo." },
    en: { title: "Processing error", message: "There was an error processing the card. Please try again." },
    pt: { title: "Erro no processamento", message: "Ocorreu um erro ao processar o cartão. Tente novamente." },
    fr: { title: "Erreur de traitement", message: "Erreur lors du traitement de la carte. Réessaie." },
  },
  "3ds_required": {
    es: { title: "Verificación 3D Secure requerida", message: "Tu banco requiere confirmar el pago. Completa el paso de verificación (SMS, app o clave) y vuelve a intentar." },
    en: { title: "3D Secure verification required", message: "Your bank needs to confirm the payment. Complete the verification step (SMS, app or code) and try again." },
    pt: { title: "Verificação 3D Secure necessária", message: "Seu banco precisa confirmar o pagamento. Complete a verificação (SMS, app ou código) e tente novamente." },
    fr: { title: "Vérification 3D Secure requise", message: "Ta banque doit confirmer le paiement. Complète la vérification (SMS, appli ou code) et réessaie." },
  },
  "3ds_failed": {
    es: { title: "Verificación 3D Secure fallida", message: "No se completó la verificación con tu banco. Intenta de nuevo o usa otra tarjeta." },
    en: { title: "3D Secure verification failed", message: "The bank verification wasn't completed. Try again or use another card." },
    pt: { title: "Falha na verificação 3D Secure", message: "A verificação do banco não foi concluída. Tente novamente ou use outro cartão." },
    fr: { title: "Échec de la vérification 3D Secure", message: "La vérification bancaire n’a pas abouti. Réessaie ou utilise une autre carte." },
  },
  "3ds_canceled": {
    es: { title: "Verificación cancelada", message: "Cancelaste la verificación 3D Secure. Vuelve a intentar y completa el paso con tu banco." },
    en: { title: "Verification canceled", message: "You canceled the 3D Secure step. Try again and complete the bank verification." },
    pt: { title: "Verificação cancelada", message: "Você cancelou a verificação 3D Secure. Tente novamente e conclua a etapa com o banco." },
    fr: { title: "Vérification annulée", message: "Tu as annulé l’étape 3D Secure. Réessaie et complète la vérification bancaire." },
  },
  "3ds_unsupported": {
    es: { title: "Tarjeta no compatible con 3D Secure", message: "Tu tarjeta no admite la verificación requerida. Prueba con otra tarjeta o paga con PayPal." },
    en: { title: "Card doesn't support 3D Secure", message: "Your card doesn't support the required verification. Try another card or pay with PayPal." },
    pt: { title: "Cartão sem suporte a 3D Secure", message: "Seu cartão não suporta a verificação necessária. Use outro cartão ou pague com PayPal." },
    fr: { title: "Carte non compatible 3D Secure", message: "Ta carte ne prend pas en charge la vérification requise. Utilise une autre carte ou paie via PayPal." },
  },
  coupon: {
    es: { title: "Cupón no válido", message: "El cupón aplicado no es válido o expiró. Quítalo e intenta de nuevo." },
    en: { title: "Invalid coupon", message: "The coupon isn't valid or has expired. Remove it and try again." },
    pt: { title: "Cupom inválido", message: "O cupom não é válido ou expirou. Remova-o e tente novamente." },
    fr: { title: "Coupon invalide", message: "Le coupon n’est pas valide ou a expiré. Retire-le et réessaie." },
  },
  amount: {
    es: { title: "Monto inválido", message: "El monto del pedido no es válido. Recarga la página." },
    en: { title: "Invalid amount", message: "The order amount is invalid. Please reload the page." },
    pt: { title: "Valor inválido", message: "O valor do pedido é inválido. Recarregue a página." },
    fr: { title: "Montant invalide", message: "Le montant de la commande est invalide. Recharge la page." },
  },
  config: {
    es: { title: "Pago no disponible", message: "Los pagos con tarjeta no están disponibles ahora. Escríbenos por WhatsApp." },
    en: { title: "Payments unavailable", message: "Card payments are not available right now. Contact us on WhatsApp." },
    pt: { title: "Pagamentos indisponíveis", message: "Pagamentos com cartão indisponíveis. Fale conosco no WhatsApp." },
    fr: { title: "Paiements indisponibles", message: "Les paiements par carte sont indisponibles. Contacte-nous sur WhatsApp." },
  },
  unknown: {
    es: { title: "No pudimos abrir el pago", message: "Ocurrió un problema con Stripe. Intenta de nuevo o escríbenos por WhatsApp." },
    en: { title: "We couldn't open payment", message: "Something went wrong with Stripe. Try again or contact us on WhatsApp." },
    pt: { title: "Não foi possível abrir o pagamento", message: "Algo deu errado com a Stripe. Tente novamente ou fale conosco no WhatsApp." },
    fr: { title: "Impossible d’ouvrir le paiement", message: "Un problème est survenu avec Stripe. Réessaie ou contacte-nous sur WhatsApp." },
  },
};

const NON_RETRYABLE = new Set<MappedStripeError["code"]>(["config", "amount", "coupon", "3ds_unsupported"]);

const INSTRUCTIONS: Partial<Record<MappedStripeError["code"], Record<Lang, string[]>>> = {
  "3ds_required": {
    es: [
      "Revisa tu app bancaria o SMS por un código de verificación.",
      "Ingresa el código o aprueba el pago desde la app.",
      "Vuelve aquí y presiona “Intentar de nuevo”.",
    ],
    en: [
      "Check your bank app or SMS for a verification code.",
      "Enter the code or approve the payment in the app.",
      "Come back here and press “Try again”.",
    ],
    pt: [
      "Verifique o app do seu banco ou SMS por um código.",
      "Digite o código ou aprove o pagamento no app.",
      "Volte aqui e clique em “Tentar novamente”.",
    ],
    fr: [
      "Vérifie l’appli de ta banque ou tes SMS pour un code.",
      "Entre le code ou approuve le paiement dans l’appli.",
      "Reviens ici et clique sur « Réessayer ».",
    ],
  },
  "3ds_failed": {
    es: ["Asegúrate de tener señal e internet estable.", "Si el problema persiste, prueba otra tarjeta o PayPal."],
    en: ["Make sure you have stable signal and internet.", "If it persists, try another card or PayPal."],
    pt: ["Verifique se tem sinal e internet estáveis.", "Se persistir, tente outro cartão ou PayPal."],
    fr: ["Assure-toi d’avoir du signal et un internet stable.", "Si le problème persiste, essaie une autre carte ou PayPal."],
  },
};

export function mapStripeError(err: unknown, lang: Lang = "es"): MappedStripeError {
  const raw = normalize(err);
  const code = detect(raw);
  const dict = DICT[code][lang] ?? DICT[code].es;
  const instr = INSTRUCTIONS[code]?.[lang] ?? INSTRUCTIONS[code]?.es;
  return {
    code,
    title: dict.title,
    message: dict.message,
    retryable: !NON_RETRYABLE.has(code),
    instructions: instr,
  };
}

function normalize(err: unknown): string {
  if (!err) return "";
  if (typeof err === "string") return err.toLowerCase();
  if (err instanceof Error) return err.message.toLowerCase();
  try {
    const anyErr = err as { code?: string; message?: string; type?: string; decline_code?: string };
    return [anyErr.code, anyErr.type, anyErr.decline_code, anyErr.message]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  } catch {
    return "";
  }
}

function detect(s: string): MappedStripeError["code"] {
  if (!s) return "unknown";
  if (/failed to fetch|networkerror|network error|offline|net::err/.test(s)) return "network";
  if (/timeout|timed out|took too long|tardando/.test(s)) return "timeout";
  if (/rate.?limit|too many requests/.test(s)) return "rate_limit";
  if (/incorrect_cvc|invalid_cvc|cvc/.test(s)) return "incorrect_cvc";
  if (/expired_card|card.*expired|expired/.test(s)) return "expired_card";
  if (/insufficient_funds|insufficient/.test(s)) return "insufficient_funds";
  // 3D Secure — more specific states first
  if (/three_d_secure_not_supported|3ds.*not.*support|not.*support.*3d/.test(s)) return "3ds_unsupported";
  if (/three_d_secure_canceled|3ds.*cancel|authentication.*cancel|user.*cancel.*auth/.test(s)) return "3ds_canceled";
  if (/three_d_secure_failed|3ds.*fail|authentication.*fail|auth.*fail|payment_intent_authentication_failure/.test(s)) return "3ds_failed";
  if (/requires_action|authentication_required|three.?d.?secure|3ds|3d.?secure|redirect_status=failed/.test(s)) return "3ds_required";
  if (/card_declined|declined|do_not_honor/.test(s)) return "card_declined";
  if (/processing_error|processing/.test(s)) return "processing";
  if (/coupon|promotion|discount/.test(s)) return "coupon";
  if (/amount|minimum|maximum|below|above/.test(s)) return "amount";
  if (/api.?key|authentication|unauthorized|401|403/.test(s)) return "auth";
  if (/invalid_request|invalid request|missing|parameter|400|payment_method_types/.test(s)) return "invalid_request";
  if (/currency|adaptive pricing|not supported in this country/.test(s)) return "currency_restricted";
  if (/not configured|no.*configured|misconfigured|503|502|gateway_error/.test(s)) return "config";
  return "unknown";
}

