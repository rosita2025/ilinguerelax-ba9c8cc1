import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { Copyright, ShieldAlert, FileText, Scale } from "lucide-react";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { useI18n } from "@/i18n/I18nContext";

type Section = { title: string; content: string; icon: typeof Copyright };

type PageContent = {
  seoTitle: string;
  seoDescription: string;
  heroTitle: string;
  heroSubtitle: string;
  lastUpdated: string;
  sections: Section[];
  footerLine1: string;
  footerLine2: string;
};

const CONTENT: Record<"es" | "en" | "fr" | "pt", PageContent> = {
  es: {
    seoTitle: "Aviso de Copyright - iLingue Relax",
    seoDescription: "Aviso oficial de derechos de autor de iLingue Relax™, marca propiedad de Youtumundial LLC.",
    heroTitle: "Aviso de Copyright",
    heroSubtitle: "Derechos de autor de todo el contenido publicado bajo la marca iLingue Relax™.",
    lastUpdated: `Última actualización: ${new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}`,
    sections: [
      { icon: Copyright, title: "Contenido Protegido", content: `Todo el contenido publicado bajo la marca iLingue Relax™, incluyendo entre otros libros, libros impresos, eBooks, archivos PDF, productos digitales, cursos, hojas de trabajo, materiales de aprendizaje, imágenes, gráficos, ilustraciones, audios, vídeos, contenido del sitio web y recursos descargables, está protegido por las leyes de derechos de autor de los Estados Unidos e internacionales.` },
      { icon: ShieldAlert, title: "Titularidad de los Derechos", content: `Salvo indicación en contrario, todos los derechos de autor son propiedad de Youtumundial LLC. Ninguna parte de estos materiales puede ser copiada, reproducida, distribuida, traducida, modificada, almacenada, transmitida, revendida o utilizada con fines comerciales sin el permiso previo por escrito de Youtumundial LLC.` },
      { icon: FileText, title: "Licencia de Uso", content: `La compra de cualquier producto iLingue Relax™ otorga una licencia personal, no exclusiva e intransferible únicamente para uso individual. La titularidad de la propiedad intelectual permanece exclusivamente en Youtumundial LLC.` },
      { icon: Scale, title: "Sanciones por Uso No Autorizado", content: `Cualquier reproducción, distribución o uso comercial no autorizado puede dar lugar a sanciones civiles y penales conforme a las leyes de derechos de autor aplicables.` },
    ],
    footerLine1: `© ${new Date().getFullYear()} Youtumundial LLC. Todos los derechos reservados.`,
    footerLine2: `Publicado bajo la marca iLingue Relax™.`,
  },
  en: {
    seoTitle: "Copyright Notice - iLingue Relax",
    seoDescription: "Official copyright notice for iLingue Relax™, a trademark of Youtumundial LLC.",
    heroTitle: "Copyright Notice",
    heroSubtitle: "Copyright of all content published under the iLingue Relax™ brand.",
    lastUpdated: `Last updated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
    sections: [
      { icon: Copyright, title: "Protected Content", content: `All content published under the iLingue Relax™ brand, including but not limited to books, printed books, eBooks, PDF files, digital products, courses, worksheets, learning materials, images, graphics, illustrations, audio, videos, website content, and downloadable resources, is protected by United States and international copyright laws.` },
      { icon: ShieldAlert, title: "Ownership of Rights", content: `Unless otherwise stated, all copyrights are owned by Youtumundial LLC. No part of these materials may be copied, reproduced, distributed, translated, modified, stored, transmitted, resold, or used for commercial purposes without the prior written permission of Youtumundial LLC.` },
      { icon: FileText, title: "License of Use", content: `The purchase of any iLingue Relax™ product grants a personal, non-exclusive, non-transferable license for individual use only. Ownership of the intellectual property remains exclusively with Youtumundial LLC.` },
      { icon: Scale, title: "Penalties for Unauthorized Use", content: `Any unauthorized reproduction, distribution, or commercial use may result in civil and criminal penalties under applicable copyright laws.` },
    ],
    footerLine1: `© ${new Date().getFullYear()} Youtumundial LLC. All Rights Reserved.`,
    footerLine2: `Published under the iLingue Relax™ brand.`,
  },
  fr: {
    seoTitle: "Avis de Copyright - iLingue Relax",
    seoDescription: "Avis officiel de droits d'auteur d'iLingue Relax™, marque de Youtumundial LLC.",
    heroTitle: "Avis de Copyright",
    heroSubtitle: "Droits d'auteur de tout le contenu publié sous la marque iLingue Relax™.",
    lastUpdated: `Dernière mise à jour : ${new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}`,
    sections: [
      { icon: Copyright, title: "Contenu Protégé", content: `L'ensemble du contenu publié sous la marque iLingue Relax™, y compris, sans s'y limiter, les livres, livres imprimés, eBooks, fichiers PDF, produits numériques, cours, fiches de travail, matériels pédagogiques, images, graphiques, illustrations, audios, vidéos, contenu du site web et ressources téléchargeables, est protégé par les lois américaines et internationales sur le droit d'auteur.` },
      { icon: ShieldAlert, title: "Titularité des Droits", content: `Sauf indication contraire, tous les droits d'auteur appartiennent à Youtumundial LLC. Aucune partie de ces matériels ne peut être copiée, reproduite, distribuée, traduite, modifiée, stockée, transmise, revendue ou utilisée à des fins commerciales sans l'autorisation écrite préalable de Youtumundial LLC.` },
      { icon: FileText, title: "Licence d'Utilisation", content: `L'achat d'un produit iLingue Relax™ accorde une licence personnelle, non exclusive et non transférable pour un usage individuel uniquement. La propriété intellectuelle demeure la propriété exclusive de Youtumundial LLC.` },
      { icon: Scale, title: "Sanctions en Cas d'Utilisation Non Autorisée", content: `Toute reproduction, distribution ou utilisation commerciale non autorisée peut entraîner des sanctions civiles et pénales en vertu des lois applicables sur le droit d'auteur.` },
    ],
    footerLine1: `© ${new Date().getFullYear()} Youtumundial LLC. Tous droits réservés.`,
    footerLine2: `Publié sous la marque iLingue Relax™.`,
  },
  pt: {
    seoTitle: "Aviso de Copyright - iLingue Relax",
    seoDescription: "Aviso oficial de direitos autorais da iLingue Relax™, marca da Youtumundial LLC.",
    heroTitle: "Aviso de Copyright",
    heroSubtitle: "Direitos autorais de todo o conteúdo publicado sob a marca iLingue Relax™.",
    lastUpdated: `Última atualização: ${new Date().toLocaleDateString("pt-BR", { year: "numeric", month: "long", day: "numeric" })}`,
    sections: [
      { icon: Copyright, title: "Conteúdo Protegido", content: `Todo o conteúdo publicado sob a marca iLingue Relax™, incluindo, entre outros, livros, livros impressos, eBooks, arquivos PDF, produtos digitais, cursos, planilhas, materiais de aprendizagem, imagens, gráficos, ilustrações, áudios, vídeos, conteúdo do site e recursos para download, é protegido pelas leis de direitos autorais dos Estados Unidos e internacionais.` },
      { icon: ShieldAlert, title: "Titularidade dos Direitos", content: `Salvo indicação em contrário, todos os direitos autorais pertencem à Youtumundial LLC. Nenhuma parte destes materiais pode ser copiada, reproduzida, distribuída, traduzida, modificada, armazenada, transmitida, revendida ou utilizada para fins comerciais sem a permissão prévia por escrito da Youtumundial LLC.` },
      { icon: FileText, title: "Licença de Uso", content: `A compra de qualquer produto iLingue Relax™ concede uma licença pessoal, não exclusiva e intransferível somente para uso individual. A titularidade da propriedade intelectual permanece exclusivamente com a Youtumundial LLC.` },
      { icon: Scale, title: "Sanções por Uso Não Autorizado", content: `Qualquer reprodução, distribuição ou uso comercial não autorizado pode resultar em sanções civis e criminais conforme as leis de direitos autorais aplicáveis.` },
    ],
    footerLine1: `© ${new Date().getFullYear()} Youtumundial LLC. Todos os direitos reservados.`,
    footerLine2: `Publicado sob a marca iLingue Relax™.`,
  },
};

const CopyrightPage = () => {
  const { language } = useI18n();
  const lang = (["es", "en", "fr", "pt"].includes(language) ? language : "es") as "es" | "en" | "fr" | "pt";
  const c = CONTENT[lang];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={c.seoTitle}
        description={c.seoDescription}
        canonicalUrl="https://ilinguerelax.com/copyright"
        keywords="copyright iLingue Relax, derechos de autor Youtumundial, aviso de copyright"
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

export default CopyrightPage;
