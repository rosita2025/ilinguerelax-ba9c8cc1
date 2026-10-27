import { useCheckoutPruebaStore } from "@/stores/checkoutStore";

/**
 * Soporte por WhatsApp. UN solo número para todo el sitio (antes algunas páginas tenían
 * un "1" de más: "112512724704", que no es un número válido).
 */
export const SUPPORT_WHATSAPP_NUMBER = "12512724704";

const REF_KEY = "ilr_order_ref";

/**
 * Referencia corta del pedido (ej. PED-7K3QX2). Se genera una vez por visita al checkout y se envía
 * a Stripe (descripción y metadatos) y en el mensaje de WhatsApp: así el pago se encuentra al instante.
 */
export function getOrderRef(): string {
  try {
    const saved = sessionStorage.getItem(REF_KEY);
    if (saved) return saved;
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    const ref = `PED-${code}`;
    sessionStorage.setItem(REF_KEY, ref);
    return ref;
  } catch {
    return "PED-SIN-REF";
  }
}

type Lang = "es" | "en" | "fr" | "pt" | "it";

export type SupportReason = "problem" | "error" | "other" | "question";

const T: Record<Lang, {
  reasons: Record<SupportReason, string>;
  order: string; name: string; email: string; product: string; upsell: string; noUpsell: string;
  amount: string; country: string; method: string; error: string; link: string; noOrder: string;
}> = {
  es: { reasons: { problem: "Hola, tengo un problema de pago.", error: "Hola, me salió un error de pago.", other: "Hola, quiero pagar con otro método de pago.", question: "Hola, tengo una duda antes de pagar." }, order: "Pedido", name: "Nombre", email: "Correo", product: "Producto", upsell: "Upsell", noUpsell: "Sin upsell", amount: "Precio", country: "País", method: "Método", error: "Error", link: "Link de checkout", noOrder: "Aún sin pedido" },
  en: { reasons: { problem: "Hi, I have a payment problem.", error: "Hi, I got a payment error.", other: "Hi, I'd like to pay with another payment method.", question: "Hi, I have a question before paying." }, order: "Order", name: "Name", email: "Email", product: "Product", upsell: "Upsell", noUpsell: "No upsell", amount: "Price", country: "Country", method: "Method", error: "Error", link: "Checkout link", noOrder: "No order yet" },
  fr: { reasons: { problem: "Bonjour, j'ai un problème de paiement.", error: "Bonjour, j'ai eu une erreur de paiement.", other: "Bonjour, je voudrais payer avec un autre moyen de paiement.", question: "Bonjour, j'ai une question avant de payer." }, order: "Commande", name: "Nom", email: "E-mail", product: "Produit", upsell: "Upsell", noUpsell: "Sans upsell", amount: "Prix", country: "Pays", method: "Méthode", error: "Erreur", link: "Lien du checkout", noOrder: "Pas encore de commande" },
  pt: { reasons: { problem: "Olá, estou com um problema de pagamento.", error: "Olá, deu erro no pagamento.", other: "Olá, quero pagar com outro método de pagamento.", question: "Olá, tenho uma dúvida antes de pagar." }, order: "Pedido", name: "Nome", email: "E-mail", product: "Produto", upsell: "Upsell", noUpsell: "Sem upsell", amount: "Preço", country: "País", method: "Método", error: "Erro", link: "Link do checkout", noOrder: "Ainda sem pedido" },
  it: { reasons: { problem: "Ciao, ho un problema di pagamento.", error: "Ciao, ho avuto un errore di pagamento.", other: "Ciao, vorrei pagare con un altro metodo di pagamento.", question: "Ciao, ho un dubbio prima di pagare." }, order: "Ordine", name: "Nome", email: "Email", product: "Prodotto", upsell: "Upsell", noUpsell: "Senza upsell", amount: "Prezzo", country: "Paese", method: "Metodo", error: "Errore", link: "Link del checkout", noOrder: "Ancora nessun ordine" },
};

export type SupportContext = {
  language?: string;
  country?: string;
  method?: string;
  amountLabel?: string;
  error?: string;
  reason?: SupportReason;
};

/**
 * Enlace de WhatsApp con el mensaje ya escrito.
 * - Si el cliente ya llenó nombre y correo: va el pedido (#PED-…), nombre, correo, producto, upsell (o "sin upsell"),
 *   precio, país, método, el error (si hubo) y el link del checkout para retomar el pago.
 * - Si no llenó nada: solo producto, link del checkout y el motivo (sin pedido ni datos personales).
 */
export function buildSupportUrl(ctx: SupportContext = {}): string {
  const lang = (["es", "en", "fr", "pt", "it"].includes(ctx.language ?? "") ? ctx.language : "es") as Lang;
  const t = T[lang];
  let product = "";
  let upsells: string[] = [];
  let name = "";
  let email = "";
  try {
    const st = useCheckoutPruebaStore.getState();
    product = st.items[0]?.name ?? "";
    upsells = st.items.slice(1).map((i) => i.name);
    name = (st.buyer.fullName || "").trim();
    email = (st.buyer.email || "").trim();
  } catch { /* sin carrito */ }
  const filled = name.length >= 2 && /\S+@\S+\.\S+/.test(email);
  let link = "";
  try { link = `${window.location.origin}${window.location.pathname}`; } catch { /* sin ventana */ }

  const lines: string[] = [t.reasons[ctx.reason ?? "problem"]];
  if (filled) {
    lines.push(`${t.order}: #${getOrderRef()}`, `${t.name}: ${name}`, `${t.email}: ${email}`);
  } else {
    lines.push(t.noOrder);
  }
  if (product) lines.push(`${t.product}: ${product.slice(0, 120)}`);
  if (filled) lines.push(upsells.length ? `${t.upsell}: ${upsells.join(" + ").slice(0, 160)}` : t.noUpsell);
  if (filled && ctx.amountLabel) lines.push(`${t.amount}: ${ctx.amountLabel}`);
  if (ctx.country) lines.push(`${t.country}: ${ctx.country}`);
  if (filled && ctx.method) lines.push(`${t.method}: ${ctx.method}`);
  if (ctx.error) lines.push(`${t.error}: ${ctx.error.slice(0, 160)}`);
  if (link) lines.push(`${t.link}: ${link}`);
  return `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
}

const PAID: Record<Lang, { intro: (method: string) => string; order: string; product: string; method: string; link: string; email: string }> = {
  es: { intro: (m) => `Hola, ya pagué${m ? ` con ${m}` : ""}. ¿Me ayudas a confirmar mi pedido?`, order: "Pedido", product: "Producto", method: "Método", link: "Link de pago (checkout)", email: "Correo" },
  en: { intro: (m) => `Hi, I already paid${m ? ` with ${m}` : ""}. Can you help me confirm my order?`, order: "Order", product: "Product", method: "Method", link: "Payment link (checkout)", email: "Email" },
  fr: { intro: (m) => `Bonjour, j'ai déjà payé${m ? ` avec ${m}` : ""}. Pouvez-vous confirmer ma commande ?`, order: "Commande", product: "Produit", method: "Méthode", link: "Lien de paiement (checkout)", email: "E-mail" },
  pt: { intro: (m) => `Olá, já paguei${m ? ` com ${m}` : ""}. Pode me ajudar a confirmar meu pedido?`, order: "Pedido", product: "Produto", method: "Método", link: "Link de pagamento (checkout)", email: "E-mail" },
  it: { intro: (m) => `Ciao, ho già pagato${m ? ` con ${m}` : ""}. Puoi aiutarmi a confermare il mio ordine?`, order: "Ordine", product: "Prodotto", method: "Metodo", link: "Link di pagamento (checkout)", email: "Email" },
};

/**
 * WhatsApp "ya pagué": para compradores que pagaron (PayPal u otro) y no ven su pedido o su correo.
 * Lleva el número de pedido real, el nombre del producto y el link del checkout que usó el cliente.
 */
export function buildPaidSupportUrl(opts: { language?: string; orderNumber?: string | null; method?: string; email?: string } = {}): string {
  const lang = (["es", "en", "fr", "pt", "it"].includes(opts.language ?? "") ? opts.language : "es") as Lang;
  const t = PAID[lang];
  let product = "";
  let checkoutLink = "";
  let email = (opts.email || "").trim();
  try {
    const st = useCheckoutPruebaStore.getState();
    product = st.items.map((i) => i.name).join(" + ");
    if (!email) email = (st.buyer.email || "").trim();
  } catch { /* sin carrito */ }
  try {
    // El carrito se vacía al pagar: se recupera lo que quedó guardado al iniciar el checkout.
    const raw = localStorage.getItem("ilr_last_checkout") || sessionStorage.getItem("ilr_last_checkout");
    if (raw) {
      const mem = JSON.parse(raw) as { content_name?: string | null; page_path?: string | null };
      if (!product && mem.content_name) product = String(mem.content_name);
      if (mem.page_path) checkoutLink = `${window.location.origin}${mem.page_path}`;
    }
  } catch { /* sin memoria */ }
  if (!checkoutLink) {
    try { checkoutLink = `${window.location.origin}/checkouts`; } catch { /* sin ventana */ }
  }
  const lines = [t.intro(opts.method ?? "")];
  lines.push(`${t.order}: #${opts.orderNumber || getOrderRef()}`);
  if (product) lines.push(`${t.product}: ${product.slice(0, 160)}`);
  if (email) lines.push(`${t.email}: ${email}`);
  if (checkoutLink) lines.push(`${t.link}: ${checkoutLink}`);
  return `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
}
