import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { Mail, Download, Package, Globe, ExternalLink } from "lucide-react";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { useI18n } from "@/i18n/I18nContext";

type Section = { title: string; content: string; icon: typeof Mail };

type PageContent = {
  seoTitle: string;
  seoDescription: string;
  heroTitle: string;
  heroSubtitle: string;
  lastUpdated: string;
  sections: Section[];
  amazonTitle: string;
  amazonText: string;
  amazonCta: string;
  footerLine: string;
};

const AMAZON_STORE = "https://www.amazon.com/stores/author/B0GH8SSTG5/allbooks";

const CONTENT: Record<"es" | "en" | "fr" | "pt", PageContent> = {
  es: {
    seoTitle: "Envíos y Entregas - iLingue Relax",
    seoDescription:
      "Cómo entregamos tus productos digitales y físicos: descarga inmediata en la tienda iLingue Relax, acceso vía Hotmart y envíos internacionales por Amazon.",
    heroTitle: "Envíos y Entregas",
    heroSubtitle:
      "Todo lo que necesitas saber sobre cómo recibirás tus productos iLingue Relax™.",
    lastUpdated: `Última actualización: ${new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}`,
    sections: [
      {
        icon: Download,
        title: "Productos digitales — Tienda iLingue Relax",
        content:
          "Al completar tu compra en la tienda oficial de iLingue Relax, recibirás acceso inmediato a tu producto digital. El enlace de descarga se muestra en la página de confirmación y también se envía al correo que registraste. Sin esperas y sin costos de envío.",
      },
      {
        icon: Mail,
        title: "Productos digitales — Hotmart",
        content:
          "Si tu compra se procesa a través de Hotmart, recibirás el acceso por correo electrónico junto con tus credenciales para ingresar a la plataforma de Hotmart, donde podrás descargar el material y acceder a las actualizaciones. Revisa también tu carpeta de spam o promociones.",
      },
      {
        icon: Package,
        title: "Libros físicos — Envíos por Amazon",
        content:
          "Nuestros libros impresos se distribuyen exclusivamente a través de Amazon, lo que garantiza envíos internacionales seguros y rastreables. Los tiempos y costos de envío dependen de tu país y son calculados directamente por Amazon durante el checkout.",
      },
      {
        icon: Globe,
        title: "Cobertura internacional",
        content:
          "Amazon envía a la mayoría de países del mundo. Los tiempos estimados suelen ser de 3 a 15 días hábiles según la región. Cualquier impuesto, aduana o tarifa adicional está sujeta a la política de Amazon y a la regulación de tu país.",
      },
    ],
    amazonTitle: "Compra nuestros libros físicos en Amazon",
    amazonText:
      "Visita la tienda oficial de iLingue Relax en Amazon para ver todos los libros disponibles y realizar tu pedido con envío internacional.",
    amazonCta: "Ver tienda en Amazon",
    footerLine:
      "¿Necesitas ayuda con tu pedido? Escríbenos a hola@ilinguerelax.com o por WhatsApp al +1 251 272 4704.",
  },
  en: {
    seoTitle: "Shipping & Delivery - iLingue Relax",
    seoDescription:
      "How we deliver your digital and physical products: instant download from the iLingue Relax store, Hotmart access, and worldwide shipping via Amazon.",
    heroTitle: "Shipping & Delivery",
    heroSubtitle:
      "Everything you need to know about how you'll receive your iLingue Relax™ products.",
    lastUpdated: `Last updated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
    sections: [
      {
        icon: Download,
        title: "Digital products — iLingue Relax Store",
        content:
          "When you complete your purchase in the official iLingue Relax store, you get instant access to your digital product. The download link is shown on the confirmation page and also sent to the email you registered. No waiting, no shipping fees.",
      },
      {
        icon: Mail,
        title: "Digital products — Hotmart",
        content:
          "If your purchase is processed through Hotmart, you'll receive access by email along with credentials to log in to the Hotmart platform, where you can download the material and access updates. Please also check your spam or promotions folder.",
      },
      {
        icon: Package,
        title: "Physical books — Shipping via Amazon",
        content:
          "Our printed books are distributed exclusively through Amazon, which guarantees secure and trackable international shipping. Delivery times and shipping costs depend on your country and are calculated directly by Amazon at checkout.",
      },
      {
        icon: Globe,
        title: "International coverage",
        content:
          "Amazon ships to most countries worldwide. Estimated delivery times are usually 3 to 15 business days depending on the region. Any taxes, customs duties, or additional fees are subject to Amazon's policy and your country's regulations.",
      },
    ],
    amazonTitle: "Buy our physical books on Amazon",
    amazonText:
      "Visit the official iLingue Relax store on Amazon to see all available books and place your order with international shipping.",
    amazonCta: "Visit Amazon Store",
    footerLine:
      "Need help with your order? Email us at hola@ilinguerelax.com or WhatsApp us at +1 251 272 4704.",
  },
  fr: {
    seoTitle: "Livraison - iLingue Relax",
    seoDescription:
      "Comment nous livrons vos produits numériques et physiques : téléchargement immédiat sur la boutique iLingue Relax, accès Hotmart et expédition internationale via Amazon.",
    heroTitle: "Livraison",
    heroSubtitle:
      "Tout ce que vous devez savoir sur la réception de vos produits iLingue Relax™.",
    lastUpdated: `Dernière mise à jour : ${new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}`,
    sections: [
      {
        icon: Download,
        title: "Produits numériques — Boutique iLingue Relax",
        content:
          "En finalisant votre achat sur la boutique officielle iLingue Relax, vous obtenez un accès immédiat à votre produit numérique. Le lien de téléchargement s'affiche sur la page de confirmation et est également envoyé à l'e-mail que vous avez indiqué. Sans attente ni frais de port.",
      },
      {
        icon: Mail,
        title: "Produits numériques — Hotmart",
        content:
          "Si votre achat est traité via Hotmart, vous recevrez l'accès par e-mail avec vos identifiants pour vous connecter à la plateforme Hotmart, où vous pourrez télécharger le contenu et accéder aux mises à jour. Vérifiez également votre dossier spam ou promotions.",
      },
      {
        icon: Package,
        title: "Livres physiques — Expédition via Amazon",
        content:
          "Nos livres imprimés sont distribués exclusivement via Amazon, ce qui garantit une expédition internationale sûre et suivie. Les délais et frais de livraison dépendent de votre pays et sont calculés directement par Amazon lors du paiement.",
      },
      {
        icon: Globe,
        title: "Couverture internationale",
        content:
          "Amazon expédie dans la plupart des pays du monde. Les délais estimés sont généralement de 3 à 15 jours ouvrables selon la région. Toute taxe, droit de douane ou frais supplémentaire est soumis à la politique d'Amazon et à la réglementation de votre pays.",
      },
    ],
    amazonTitle: "Achetez nos livres physiques sur Amazon",
    amazonText:
      "Visitez la boutique officielle iLingue Relax sur Amazon pour voir tous les livres disponibles et passer votre commande avec livraison internationale.",
    amazonCta: "Voir la boutique Amazon",
    footerLine:
      "Besoin d'aide avec votre commande ? Écrivez-nous à hola@ilinguerelax.com ou par WhatsApp au +1 251 272 4704.",
  },
  pt: {
    seoTitle: "Envio e Entrega - iLingue Relax",
    seoDescription:
      "Como entregamos seus produtos digitais e físicos: download imediato na loja iLingue Relax, acesso via Hotmart e envio internacional pela Amazon.",
    heroTitle: "Envio e Entrega",
    heroSubtitle:
      "Tudo o que você precisa saber sobre como receberá seus produtos iLingue Relax™.",
    lastUpdated: `Última atualização: ${new Date().toLocaleDateString("pt-BR", { year: "numeric", month: "long", day: "numeric" })}`,
    sections: [
      {
        icon: Download,
        title: "Produtos digitais — Loja iLingue Relax",
        content:
          "Ao concluir sua compra na loja oficial iLingue Relax, você recebe acesso imediato ao seu produto digital. O link de download aparece na página de confirmação e também é enviado ao e-mail cadastrado. Sem esperas e sem custo de envio.",
      },
      {
        icon: Mail,
        title: "Produtos digitais — Hotmart",
        content:
          "Se a sua compra for processada pela Hotmart, você receberá o acesso por e-mail com as credenciais para entrar na plataforma Hotmart, onde poderá baixar o material e acessar as atualizações. Verifique também sua caixa de spam ou promoções.",
      },
      {
        icon: Package,
        title: "Livros físicos — Envio pela Amazon",
        content:
          "Nossos livros impressos são distribuídos exclusivamente pela Amazon, o que garante envio internacional seguro e rastreável. Os prazos e custos de envio dependem do seu país e são calculados diretamente pela Amazon no checkout.",
      },
      {
        icon: Globe,
        title: "Cobertura internacional",
        content:
          "A Amazon envia para a maioria dos países do mundo. Os prazos estimados costumam ser de 3 a 15 dias úteis, dependendo da região. Impostos, taxas alfandegárias ou tarifas adicionais estão sujeitos à política da Amazon e à regulamentação do seu país.",
      },
    ],
    amazonTitle: "Compre nossos livros físicos na Amazon",
    amazonText:
      "Visite a loja oficial iLingue Relax na Amazon para ver todos os livros disponíveis e fazer seu pedido com envio internacional.",
    amazonCta: "Ver loja na Amazon",
    footerLine:
      "Precisa de ajuda com seu pedido? Escreva para hola@ilinguerelax.com ou pelo WhatsApp +1 251 272 4704.",
  },
};

const ShippingPage = () => {
  const { language } = useI18n();
  const c = CONTENT[language];

  return (
    <div className="min-h-screen bg-background">
      <SEO title={c.seoTitle} description={c.seoDescription} canonicalUrl="https://ilinguerelax.com/envios-y-entregas" />
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {c.heroTitle}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {c.heroSubtitle}
            </p>
            <p className="text-sm text-muted-foreground/70 mt-3">{c.lastUpdated}</p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2">
            {c.sections.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="rounded-2xl border border-border bg-card p-6 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground">
                      {s.title}
                    </h2>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {s.content}
                  </p>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 p-8 text-center"
          >
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {c.amazonTitle}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-5">
              {c.amazonText}
            </p>
            <a
              href={AMAZON_STORE}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-3 font-semibold hover:opacity-90 transition-opacity"
            >
              {c.amazonCta}
              <ExternalLink className="w-4 h-4" />
            </a>
          </motion.div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            {c.footerLine}
          </p>
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default ShippingPage;
