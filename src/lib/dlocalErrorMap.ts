// Mensajes claros y localizados para los estados/errores de dLocal Go.
// dLocal muestra en su propia página un genérico "la transacción no pudo ser
// aprobada, contacte al vendedor". Cuando el comprador vuelve a nuestro sitio
// traducimos ese estado a un mensaje entendible + pasos concretos, para no
// dejarlo en una pantalla de error sin salida.

export type Lang = "es" | "en" | "pt" | "fr";

export type DlocalCode =
  | "dlocal_rejected"
  | "dlocal_cancelled"
  | "dlocal_expired"
  | "dlocal_pending"
  | "dlocal_unknown"
  | "dlocal_create_failed"
  | "dlocal_downtime";

export interface MappedDlocalStatus {
  code: DlocalCode;
  title: string;
  message: string;
  instructions: string[];
  retryable: boolean;
  /** pending → tono ámbar; rejected → tono rojo */
  tone: "pending" | "error";
}

const DICT: Record<DlocalCode, Record<Lang, { title: string; message: string; instructions: string[] }>> = {
  dlocal_rejected: {
    es: {
      title: "El banco no aprobó el pago",
      message:
        "Tu pedido sigue reservado: no se cobró nada. El procesador (dLocal) rechazó la transacción, normalmente por límites del banco, datos del titular o fondos insuficientes.",
      instructions: [
        "Vuelve al checkout y elige otro método de pago (transferencia, efectivo o billetera digital).",
        "Si usaste tarjeta, prueba con otra o habilita compras por internet en tu banco.",
        "¿Prefieres ayuda? Escríbenos por WhatsApp con tu número de pedido y te enviamos un enlace directo.",
      ],
    },
    en: {
      title: "Your bank didn't approve the payment",
      message:
        "Your order is still reserved and you were not charged. The processor (dLocal) declined the transaction, usually due to bank limits, cardholder data or insufficient funds.",
      instructions: [
        "Go back to checkout and pick another payment method (transfer, cash or digital wallet).",
        "If you used a card, try a different one or enable online purchases with your bank.",
        "Need help? Message us on WhatsApp with your order number and we'll send a direct link.",
      ],
    },
    pt: {
      title: "O banco não aprovou o pagamento",
      message:
        "Seu pedido continua reservado e nada foi cobrado. O processador (dLocal) recusou a transação, normalmente por limites do banco, dados do titular ou saldo insuficiente.",
      instructions: [
        "Volte ao checkout e escolha outro meio de pagamento (transferência, dinheiro ou carteira digital).",
        "Se usou cartão, tente outro ou libere compras online no seu banco.",
        "Precisa de ajuda? Fale no WhatsApp com o número do pedido e enviamos um link direto.",
      ],
    },
    fr: {
      title: "La banque n'a pas approuvé le paiement",
      message:
        "Ta commande est toujours réservée et rien n'a été débité. Le processeur (dLocal) a refusé la transaction (limites bancaires, données du titulaire ou fonds insuffisants).",
      instructions: [
        "Retourne au paiement et choisis un autre moyen (virement, espèces ou portefeuille).",
        "Si tu as utilisé une carte, essaie-en une autre ou autorise les achats en ligne.",
        "Besoin d'aide ? Écris-nous sur WhatsApp avec ton numéro de commande.",
      ],
    },
  },
  dlocal_cancelled: {
    es: {
      title: "Cancelaste el pago",
      message: "No se realizó ningún cobro y tu carrito sigue guardado. Puedes retomar la compra cuando quieras.",
      instructions: ["Vuelve al checkout y termina tu compra con el mismo método u otro."],
    },
    en: {
      title: "You cancelled the payment",
      message: "Nothing was charged and your cart is still saved. You can finish whenever you want.",
      instructions: ["Go back to checkout and complete your purchase with the same or another method."],
    },
    pt: {
      title: "Você cancelou o pagamento",
      message: "Nada foi cobrado e seu carrinho continua salvo. Você pode concluir quando quiser.",
      instructions: ["Volte ao checkout e conclua a compra com o mesmo meio ou outro."],
    },
    fr: {
      title: "Tu as annulé le paiement",
      message: "Rien n'a été débité et ton panier est conservé. Tu peux finaliser quand tu veux.",
      instructions: ["Retourne au paiement et termine ta commande."],
    },
  },
  dlocal_expired: {
    es: {
      title: "El cupón de pago expiró",
      message: "El plazo del cupón/QR terminó y no se registró el pago. Puedes generar uno nuevo en segundos.",
      instructions: ["Vuelve al checkout y genera un nuevo cupón o elige otro método."],
    },
    en: {
      title: "The payment voucher expired",
      message: "The voucher/QR expired and no payment was registered. You can generate a new one in seconds.",
      instructions: ["Go back to checkout to generate a new voucher or pick another method."],
    },
    pt: {
      title: "O boleto/cupom expirou",
      message: "O prazo terminou e nenhum pagamento foi registrado. Você pode gerar outro em segundos.",
      instructions: ["Volte ao checkout para gerar um novo cupom ou escolher outro meio."],
    },
    fr: {
      title: "Le coupon de paiement a expiré",
      message: "Le délai est dépassé et aucun paiement n'a été enregistré.",
      instructions: ["Retourne au paiement pour générer un nouveau coupon."],
    },
  },
  dlocal_pending: {
    es: {
      title: "Estamos confirmando tu pago",
      message:
        "El pago quedó en proceso. Apenas el banco lo confirme te enviamos el acceso por correo automáticamente (suele tardar de unos minutos a unas horas).",
      instructions: [
        "No repitas el pago: podrías pagar dos veces.",
        "Revisa el estado en cualquier momento en “Mi pedido”.",
        "Si pagaste en efectivo, la confirmación llega tras acreditarse en el punto de pago.",
      ],
    },
    en: {
      title: "We're confirming your payment",
      message:
        "The payment is being processed. As soon as the bank confirms it we'll email your access automatically (minutes to a few hours).",
      instructions: [
        "Don't pay again — you could be charged twice.",
        "Check the status anytime in \"My order\".",
        "Cash payments confirm once the payment point reports it.",
      ],
    },
    pt: {
      title: "Estamos confirmando seu pagamento",
      message:
        "O pagamento está em processamento. Assim que o banco confirmar, enviamos o acesso por e-mail automaticamente.",
      instructions: [
        "Não pague de novo — pode ser cobrado duas vezes.",
        "Acompanhe o status em \"Meu pedido\".",
      ],
    },
    fr: {
      title: "Nous confirmons ton paiement",
      message: "Le paiement est en cours. Dès la confirmation de la banque, l'accès t'est envoyé par e-mail.",
      instructions: ["Ne paie pas une seconde fois.", "Suis l'état dans « Ma commande »."],
    },
  },
  dlocal_unknown: {
    es: {
      title: "No pudimos confirmar el estado del pago",
      message:
        "La operación quedó registrada pero aún no tenemos respuesta del procesador. No vuelvas a pagar: verifica el estado de tu pedido.",
      instructions: ["Consulta “Mi pedido” con tu número y correo.", "Si en 30 minutos sigue igual, escríbenos por WhatsApp."],
    },
    en: {
      title: "We couldn't confirm the payment status",
      message: "The operation was recorded but the processor hasn't answered yet. Don't pay again — check your order status.",
      instructions: ["Open \"My order\" with your order number and email.", "If it stays the same after 30 minutes, message us."],
    },
    pt: {
      title: "Não conseguimos confirmar o status",
      message: "A operação foi registrada, mas o processador ainda não respondeu. Não pague de novo.",
      instructions: ["Consulte \"Meu pedido\" com número e e-mail.", "Se continuar assim em 30 minutos, fale conosco."],
    },
    fr: {
      title: "Statut du paiement non confirmé",
      message: "L'opération est enregistrée mais le processeur n'a pas répondu. Ne paie pas à nouveau.",
      instructions: ["Consulte « Ma commande ».", "Si rien ne change sous 30 minutes, écris-nous."],
    },
  },
  dlocal_create_failed: {
    es: {
      title: "No pudimos abrir el pago",
      message: "El procesador no aceptó iniciar la transacción. Tu carrito sigue intacto: elige otro método y sigue en un clic.",
      instructions: ["Prueba con otro método de pago disponible para tu país.", "Si todos fallan, escríbenos por WhatsApp y te ayudamos."],
    },
    en: {
      title: "We couldn't open the payment",
      message: "The processor refused to start the transaction. Your cart is intact — pick another method and continue in one click.",
      instructions: ["Try another payment method available in your country.", "If all fail, message us on WhatsApp."],
    },
    pt: {
      title: "Não conseguimos abrir o pagamento",
      message: "O processador recusou iniciar a transação. Seu carrinho está intacto — escolha outro meio.",
      instructions: ["Tente outro meio de pagamento do seu país.", "Se todos falharem, fale conosco no WhatsApp."],
    },
    fr: {
      title: "Impossible d'ouvrir le paiement",
      message: "Le processeur a refusé de démarrer la transaction. Ton panier est intact.",
      instructions: ["Essaie un autre moyen de paiement.", "Si tout échoue, écris-nous sur WhatsApp."],
    },
  },
  dlocal_downtime: {
    es: {
      title: "El servicio de dLocal no está disponible",
      message: "Estamos experimentando dificultades técnicas temporales con el procesador de pagos (dLocal). Tu pedido está seguro.",
      instructions: ["Intenta de nuevo en unos minutos.", "Si te urge, elige otro método de pago (Mercado Pago, PayPal, Binance).", "Contáctanos por WhatsApp si necesitas un enlace de pago alternativo."],
    },
    en: {
      title: "dLocal service is unavailable",
      message: "We are experiencing temporary technical difficulties with the payment processor (dLocal). Your order is safe.",
      instructions: ["Please try again in a few minutes.", "If you're in a hurry, choose another payment method.", "Contact us on WhatsApp for an alternative payment link."],
    },
    pt: {
      title: "Serviço dLocal indisponível",
      message: "Estamos com dificuldades técnicas temporárias com o processador de pagamentos (dLocal). Seu pedido está seguro.",
      instructions: ["Tente novamente em alguns minutos.", "Se tiver pressa, escolha outro meio de pagamento.", "Fale conosco no WhatsApp para um link alternativo."],
    },
    fr: {
      title: "Service dLocal indisponible",
      message: "Nous rencontrons des difficultés techniques temporaires avec le processeur de paiement (dLocal).",
      instructions: ["Réessaie dans quelques minutes.", "Choisis un autre mode de paiement si nécessaire.", "Contacte-nous sur WhatsApp pour un lien alternatif."],
    },
  },
};

const CODES = Object.keys(DICT) as DlocalCode[];

export function isDlocalCode(v: string | null | undefined): v is DlocalCode {
  return !!v && (CODES as string[]).includes(v);
}

/** Convierte el estado crudo de dLocal (PAID/REJECTED/EXPIRED…) en un código nuestro. */
export function dlocalCodeFromStatus(status?: string | null, rawStatus?: string | null): DlocalCode {
  const raw = (rawStatus ?? "").toUpperCase();
  if (raw === "CANCELLED" || raw === "CANCELED") return "dlocal_cancelled";
  if (raw === "EXPIRED") return "dlocal_expired";
  switch (status) {
    case "rejected": return "dlocal_rejected";
    case "pending": return "dlocal_pending";
    case "unknown": return "dlocal_unknown";
    default: return "dlocal_unknown";
  }
}

export function mapDlocalStatus(code: DlocalCode, lang: string): MappedDlocalStatus {
  const l = (["es", "en", "pt", "fr"].includes(lang) ? lang : "es") as Lang;
  const entry = DICT[code][l];
  return {
    code,
    title: entry.title,
    message: entry.message,
    instructions: entry.instructions,
    retryable: code !== "dlocal_pending",
    tone: code === "dlocal_pending" || code === "dlocal_unknown" ? "pending" : "error",
  };
}
