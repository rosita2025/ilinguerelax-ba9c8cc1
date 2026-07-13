import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { BadgeCheck, ShieldAlert, Scale, Building2 } from "lucide-react";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { useI18n } from "@/i18n/I18nContext";

type Section = { title: string; content: string; icon: typeof BadgeCheck };
type PageContent = {
  seoTitle: string;
  seoDescription: string;
  heroTitle: string;
  heroSubtitle: string;
  lastUpdated: string;
  sections: Section[];
};

const CONTENT: Record<"es" | "en" | "fr" | "pt", PageContent> = {
  es: {
    seoTitle: "Aviso de Marca Registrada - iLingue Relax",
    seoDescription: "Aviso oficial de marca registrada iLingue Relax™, propiedad de Youtumundial LLC.",
    heroTitle: "Aviso de Marca Registrada",
    heroSubtitle: "iLingue Relax™ es una marca registrada de Youtumundial LLC.",
    lastUpdated: `Última actualización: ${new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}`,
    sections: [
      { icon: BadgeCheck, title: "Titular de la Marca", content: `iLingue Relax™ es una marca registrada propiedad de Youtumundial LLC y se encuentra registrada en el Estado de Nuevo México, Estados Unidos.` },
      { icon: Building2, title: "Elementos Cubiertos", content: `La marca comercial, el nombre de marca, los logotipos, isotipos, lemas, empaques, plantillas visuales y todos los elementos de identidad relacionados con iLingue Relax™ son propiedad exclusiva de Youtumundial LLC.` },
      { icon: ShieldAlert, title: "Usos Prohibidos", content: `Queda estrictamente prohibido cualquier uso, reproducción, imitación, adaptación, traducción o distribución no autorizada de la marca iLingue Relax™ o de cualquier designación confusamente similar, incluyendo nombres de dominio, cuentas de redes sociales, productos, materiales impresos o digitales.` },
      { icon: Scale, title: "Acciones Legales", content: `El uso no autorizado de la marca puede violar las leyes de marcas registradas y de propiedad intelectual aplicables en Estados Unidos y a nivel internacional, y puede dar lugar a acciones civiles y penales.\n\nPara solicitar autorización de uso o reportar infracciones, contáctanos en hola@ilinguerelax.com.` },
    ],
  },
  en: {
    seoTitle: "Trademark Notice - iLingue Relax",
    seoDescription: "Official trademark notice for iLingue Relax™, owned by Youtumundial LLC.",
    heroTitle: "Trademark Notice",
    heroSubtitle: "iLingue Relax™ is a registered trademark of Youtumundial LLC.",
    lastUpdated: `Last updated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
    sections: [
      { icon: BadgeCheck, title: "Trademark Owner", content: `iLingue Relax™ is a trademark owned by Youtumundial LLC and is registered in the State of New Mexico, United States.` },
      { icon: Building2, title: "Covered Elements", content: `The trademark, brand name, logos, symbols, slogans, packaging, visual templates, and all identity elements related to iLingue Relax™ are the exclusive property of Youtumundial LLC.` },
      { icon: ShieldAlert, title: "Prohibited Uses", content: `Any unauthorized use, reproduction, imitation, adaptation, translation, or distribution of the iLingue Relax™ trademark or any confusingly similar designation is strictly prohibited, including domain names, social media accounts, products, and printed or digital materials.` },
      { icon: Scale, title: "Legal Action", content: `Unauthorized use of the trademark may violate applicable trademark and intellectual property laws in the United States and internationally, and may result in civil and criminal action.\n\nTo request authorization or report infringement, contact us at hola@ilinguerelax.com.` },
    ],
  },
  fr: {
    seoTitle: "Avis de Marque Déposée - iLingue Relax",
    seoDescription: "Avis officiel de marque déposée iLingue Relax™, propriété de Youtumundial LLC.",
    heroTitle: "Avis de Marque Déposée",
    heroSubtitle: "iLingue Relax™ est une marque déposée de Youtumundial LLC.",
    lastUpdated: `Dernière mise à jour : ${new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}`,
    sections: [
      { icon: BadgeCheck, title: "Titulaire de la Marque", content: `iLingue Relax™ est une marque détenue par Youtumundial LLC et enregistrée dans l'État du Nouveau-Mexique, États-Unis.` },
      { icon: Building2, title: "Éléments Couverts", content: `La marque, le nom commercial, les logos, symboles, slogans, emballages, modèles visuels et tous les éléments d'identité liés à iLingue Relax™ sont la propriété exclusive de Youtumundial LLC.` },
      { icon: ShieldAlert, title: "Utilisations Interdites", content: `Toute utilisation, reproduction, imitation, adaptation, traduction ou distribution non autorisée de la marque iLingue Relax™ ou de toute désignation susceptible de prêter à confusion est strictement interdite, y compris les noms de domaine, les comptes de réseaux sociaux, les produits et les supports imprimés ou numériques.` },
      { icon: Scale, title: "Actions Légales", content: `L'utilisation non autorisée de la marque peut enfreindre les lois applicables sur les marques et la propriété intellectuelle aux États-Unis et à l'international, et peut entraîner des actions civiles et pénales.\n\nPour demander une autorisation ou signaler une infraction : hola@ilinguerelax.com.` },
    ],
  },
  pt: {
    seoTitle: "Aviso de Marca Registrada - iLingue Relax",
    seoDescription: "Aviso oficial de marca registrada iLingue Relax™, propriedade da Youtumundial LLC.",
    heroTitle: "Aviso de Marca Registrada",
    heroSubtitle: "iLingue Relax™ é uma marca registrada da Youtumundial LLC.",
    lastUpdated: `Última atualização: ${new Date().toLocaleDateString("pt-BR", { year: "numeric", month: "long", day: "numeric" })}`,
    sections: [
      { icon: BadgeCheck, title: "Titular da Marca", content: `iLingue Relax™ é uma marca de propriedade da Youtumundial LLC e está registrada no Estado do Novo México, Estados Unidos.` },
      { icon: Building2, title: "Elementos Cobertos", content: `A marca, o nome comercial, os logotipos, símbolos, slogans, embalagens, modelos visuais e todos os elementos de identidade relacionados à iLingue Relax™ são propriedade exclusiva da Youtumundial LLC.` },
      { icon: ShieldAlert, title: "Usos Proibidos", content: `Qualquer uso, reprodução, imitação, adaptação, tradução ou distribuição não autorizada da marca iLingue Relax™ ou de qualquer designação confusamente similar é estritamente proibido, incluindo nomes de domínio, contas em redes sociais, produtos e materiais impressos ou digitais.` },
      { icon: Scale, title: "Ações Legais", content: `O uso não autorizado da marca pode violar as leis de marcas e propriedade intelectual aplicáveis nos Estados Unidos e internacionalmente, podendo resultar em ações civis e criminais.\n\nPara solicitar autorização ou denunciar infrações: hola@ilinguerelax.com.` },
    ],
  },
};

const TrademarkPage = () => {
  const { language } = useI18n();
  const lang = (["es", "en", "fr", "pt"].includes(language) ? language : "es") as "es" | "en" | "fr" | "pt";
  const c = CONTENT[lang];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={c.seoTitle}
        description={c.seoDescription}
        canonicalUrl="https://ilinguerelax.com/trademark"
        keywords="trademark iLingue Relax, marca registrada Youtumundial, aviso de marca"
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
          <div className="max-w-3xl mx-auto space-y-8">
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
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default TrademarkPage;
