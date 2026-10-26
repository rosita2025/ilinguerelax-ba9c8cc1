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

const T: Record<Lang, { hello: string; order: string; product: string; email: string; country: string; method: string; error: string; amount: string; help: string }> = {
  es: { hello: "Hola, tengo un problema de pago.", order: "Pedido", product: "Producto", email: "Correo", country: "País", method: "Método", error: "Error", amount: "Monto", help: "Hola, necesito ayuda con mi pedido." },
  en: { hello: "Hi, I have a payment problem.", order: "Order", product: "Product", email: "Email", country: "Country", method: "Method", error: "Error", amount: "Amount", help: "Hi, I need help with my order." },
  fr: { hello: "Bonjour, j'ai un problème de paiement.", order: "Commande", product: "Produit", email: "E-mail", country: "Pays", method: "Méthode", error: "Erreur", amount: "Montant", help: "Bonjour, j'ai besoin d'aide pour ma commande." },
  pt: { hello: "Olá, estou com um problema de pagamento.", order: "Pedido", product: "Produto", email: "E-mail", country: "País", method: "Método", error: "Erro", amount: "Valor", help: "Olá, preciso de ajuda com meu pedido." },
  it: { hello: "Ciao, ho un problema di pagamento.", order: "Ordine", product: "Prodotto", email: "Email", country: "Paese", method: "Metodo", error: "Errore", amount: "Importo", help: "Ciao, ho bisogno di aiuto con il mio ordine." },
};

export type SupportContext = {
  language?: string;
  country?: string;
  method?: string;
  amountLabel?: string;
  error?: string;
  /** "problem" = problema de pago (incluye el error); "help" = ayuda general con el pedido. */
  kind?: "problem" | "help";
};

/** Enlace de WhatsApp con el mensaje ya escrito (pedido, producto, correo, país, monto, método y error). */
export function buildSupportUrl(ctx: SupportContext = {}): string {
  const lang = (["es", "en", "fr", "pt", "it"].includes(ctx.language ?? "") ? ctx.language : "es") as Lang;
  const t = T[lang];
  let products = "";
  let email = "";
  try {
    const s = useCheckoutPruebaStore.getState();
    products = s.items.map((i) => i.name).join(" + ").slice(0, 120);
    email = (s.buyer.email || "").trim();
  } catch { /* sin carrito */ }
  const lines = [ctx.kind === "help" ? t.help : t.hello, `${t.order}: #${getOrderRef()}`];
  if (products) lines.push(`${t.product}: ${products}`);
  if (email) lines.push(`${t.email}: ${email}`);
  if (ctx.country) lines.push(`${t.country}: ${ctx.country}`);
  if (ctx.amountLabel) lines.push(`${t.amount}: ${ctx.amountLabel}`);
  if (ctx.method) lines.push(`${t.method}: ${ctx.method}`);
  if (ctx.error) lines.push(`${t.error}: ${ctx.error.slice(0, 160)}`);
  return `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
}
