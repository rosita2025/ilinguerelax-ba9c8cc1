import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { Ban, Eye, Clock, Package, ExternalLink, RefreshCw, ShieldOff, MessageCircle } from "lucide-react";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { useI18n } from "@/i18n/I18nContext";

type Section = { title: string; content: string; icon: typeof Ban };

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
    seoTitle: "Devoluciones y Reembolsos - iLingue Relax",
    seoDescription:
      "Política de devoluciones y reembolsos de iLingue Relax: productos digitales, compras por Hotmart y libros físicos enviados por Amazon.",
    heroTitle: "Devoluciones y Reembolsos",
    heroSubtitle:
      "Conoce en qué casos aplican los reembolsos según el tipo de producto y la plataforma de compra.",
    lastUpdated: `Última actualización: ${new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}`,
    sections: [
      {
        icon: Eye,
        title: "Vista previa antes de comprar",
        content:
          "Cada producto digital cuenta con una vista previa, demo o muestra gratuita para que puedas revisar el contenido, la calidad y el formato antes de comprar. Te recomendamos revisarla siempre: al ser productos digitales de precio muy accesible, la vista previa es la garantía principal para asegurarte de que el material se ajusta a lo que buscas.",
      },
      {
        icon: Ban,
        title: "Productos digitales — Tienda iLingue Relax",
        content:
          "Los productos digitales comprados en la tienda oficial de iLingue Relax no admiten reembolso una vez que la descarga o el acceso ha sido entregado. Al tratarse de contenido intangible y de precios económicos, no es posible devolver un archivo ya descargado o impreso. Por eso ofrecemos siempre una vista previa antes de la compra.",
      },
      {
        icon: Clock,
        title: "Productos digitales — Hotmart (7 días)",
        content:
          "Las compras procesadas a través de Hotmart cuentan con una garantía de reembolso de hasta 7 días naturales desde la fecha de compra, conforme a la política oficial de Hotmart. El reembolso se solicita directamente desde tu cuenta de Hotmart o desde el correo de confirmación de compra.",
      },
      {
        icon: Package,
        title: "Libros físicos — Amazon (7 días)",
        content:
          "Los libros físicos se venden y envían a través de Amazon, y su política de devolución permite reembolso hasta 7 días después de la entrega. Aplica en casos de libro dañado, extraviado, defectuoso o si no cumple con tus expectativas. La devolución y el reembolso son gestionados y garantizados directamente por Amazon bajo su propia responsabilidad.",
      },
      {
        icon: RefreshCw,
        title: "Cambio de producto sin costo adicional",
        content:
          "Si no deseas un reembolso, puedes solicitar el cambio por otro producto digital de igual o menor valor sin costo adicional. Si el nuevo producto tiene un precio mayor, solo abonas la diferencia. Esta opción aplica siempre que el pedido cumpla con las condiciones de la plataforma de compra correspondiente.",
      },
      {
        icon: ShieldOff,
        title: "Qué pasa con la descarga y el acceso",
        content:
          "Cuando se aprueba un reembolso o cambio, se revoca el acceso al producto digital anterior: los enlaces de descarga dejan de funcionar, se cancela el acceso en la plataforma y te comprometes a eliminar las copias ya descargadas o impresas. En caso de cambio, activamos el nuevo producto una vez confirmada la desactivación del anterior. Solicita tu cambio o reembolso por WhatsApp al +1 251 272 4704 para agilizar el proceso.",
      },
    ],
    amazonTitle: "Solicita tu devolución en Amazon",
    amazonText:
      "Si compraste un libro físico y necesitas iniciar una devolución o reclamo, ingresa a tu cuenta de Amazon o visita nuestra tienda oficial para localizar tu pedido.",
    amazonCta: "Ir a la tienda de Amazon",
    footerLine:
      "¿Dudas sobre un reembolso? Escríbenos a hola@ilinguerelax.com o por WhatsApp al +1 251 272 4704.",
  },
  en: {
    seoTitle: "Returns & Refunds - iLingue Relax",
    seoDescription:
      "iLingue Relax return and refund policy: digital products, Hotmart purchases and physical books shipped via Amazon.",
    heroTitle: "Returns & Refunds",
    heroSubtitle:
      "Learn when refunds apply based on the product type and purchase platform.",
    lastUpdated: `Last updated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
    sections: [
      {
        icon: Eye,
        title: "Preview before buying",
        content:
          "Every digital product includes a free preview, demo, or sample so you can review the content, quality, and format before purchasing. We always recommend checking it: since our digital products are very affordably priced, the preview is your main guarantee that the material meets your needs.",
      },
      {
        icon: Ban,
        title: "Digital products — iLingue Relax Store",
        content:
          "Digital products purchased in the official iLingue Relax store are non-refundable once the download or access has been delivered. Because the content is intangible and priced very affordably, a file that has already been downloaded or printed cannot be returned. That is why we always provide a preview before purchase.",
      },
      {
        icon: Clock,
        title: "Digital products — Hotmart (7 days)",
        content:
          "Purchases processed through Hotmart include a refund guarantee of up to 7 calendar days from the purchase date, in accordance with Hotmart's official policy. Refunds are requested directly from your Hotmart account or from the purchase confirmation email.",
      },
      {
        icon: Package,
        title: "Physical books — Amazon (7 days)",
        content:
          "Physical books are sold and shipped through Amazon, and their return policy allows refunds up to 7 days after delivery. This applies to damaged, lost, defective books, or if the item does not meet your expectations. Returns and refunds are handled and guaranteed directly by Amazon under their own responsibility.",
      },
      {
        icon: RefreshCw,
        title: "Product exchange at no extra cost",
        content:
          "If you prefer not to request a refund, you can exchange your purchase for another digital product of equal or lower value at no additional cost. If the new product is more expensive, you only pay the difference. This option is available as long as the order meets the conditions of the corresponding purchase platform.",
      },
      {
        icon: ShieldOff,
        title: "What happens to your download and access",
        content:
          "When a refund or exchange is approved, access to the previous digital product is revoked: download links stop working, platform access is canceled, and you agree to delete any already-downloaded or printed copies. For exchanges, we activate the new product as soon as the previous one is confirmed as deactivated. Request your exchange or refund via WhatsApp +1 251 272 4704 to speed up the process.",
      },
    ],
    amazonTitle: "Request your return on Amazon",
    amazonText:
      "If you purchased a physical book and need to start a return or claim, log in to your Amazon account or visit our official store to locate your order.",
    amazonCta: "Go to Amazon Store",
    footerLine:
      "Questions about a refund? Email us at hola@ilinguerelax.com or WhatsApp us at +1 251 272 4704.",
  },
  fr: {
    seoTitle: "Retours et Remboursements - iLingue Relax",
    seoDescription:
      "Politique de retours et remboursements iLingue Relax : produits numériques, achats via Hotmart et livres physiques expédiés par Amazon.",
    heroTitle: "Retours et Remboursements",
    heroSubtitle:
      "Découvrez dans quels cas les remboursements s'appliquent selon le type de produit et la plateforme d'achat.",
    lastUpdated: `Dernière mise à jour : ${new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}`,
    sections: [
      {
        icon: Eye,
        title: "Aperçu avant l'achat",
        content:
          "Chaque produit numérique dispose d'un aperçu, d'une démo ou d'un échantillon gratuit pour vous permettre d'examiner le contenu, la qualité et le format avant l'achat. Nous vous recommandons de toujours le consulter : nos produits numériques ayant un prix très abordable, l'aperçu est votre principale garantie.",
      },
      {
        icon: Ban,
        title: "Produits numériques — Boutique iLingue Relax",
        content:
          "Les produits numériques achetés sur la boutique officielle iLingue Relax ne sont pas remboursables une fois le téléchargement ou l'accès livré. Le contenu étant intangible et à prix très bas, un fichier déjà téléchargé ou imprimé ne peut être retourné. C'est pourquoi nous fournissons toujours un aperçu avant l'achat.",
      },
      {
        icon: Clock,
        title: "Produits numériques — Hotmart (7 jours)",
        content:
          "Les achats traités via Hotmart bénéficient d'une garantie de remboursement pouvant aller jusqu'à 7 jours calendaires à compter de la date d'achat, conformément à la politique officielle de Hotmart. La demande se fait directement depuis votre compte Hotmart ou depuis l'e-mail de confirmation.",
      },
      {
        icon: Package,
        title: "Livres physiques — Amazon (7 jours)",
        content:
          "Les livres physiques sont vendus et expédiés via Amazon, et leur politique de retour permet un remboursement jusqu'à 7 jours après la livraison. Elle s'applique en cas de livre endommagé, perdu, défectueux ou ne répondant pas à vos attentes. Les retours et remboursements sont gérés et garantis directement par Amazon.",
      },
      {
        icon: RefreshCw,
        title: "Échange de produit sans frais supplémentaires",
        content:
          "Si vous préférez ne pas demander de remboursement, vous pouvez échanger votre achat contre un autre produit numérique de valeur égale ou inférieure, sans frais supplémentaires. Si le nouveau produit est plus cher, vous ne payez que la différence. Cette option s'applique tant que la commande respecte les conditions de la plateforme d'achat concernée.",
      },
      {
        icon: ShieldOff,
        title: "Ce qui se passe avec le téléchargement et l'accès",
        content:
          "Lorsqu'un remboursement ou un échange est approuvé, l'accès au produit numérique précédent est révoqué : les liens de téléchargement cessent de fonctionner, l'accès sur la plateforme est annulé et vous vous engagez à supprimer les copies déjà téléchargées ou imprimées. En cas d'échange, nous activons le nouveau produit dès la désactivation confirmée du précédent. Demandez votre échange ou remboursement via WhatsApp +1 251 272 4704 pour accélérer le processus.",
      },
    ],
    amazonTitle: "Demandez votre retour sur Amazon",
    amazonText:
      "Si vous avez acheté un livre physique et souhaitez initier un retour ou une réclamation, connectez-vous à votre compte Amazon ou visitez notre boutique officielle.",
    amazonCta: "Aller sur la boutique Amazon",
    footerLine:
      "Des questions sur un remboursement ? Écrivez-nous à hola@ilinguerelax.com ou WhatsApp au +1 251 272 4704.",
  },
  pt: {
    seoTitle: "Devoluções e Reembolsos - iLingue Relax",
    seoDescription:
      "Política de devoluções e reembolsos da iLingue Relax: produtos digitais, compras via Hotmart e livros físicos enviados pela Amazon.",
    heroTitle: "Devoluções e Reembolsos",
    heroSubtitle:
      "Saiba em quais casos os reembolsos se aplicam de acordo com o tipo de produto e a plataforma de compra.",
    lastUpdated: `Última atualização: ${new Date().toLocaleDateString("pt-BR", { year: "numeric", month: "long", day: "numeric" })}`,
    sections: [
      {
        icon: Eye,
        title: "Prévia antes de comprar",
        content:
          "Cada produto digital inclui uma prévia, demo ou amostra gratuita para que você possa revisar o conteúdo, a qualidade e o formato antes de comprar. Recomendamos sempre conferi-la: como nossos produtos digitais têm preços muito acessíveis, a prévia é a principal garantia de que o material atende ao que você procura.",
      },
      {
        icon: Ban,
        title: "Produtos digitais — Loja iLingue Relax",
        content:
          "Os produtos digitais comprados na loja oficial iLingue Relax não são reembolsáveis após a entrega do download ou acesso. Por se tratar de conteúdo intangível e com preços muito baixos, um arquivo já baixado ou impresso não pode ser devolvido. Por isso disponibilizamos sempre uma prévia antes da compra.",
      },
      {
        icon: Clock,
        title: "Produtos digitais — Hotmart (7 dias)",
        content:
          "As compras processadas pela Hotmart contam com garantia de reembolso de até 7 dias corridos a partir da data da compra, conforme a política oficial da Hotmart. O reembolso é solicitado diretamente na sua conta Hotmart ou no e-mail de confirmação.",
      },
      {
        icon: Package,
        title: "Livros físicos — Amazon (7 dias)",
        content:
          "Os livros físicos são vendidos e enviados pela Amazon, e sua política de devolução permite reembolso em até 7 dias após a entrega. Aplica-se a livros danificados, extraviados, defeituosos ou que não atendam às suas expectativas. Devoluções e reembolsos são gerenciados e garantidos diretamente pela Amazon sob sua responsabilidade.",
      },
      {
        icon: RefreshCw,
        title: "Troca de produto sem custo adicional",
        content:
          "Se preferir não solicitar reembolso, você pode trocar sua compra por outro produto digital de valor igual ou inferior sem custo adicional. Se o novo produto for mais caro, você paga apenas a diferença. Esta opção se aplica desde que o pedido cumpra as condições da plataforma de compra correspondente.",
      },
      {
        icon: ShieldOff,
        title: "O que acontece com o download e o acesso",
        content:
          "Quando um reembolso ou troca é aprovado, o acesso ao produto digital anterior é revogado: os links de download deixam de funcionar, o acesso na plataforma é cancelado e você se compromete a apagar as cópias já baixadas ou impressas. Se for troca, liberamos o novo produto assim que o anterior for confirmado como desativado. Solicite sua troca ou reembolso pelo WhatsApp +1 251 272 4704 para agilizar o processo.",
      },
    ],
    amazonTitle: "Solicite sua devolução na Amazon",
    amazonText:
      "Se você comprou um livro físico e precisa iniciar uma devolução ou reclamação, acesse sua conta Amazon ou visite nossa loja oficial para localizar seu pedido.",
    amazonCta: "Ir para a loja Amazon",
    footerLine:
      "Dúvidas sobre um reembolso? Escreva para hola@ilinguerelax.com ou WhatsApp +1 251 272 4704.",
  },
};

const ReturnsPage = () => {
  const { language } = useI18n();
  const c = CONTENT[language];

  return (
    <div className="min-h-screen bg-background">
      <SEO title={c.seoTitle} description={c.seoDescription} canonicalUrl="https://ilinguerelax.com/devoluciones-y-reembolsos" />
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
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={AMAZON_STORE}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-3 font-semibold hover:opacity-90 transition-opacity"
              >
                {c.amazonCta}
                <ExternalLink className="w-4 h-4" />
              </a>
              <a
                href="https://wa.me/12512724704"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] text-white px-6 py-3 font-semibold hover:opacity-90 transition-opacity"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp +1 251 272 4704
              </a>
            </div>
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

export default ReturnsPage;
