import { useEffect, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { CheckCircle2, Mail, MessageCircle, ShoppingBag, Package, Download, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCheckoutPruebaStore, calcTotals, itemPrice } from "@/stores/checkoutStore";
import { useRegionTier } from "@/hooks/useRegionTier";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n/I18nContext";
import { getCheckoutStrings } from "@/i18n/checkoutStatus";
import { useToast } from "@/hooks/use-toast";
import { trackHotmartEvent } from "@/hooks/useMetaPixel";

interface DeliveryItem {
  sku: string;
  name: string;
  cover_image_url: string | null;
  available: boolean;
  bonus_count: number;
}


export default function CheckoutSuccess() {
  const [sp] = useSearchParams();
  const paymentId = sp.get("payment_id") || sp.get("collection_id") || sp.get("session_id");
  const status = sp.get("status") || sp.get("collection_status") || "approved";
  const externalRef = sp.get("external_reference") || sp.get("preference_id");
  const paypalToken = sp.get("token") || sp.get("PayerID");
  // dLocal Go vuelve por /checkouts/return, que ya confirmó el pago contra la
  // API y redirige aquí con ?provider=dlocal&order=ILR-DL-xxx. Sin este caso el
  // comprador de dLocal caía en la pantalla "confirmación privada" y nunca veía
  // sus descargas.
  const dlocalOrder = (sp.get("provider") || "").toLowerCase() === "dlocal" ? sp.get("order") : null;
  const provider = dlocalOrder
    ? "dlocalgo"
    : sp.get("session_id")
    ? "stripe"
    : (paypalToken || sp.get("paypal_order"))
    ? "paypal"
    : sp.get("payment_id") || sp.get("collection_id")
    ? "mercadopago"
    : "unknown";


  const store = useCheckoutPruebaStore();
  const region = useRegionTier();
  // Snapshot items/buyer/totals at mount — the effect below clears the cart
  // after sending the confirmation email, and we still want the summary shown.
  const [snapshot] = useState(() => ({
    items: store.items,
    buyer: store.buyer,
    couponPercent: store.couponPercent,
    coupon: store.coupon,
  }));
  const items = snapshot.items;
  const buyer = snapshot.buyer;
  const couponPercent = snapshot.couponPercent;
  const coupon = snapshot.coupon;
  const clear = store.clear;
  const { subtotal, discount, total } = calcTotals(items, couponPercent, region.tier);
  const sentRef = useRef(false);
  const { language } = useI18n();
  const t = getCheckoutStrings(language);
  const { toast } = useToast();
  const [delivery, setDelivery] = useState<DeliveryItem[]>([]);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [deliveryLoading, setDeliveryLoading] = useState(false);


  // Build a friendly order number: ILR-<PROVIDER>-<6 chars>
  // Deterministic from the payment reference so the same payment always maps
  // to the same order number across refreshes and the confirmation email.
  const providerCode = provider === "stripe" ? "ST" : provider === "paypal" ? "PP" : provider === "mercadopago" ? "MP" : "OR";
  const rawRef = String(paymentId || externalRef || paypalToken || "").replace(/[^a-zA-Z0-9]/g, "");
  const refTail = rawRef ? rawRef.slice(-6).toUpperCase().padStart(6, "0") : Math.random().toString(36).slice(2, 8).toUpperCase();
  // Con dLocal usamos el número real del pedido (el mismo que conocen el
  // webhook y el historial), no uno derivado del navegador.
  const orderNumber = dlocalOrder ? dlocalOrder.toUpperCase() : `ILR-${providerCode}-${refTail}`;

  // Gate: only real buyers with an approved payment reference should see the
  // confirmation. A visitor without a valid reference OR without buyer info in
  // the session store is treated as public/unknown and gets a neutral screen.
  const hasPaymentRef = Boolean(paymentId || externalRef || paypalToken || sp.get("paypal_order") || dlocalOrder);
  const hasBuyerContext = Boolean(buyer.email) && items.length > 0;
  const initialVerified =
    hasPaymentRef &&
    hasBuyerContext &&
    (provider === "stripe" || provider === "paypal" || provider === "mercadopago" || provider === "dlocalgo") &&
    status !== "rejected" && status !== "failure";

  // Freeze verification at mount so clearing the cart after sending the
  // confirmation email doesn't flip the screen to "private confirmation".
  const [isVerifiedBuyer] = useState(initialVerified);

  const [resending, setResending] = useState(false);

  const idemKey = `digital:${(orderNumber || paymentId || externalRef || buyer.email || "").toLowerCase()}`;

  // La entrega digital la dispara SOLO el webhook firmado de la pasarela.
  // Desde el navegador únicamente se puede pedir un reenvío del pedido ya
  // pagado y entregado, al mismo correo registrado.
  const resendDigital = async () => {
    setResending(true);
    try {
      const { data, error } = await supabase.functions.invoke("request-digital-resend", {
        body: { orderId: orderNumber, email: buyer.email },
      });
      if (error) throw error;
      if ((data as any)?.sent === false) {
        toast({
          title: "Aún no disponible",
          description: "Estamos confirmando tu pago. Recibirás los enlaces en unos minutos.",
        });
      } else {
        toast({ title: "Email reenviado", description: `Enviado a ${buyer.email}` });
      }
    } catch (e: any) {
      toast({ title: "No se pudo reenviar", description: e?.message || "Intenta más tarde", variant: "destructive" });
    } finally {
      setResending(false);
    }
  };


  // Global Meta Pixel: fire Purchase once per order (dedupe via sessionStorage).
  // Uses trackHotmartEvent so it goes to Pixel 24959578143733255 (browser)
  // + Meta CAPI (server) + funnel_events (internal analytics).
  useEffect(() => {
    if (!isVerifiedBuyer) return;
    const key = `fbq-purchase:${orderNumber}`;
    if (sessionStorage.getItem(key)) return;
    try {
      trackHotmartEvent("Purchase", {
        value: Number(total.toFixed(2)),
        currency: "USD", // Forzado a USD para Ads
        content_ids: items.map((i) => i.id),
        content_type: "product",
        content_name: items.map((i) => i.name).join(" + "),
        num_items: items.reduce((n, i) => n + (i.quantity || 1), 0),
        order_id: orderNumber,
        email: buyer.email,
        method: provider,
      });
      sessionStorage.setItem(key, "1");
    } catch { /* ignore */ }
  }, [isVerifiedBuyer, orderNumber, total, items]);


  useEffect(() => {
    if (sentRef.current) return;
    if (!isVerifiedBuyer) return;
    const key = `order-email-sent:${paymentId || externalRef || buyer.email}`;
    if (sessionStorage.getItem(key)) {
      const t = setTimeout(() => clear(), 500);
      return () => clearTimeout(t);
    }
    sentRef.current = true;
    sessionStorage.setItem(key, "1");





    (async () => {
      // Los correos ("Gracias por tu compra" + aviso al admin) y la entrega
      // digital los envía ÚNICAMENTE el webhook firmado de la pasarela, tras
      // confirmar el pago real. Desde el navegador ya no se dispara ningún
      // correo: era un canal abierto que permitía enviar mensajes con la marca
      // del dominio a cualquier dirección, y además generaba un segundo número
      // de pedido para la misma compra.
      setTimeout(() => clear(), 1500);
    })();


    return () => {};

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Enlaces de descarga (producto + bonos + upsells). El backend sólo los
  // devuelve si el pedido tiene un pago confirmado; nunca se piden por SKU.
  useEffect(() => {
    if (!isVerifiedBuyer || !buyer.email || !orderNumber) return;
    setDeliveryLoading(true);
    supabase.functions
      .invoke("order-delivery", { body: { orderId: orderNumber, email: buyer.email } })
      .then(({ data, error }) => {
        if (error) throw error;
        setDelivery((data?.items ?? []) as DeliveryItem[]);
        setDownloadUrl((data?.downloadUrl ?? null) as string | null);
      })
      .catch((e) => console.error("order-delivery failed", e))
      .finally(() => setDeliveryLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  // Localized copy for the public / unverified screen (IP-based via useI18n)
  const publicCopy = {
    es: {
      title: "Página privada de confirmación",
      body: "Esta página muestra los detalles de un pedido reciente y solo está disponible para compradores verificados con un pago aprobado en Stripe o PayPal.",
      cta: "Ir a la tienda",
    },
    en: {
      title: "Private order confirmation",
      body: "This page shows details of a recent order and is only available to verified buyers with an approved payment in Stripe or PayPal.",
      cta: "Go to store",
    },
    fr: {
      title: "Confirmation de commande privée",
      body: "Cette page affiche les détails d'une commande récente et n'est accessible qu'aux acheteurs vérifiés avec un paiement approuvé sur Stripe ou PayPal.",
      cta: "Aller à la boutique",
    },
    pt: {
      title: "Confirmação de pedido privada",
      body: "Esta página mostra os detalhes de um pedido recente e está disponível apenas para compradores verificados com um pagamento aprovado no Stripe ou PayPal.",
      cta: "Ir para a loja",
    },
  } as const;
  const pc = (publicCopy as any)[language] || publicCopy.es;

  if (!isVerifiedBuyer) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Helmet>
          <title>{pc.title}</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <header className="border-b bg-background/95">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <Link to="/" className="text-xl font-bold tracking-tight" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
              iLingue <span className="text-primary">Relax</span>
            </Link>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="max-w-md text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
              <ShoppingBag className="w-8 h-8 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold">{pc.title}</h1>
            <p className="text-muted-foreground text-sm">{pc.body}</p>
            <Button asChild size="lg">
              <Link to="/">{pc.cta}</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{t.metaSuccess}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <header className="border-b bg-background/95">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link
            to="/"
            className="text-xl font-bold tracking-tight"
            style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
          >
            iLingue <span className="text-primary">Relax</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        {/* Hero confirmation */}
        <section className="text-center space-y-3">
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-11 h-11 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-sm text-muted-foreground uppercase tracking-wider">
            {t.orderNumber} <span className="font-mono font-semibold text-foreground">{orderNumber}</span>
          </p>
          <h1 className="text-3xl md:text-4xl font-bold">
            {t.thanks(buyer.fullName ? buyer.fullName.split(" ")[0] : undefined)}
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            {t.successIntro(buyer.email || undefined)}
          </p>
        </section>

        {/* What's next */}
        <section className="rounded-xl border bg-card p-5 space-y-4">
          <h2 className="font-semibold text-base">{t.whatsNext}</h2>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-3">
              <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="font-medium">{t.checkInbox}</div>
                <div className="text-muted-foreground">{t.checkInboxDesc}</div>
              </div>
            </li>
            <li className="flex gap-3">
              <Package className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="font-medium">{t.accessProduct}</div>
                <div className="text-muted-foreground">{t.accessProductDesc}</div>
              </div>
            </li>
            <li className="flex gap-3">
              <MessageCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="font-medium">{t.needHelp}</div>
                <div className="text-muted-foreground">
                  {t.messageUsOn}{" "}
                  <a
                    href="https://wa.me/112512724704"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    WhatsApp +1 251 272 4704
                  </a>
                </div>
              </div>
            </li>
          </ul>
        </section>

        {/* Digital delivery — download links from admin/products */}
        {(deliveryLoading || delivery.length > 0) && (
          <section className="rounded-xl border-2 border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-500/5 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-emerald-600" />
              <h2 className="font-semibold text-base text-emerald-900 dark:text-emerald-100">
                Tu material digital ya está listo
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Tu libro físico está en camino, pero puedes empezar a estudiar ahora mismo con la versión digital.
            </p>
            {deliveryLoading && (
              <p className="text-sm text-muted-foreground">Cargando enlaces…</p>
            )}
            <div className="space-y-3">
              {delivery.map((d) => (
                <div key={d.sku} className="rounded-lg border bg-card p-4 space-y-2">
                  <div className="flex items-center gap-3">
                    {d.cover_image_url && (
                      <img src={d.cover_image_url} alt={d.name} className="w-12 h-12 rounded object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{d.name}</div>
                      {d.bonus_count > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-primary">
                          <Gift className="w-3.5 h-3.5" />
                          {d.bonus_count} {d.bonus_count === 1 ? "bono incluido" : "bonos incluidos"}
                        </div>
                      )}
                    </div>
                  </div>
                  {!d.available && (
                    <p className="text-xs text-muted-foreground">
                      Te enviaremos el enlace de descarga a <strong>{buyer.email}</strong> en unos minutos.
                    </p>
                  )}
                </div>
              ))}
            </div>
            {downloadUrl && (
              <Button asChild size="sm" className="gap-1.5">
                <a href={downloadUrl}>
                  <Download className="w-4 h-4" /> Abrir mis descargas
                </a>
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              Por seguridad los archivos se abren desde tu página privada de descargas; el enlace es
              personal, tiene caducidad y queda registrado.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button size="sm" variant="outline" onClick={resendDigital} disabled={resending} className="gap-1.5">
                <Mail className="w-4 h-4" /> {resending ? "Reenviando…" : "Reenviar enlaces a mi correo"}
              </Button>
              <span className="text-xs text-muted-foreground">
                También te lo enviamos automáticamente a <strong>{buyer.email}</strong>.
              </span>
            </div>
          </section>
        )}


        {/* Order summary */}
        {items.length > 0 && (
          <section className="rounded-xl border bg-card p-5 space-y-4">
            <h2 className="font-semibold text-base">{t.orderSummary}</h2>
            <ul className="divide-y">
              {items.map((i) => (
                <li key={i.id} className="flex items-center gap-3 py-3">
                  <img src={i.image} alt={i.name} className="w-14 h-14 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{i.name}</div>
                    <div className="text-xs text-muted-foreground">{t.qty} {i.quantity}</div>
                  </div>
                  <div className="text-sm font-medium">${(itemPrice(i, region.tier) * i.quantity).toFixed(2)}</div>
                </li>
              ))}
            </ul>
            <div className="space-y-1 text-sm border-t pt-3">
              <div className="flex justify-between text-muted-foreground">
                <span>{t.subtotal}</span><span>${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>{t.discount} {coupon && `(${coupon})`}</span><span>-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-1">
                <span>{t.totalPaid}</span><span>${total.toFixed(2)} USD</span>
              </div>
            </div>
          </section>
        )}

        {/* Payment reference */}
        {(paymentId || externalRef) && (
          <details className="rounded-lg border bg-muted/30 p-3 text-xs">
            <summary className="cursor-pointer text-muted-foreground font-medium">{t.paymentReference}</summary>
            <div className="mt-2 space-y-1 text-muted-foreground">
              {paymentId && <div>{t.paymentId}: <code className="break-all">{paymentId}</code></div>}
              {status && <div>{t.paymentStatus}: <code>{status}</code></div>}
              {externalRef && <div>{t.paymentRef}: <code className="break-all">{externalRef}</code></div>}
            </div>
          </details>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button asChild size="lg" className="gap-2">
            <Link to="/"><ShoppingBag className="w-4 h-4" /> {t.continueShopping}</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="https://wa.me/112512724704" target="_blank" rel="noopener noreferrer">{t.contactSupport}</a>
          </Button>
        </div>
      </main>
    </div>
  );
}
