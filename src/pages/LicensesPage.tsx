import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { ScrollText, BadgeCheck, Users, Package, Image as ImageIcon, Scale, Mail } from "lucide-react";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { useI18n } from "@/i18n/I18nContext";

type Section = { title: string; content: string; icon: typeof ScrollText };
type PageContent = {
  seoTitle: string;
  seoDescription: string;
  heroTitle: string;
  heroSubtitle: string;
  lastUpdated: string;
  intro: string;
  sections: Section[];
  footerLine1: string;
  footerLine2: string;
};

const CONTENT: Record<"es" | "en" | "fr" | "pt", PageContent> = {
  es: {
    seoTitle: "Licencias y Avisos Legales - iLingue Relax",
    seoDescription: "Licencias, atribuciones de terceros y avisos legales de iLingue Relax™, marca propiedad de Youtumundial LLC.",
    heroTitle: "Licencias y Avisos Legales",
    heroSubtitle: "Uso de marcas, derechos de contenido y atribuciones de terceros utilizadas en iLingue Relax™.",
    lastUpdated: `Última actualización: ${new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}`,
    intro: `Esta página reúne las licencias, atribuciones y avisos legales aplicables a los productos, servicios, contenido y tecnologías empleadas por iLingue Relax™, marca propiedad de Youtumundial LLC. Su objetivo es reconocer los derechos de terceros y describir el alcance del uso permitido de nuestros propios materiales.`,
    sections: [
      { icon: BadgeCheck, title: "Marcas Registradas", content: `iLingue Relax™, el logotipo iLingue Relax™ y los eslóganes asociados son marcas comerciales de Youtumundial LLC. Otras marcas mencionadas (Hotmart®, Shopify®, Stripe®, PayPal®, Mercado Pago®, Visa®, Mastercard®, Amazon®, Google®, Meta®, WhatsApp®, Instagram®, Facebook®, YouTube®, Brevo®, Resend®, entre otras) pertenecen a sus respectivos titulares y se utilizan únicamente con fines descriptivos o de interoperabilidad, sin implicar patrocinio ni afiliación.` },
      { icon: ScrollText, title: "Licencia de Contenido Propio", content: `Los libros, eBooks, PDFs, audios, vídeos, mapas mentales, mockups, cursos y demás materiales creados por iLingue Relax™ se distribuyen bajo una licencia personal, no exclusiva e intransferible para uso individual del comprador. Queda prohibida su reventa, reproducción, redistribución, traducción o publicación total o parcial sin autorización previa por escrito de Youtumundial LLC.` },
      { icon: Package, title: "Software y Librerías de Terceros", content: `Este sitio utiliza software de código abierto bajo licencias permisivas, entre ellas: React, Vite, TypeScript, Tailwind CSS, shadcn/ui, Radix UI, Lucide Icons, Framer Motion, TanStack Query, React Router y Swiper. Los créditos y licencias completas están disponibles en los repositorios oficiales de cada proyecto.` },
      { icon: ImageIcon, title: "Imágenes, Fuentes y Recursos", content: `Las tipografías Plus Jakarta Sans e Inter se utilizan bajo la SIL Open Font License. Los iconos provienen de Lucide (Licencia ISC). Las imágenes, ilustraciones y mockups mostrados son propiedad de Youtumundial LLC o se emplean bajo licencias comerciales adquiridas. Cualquier imagen de terceros identificable es propiedad de su respectivo autor y se usa con permiso o bajo uso legítimo.` },
      { icon: Users, title: "Testimonios y Reseñas", content: `Los testimonios, capturas de WhatsApp y reseñas mostrados corresponden a clientes reales que autorizaron su publicación. Los nombres pueden abreviarse o modificarse por privacidad. Las reseñas son moderadas manualmente antes de publicarse.` },
      { icon: Scale, title: "Servicios de Pago y Terceros", content: `Los pagos son procesados por Stripe, PayPal, Mercado Pago, Hotmart y Shopify. Cada proveedor aplica sus propios términos, políticas de privacidad y condiciones de uso. Youtumundial LLC no almacena datos completos de tarjetas ni credenciales bancarias.` },
      { icon: Mail, title: "Contacto Legal", content: `Para consultas sobre licencias, permisos de uso, colaboraciones o reportes de infracción, escribe a hola@ilinguerelax.com indicando el asunto "Licencias y Avisos Legales".` },
    ],
    footerLine1: `© ${new Date().getFullYear()} Youtumundial LLC. Todos los derechos reservados.`,
    footerLine2: `iLingue Relax™ es una marca de Youtumundial LLC.`,
  },
  en: {
    seoTitle: "Licenses & Legal Notices - iLingue Relax",
    seoDescription: "Licenses, third-party attributions and legal notices for iLingue Relax™, a trademark of Youtumundial LLC.",
    heroTitle: "Licenses & Legal Notices",
    heroSubtitle: "Trademark usage, content rights and third-party attributions used by iLingue Relax™.",
    lastUpdated: `Last updated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
    intro: `This page consolidates the licenses, attributions and legal notices applicable to the products, services, content and technologies used by iLingue Relax™, a trademark of Youtumundial LLC. Its purpose is to acknowledge third-party rights and describe the scope of permitted use of our own materials.`,
    sections: [
      { icon: BadgeCheck, title: "Trademarks", content: `iLingue Relax™, the iLingue Relax™ logo and associated taglines are trademarks of Youtumundial LLC. Other trademarks mentioned (Hotmart®, Shopify®, Stripe®, PayPal®, Mercado Pago®, Visa®, Mastercard®, Amazon®, Google®, Meta®, WhatsApp®, Instagram®, Facebook®, YouTube®, Brevo®, Resend®, among others) belong to their respective owners and are used solely for descriptive or interoperability purposes, with no implied sponsorship or affiliation.` },
      { icon: ScrollText, title: "License of Own Content", content: `Books, eBooks, PDFs, audios, videos, mind maps, mockups, courses and other materials created by iLingue Relax™ are distributed under a personal, non-exclusive and non-transferable license for the individual use of the purchaser. Resale, reproduction, redistribution, translation or publication in whole or in part is prohibited without prior written authorization from Youtumundial LLC.` },
      { icon: Package, title: "Third-Party Software & Libraries", content: `This site uses open-source software under permissive licenses, including: React, Vite, TypeScript, Tailwind CSS, shadcn/ui, Radix UI, Lucide Icons, Framer Motion, TanStack Query, React Router and Swiper. Full credits and licenses are available in each project's official repository.` },
      { icon: ImageIcon, title: "Images, Fonts and Assets", content: `The Plus Jakarta Sans and Inter typefaces are used under the SIL Open Font License. Icons are provided by Lucide (ISC License). Images, illustrations and mockups shown are owned by Youtumundial LLC or used under acquired commercial licenses. Any identifiable third-party image belongs to its respective author and is used with permission or under fair use.` },
      { icon: Users, title: "Testimonials & Reviews", content: `Testimonials, WhatsApp screenshots and reviews displayed correspond to real customers who authorized their publication. Names may be abbreviated or altered for privacy. Reviews are manually moderated before publication.` },
      { icon: Scale, title: "Payment Services & Third Parties", content: `Payments are processed by Stripe, PayPal, Mercado Pago, Hotmart and Shopify. Each provider applies its own terms, privacy policy and conditions of use. Youtumundial LLC does not store full card data or banking credentials.` },
      { icon: Mail, title: "Legal Contact", content: `For inquiries about licenses, usage permissions, collaborations or infringement reports, write to hola@ilinguerelax.com with the subject "Licenses & Legal Notices".` },
    ],
    footerLine1: `© ${new Date().getFullYear()} Youtumundial LLC. All Rights Reserved.`,
    footerLine2: `iLingue Relax™ is a trademark of Youtumundial LLC.`,
  },
  fr: {
    seoTitle: "Licences et Mentions Légales - iLingue Relax",
    seoDescription: "Licences, attributions de tiers et mentions légales d'iLingue Relax™, marque de Youtumundial LLC.",
    heroTitle: "Licences et Mentions Légales",
    heroSubtitle: "Utilisation des marques, droits de contenu et attributions de tiers utilisées par iLingue Relax™.",
    lastUpdated: `Dernière mise à jour : ${new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}`,
    intro: `Cette page regroupe les licences, attributions et mentions légales applicables aux produits, services, contenus et technologies utilisés par iLingue Relax™, marque de Youtumundial LLC. Son but est de reconnaître les droits des tiers et de décrire l'étendue de l'utilisation autorisée de nos propres matériels.`,
    sections: [
      { icon: BadgeCheck, title: "Marques Déposées", content: `iLingue Relax™, le logo iLingue Relax™ et les slogans associés sont des marques de Youtumundial LLC. Les autres marques mentionnées (Hotmart®, Shopify®, Stripe®, PayPal®, Mercado Pago®, Visa®, Mastercard®, Amazon®, Google®, Meta®, WhatsApp®, Instagram®, Facebook®, YouTube®, Brevo®, Resend®, entre autres) appartiennent à leurs propriétaires respectifs et sont utilisées uniquement à des fins descriptives ou d'interopérabilité, sans parrainage ni affiliation.` },
      { icon: ScrollText, title: "Licence de Contenu Propre", content: `Les livres, eBooks, PDFs, audios, vidéos, cartes mentales, mockups, cours et autres matériels créés par iLingue Relax™ sont distribués sous licence personnelle, non exclusive et non transférable pour l'usage individuel de l'acheteur. La revente, reproduction, redistribution, traduction ou publication totale ou partielle est interdite sans autorisation écrite préalable de Youtumundial LLC.` },
      { icon: Package, title: "Logiciels et Bibliothèques Tiers", content: `Ce site utilise des logiciels open source sous licences permissives : React, Vite, TypeScript, Tailwind CSS, shadcn/ui, Radix UI, Lucide Icons, Framer Motion, TanStack Query, React Router et Swiper. Les crédits et licences complets sont disponibles dans les dépôts officiels de chaque projet.` },
      { icon: ImageIcon, title: "Images, Polices et Ressources", content: `Les polices Plus Jakarta Sans et Inter sont utilisées sous licence SIL Open Font License. Les icônes proviennent de Lucide (Licence ISC). Les images, illustrations et mockups présentés sont la propriété de Youtumundial LLC ou utilisés sous licences commerciales acquises. Toute image tierce identifiable appartient à son auteur respectif et est utilisée avec permission ou usage loyal.` },
      { icon: Users, title: "Témoignages et Avis", content: `Les témoignages, captures WhatsApp et avis affichés correspondent à des clients réels ayant autorisé leur publication. Les noms peuvent être abrégés ou modifiés pour la confidentialité. Les avis sont modérés manuellement avant publication.` },
      { icon: Scale, title: "Services de Paiement et Tiers", content: `Les paiements sont traités par Stripe, PayPal, Mercado Pago, Hotmart et Shopify. Chaque fournisseur applique ses propres conditions, politique de confidentialité et conditions d'utilisation. Youtumundial LLC ne stocke aucune donnée complète de carte ni identifiant bancaire.` },
      { icon: Mail, title: "Contact Juridique", content: `Pour toute question sur les licences, autorisations d'utilisation, collaborations ou signalements d'infraction, écrivez à hola@ilinguerelax.com avec l'objet « Licences et Mentions Légales ».` },
    ],
    footerLine1: `© ${new Date().getFullYear()} Youtumundial LLC. Tous droits réservés.`,
    footerLine2: `iLingue Relax™ est une marque de Youtumundial LLC.`,
  },
  pt: {
    seoTitle: "Licenças e Avisos Legais - iLingue Relax",
    seoDescription: "Licenças, atribuições de terceiros e avisos legais da iLingue Relax™, marca da Youtumundial LLC.",
    heroTitle: "Licenças e Avisos Legais",
    heroSubtitle: "Uso de marcas, direitos de conteúdo e atribuições de terceiros utilizados pela iLingue Relax™.",
    lastUpdated: `Última atualização: ${new Date().toLocaleDateString("pt-BR", { year: "numeric", month: "long", day: "numeric" })}`,
    intro: `Esta página reúne as licenças, atribuições e avisos legais aplicáveis aos produtos, serviços, conteúdos e tecnologias utilizados pela iLingue Relax™, marca da Youtumundial LLC. Seu objetivo é reconhecer os direitos de terceiros e descrever o escopo do uso permitido de nossos próprios materiais.`,
    sections: [
      { icon: BadgeCheck, title: "Marcas Registradas", content: `iLingue Relax™, o logotipo iLingue Relax™ e os slogans associados são marcas da Youtumundial LLC. Outras marcas mencionadas (Hotmart®, Shopify®, Stripe®, PayPal®, Mercado Pago®, Visa®, Mastercard®, Amazon®, Google®, Meta®, WhatsApp®, Instagram®, Facebook®, YouTube®, Brevo®, Resend®, entre outras) pertencem a seus respectivos titulares e são usadas apenas para fins descritivos ou de interoperabilidade, sem patrocínio ou afiliação.` },
      { icon: ScrollText, title: "Licença de Conteúdo Próprio", content: `Livros, eBooks, PDFs, áudios, vídeos, mapas mentais, mockups, cursos e demais materiais criados pela iLingue Relax™ são distribuídos sob licença pessoal, não exclusiva e intransferível para uso individual do comprador. É proibida a revenda, reprodução, redistribuição, tradução ou publicação total ou parcial sem autorização prévia por escrito da Youtumundial LLC.` },
      { icon: Package, title: "Software e Bibliotecas de Terceiros", content: `Este site utiliza software de código aberto sob licenças permissivas: React, Vite, TypeScript, Tailwind CSS, shadcn/ui, Radix UI, Lucide Icons, Framer Motion, TanStack Query, React Router e Swiper. Créditos e licenças completos estão disponíveis nos repositórios oficiais de cada projeto.` },
      { icon: ImageIcon, title: "Imagens, Fontes e Recursos", content: `As fontes Plus Jakarta Sans e Inter são usadas sob a SIL Open Font License. Os ícones são da Lucide (Licença ISC). As imagens, ilustrações e mockups exibidos são de propriedade da Youtumundial LLC ou utilizados sob licenças comerciais adquiridas. Qualquer imagem de terceiros identificável pertence ao seu respectivo autor e é usada com permissão ou uso justo.` },
      { icon: Users, title: "Depoimentos e Avaliações", content: `Depoimentos, capturas de WhatsApp e avaliações exibidos correspondem a clientes reais que autorizaram sua publicação. Os nomes podem ser abreviados ou alterados por privacidade. As avaliações são moderadas manualmente antes da publicação.` },
      { icon: Scale, title: "Serviços de Pagamento e Terceiros", content: `Os pagamentos são processados por Stripe, PayPal, Mercado Pago, Hotmart e Shopify. Cada provedor aplica seus próprios termos, política de privacidade e condições de uso. A Youtumundial LLC não armazena dados completos de cartões nem credenciais bancárias.` },
      { icon: Mail, title: "Contato Jurídico", content: `Para dúvidas sobre licenças, permissões de uso, colaborações ou denúncias de infração, escreva para hola@ilinguerelax.com com o assunto "Licenças e Avisos Legais".` },
    ],
    footerLine1: `© ${new Date().getFullYear()} Youtumundial LLC. Todos os direitos reservados.`,
    footerLine2: `iLingue Relax™ é uma marca da Youtumundial LLC.`,
  },
};

const LicensesPage = () => {
  const { language } = useI18n();
  const lang = (["es", "en", "fr", "pt"].includes(language) ? language : "es") as "es" | "en" | "fr" | "pt";
  const c = CONTENT[lang];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={c.seoTitle}
        description={c.seoDescription}
        canonicalUrl="https://ilinguerelax.com/licencias-y-avisos-legales"
        keywords="licencias iLingue Relax, avisos legales, atribuciones terceros, marcas registradas Youtumundial"
      />
      <Navbar />

      <motion.section
        className="pt-32 pb-16 gradient-hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="container px-4 md:px-6">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4">
              {c.heroTitle}
            </h1>
            <p className="text-lg text-primary-foreground/90">{c.heroSubtitle}</p>
            <p className="text-sm text-primary-foreground/70 mt-4">{c.lastUpdated}</p>
          </motion.div>
        </div>
      </motion.section>

      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            <p className="text-muted-foreground leading-relaxed mb-10 text-center md:text-left">
              {c.intro}
            </p>

            <div className="space-y-6">
              {c.sections.map((section, index) => {
                const Icon = section.icon;
                return (
                  <motion.div
                    key={section.title}
                    className="bg-card rounded-2xl border border-border shadow-card p-6 md:p-8"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-foreground mb-3">{section.title}</h2>
                        <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                          {section.content}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-12 text-center text-sm text-muted-foreground border-t border-border pt-8">
              <p>{c.footerLine1}</p>
              <p>{c.footerLine2}</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default LicensesPage;
