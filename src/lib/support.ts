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
