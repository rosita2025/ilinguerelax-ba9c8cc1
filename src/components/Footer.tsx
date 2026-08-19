import { Link } from "react-router-dom";
import { Instagram, Facebook } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { CountryPicker } from "@/components/CountryPicker";


export const Footer = () => {
  const { language } = useI18n();

  const content = {
    es: {
      brand: "iLingue Relax",
      services: "SERVICIOS",
      categories: "CATEGORÍAS",
      community: "COMUNIDAD",
      about: "Sobre Nosotros",
      contact: "Contacto",
      faq: "Preguntas Frecuentes",
      shipping: "Envíos y Entregas",
      returns: "Devoluciones y Reembolsos",
      help: "Centro de Ayuda",
      terms: "Términos y Condiciones",
      privacy: "Política de Privacidad",
      copyright: "Aviso de Copyright",
      trademark: "Aviso de Marca",
      licenses: "Licencias y Avisos Legales",
      blog: "Blog",
      reviews: "Dejar Reseña",
      myOrder: "Mi Pedido",
      products: "Todos los Productos",
      english: "English",
      spanish: "Español",
      peru: "Perú",
      other: "Otros Idiomas",
      rights: "Todos los derechos reservados",
      tagline: "Aprende idiomas sin estrés — con pronunciación real.",
    },
    en: {
      brand: "iLingue Relax",
      services: "SERVICES",
      categories: "CATEGORIES",
      community: "COMMUNITY",
      about: "About Us",
      contact: "Contact",
      faq: "FAQ",
      shipping: "Shipping & Delivery",
      returns: "Returns & Refunds",
      help: "Help Center",
      terms: "Terms & Conditions",
      privacy: "Privacy Policy",
      copyright: "Copyright Notice",
      trademark: "Trademark Notice",
      licenses: "Licenses & Legal Notices",
      blog: "Blog",
      reviews: "Leave a Review",
      myOrder: "My Order",
      products: "All Products",
      english: "English",
      spanish: "Spanish",
      peru: "Peru",
      other: "Other Languages",
      rights: "All Rights Reserved",
      tagline: "Learn languages stress-free — with real pronunciation.",
    },
    fr: {
      brand: "iLingue Relax",
      services: "SERVICES",
      categories: "CATÉGORIES",
      community: "COMMUNAUTÉ",
      about: "À Propos",
      contact: "Contact",
      faq: "FAQ",
      shipping: "Livraison",
      returns: "Retours et Remboursements",
      help: "Centre d'Aide",
      terms: "Conditions Générales",
      privacy: "Politique de Confidentialité",
      copyright: "Avis de Copyright",
      trademark: "Avis de Marque",
      licenses: "Licences et Mentions Légales",
      blog: "Blog",
      reviews: "Laisser un Avis",
      myOrder: "Ma Commande",
      products: "Tous les Produits",
      english: "Anglais",
      spanish: "Espagnol",
      peru: "Pérou",
      other: "Autres Langues",
      rights: "Tous droits réservés",
      tagline: "Apprenez les langues sans stress — avec vraie prononciation.",
    },
    pt: {
      brand: "iLingue Relax",
      services: "SERVIÇOS",
      categories: "CATEGORIAS",
      community: "COMUNIDADE",
      about: "Sobre Nós",
      contact: "Contato",
      faq: "Perguntas Frequentes",
      shipping: "Envio e Entrega",
      returns: "Devoluções e Reembolsos",
      help: "Central de Ajuda",
      terms: "Termos e Condições",
      privacy: "Política de Privacidade",
      copyright: "Aviso de Copyright",
      trademark: "Aviso de Marca",
      licenses: "Licenças e Avisos Legais",
      blog: "Blog",
      reviews: "Deixar Avaliação",
      myOrder: "Meu Pedido",
      products: "Todos os Produtos",
      english: "Inglês",
      spanish: "Espanhol",
      peru: "Peru",
      other: "Outros Idiomas",
      rights: "Todos os direitos reservados",
      tagline: "Aprenda idiomas sem estresse — com pronúncia real.",
    },
  };

  const c = content[language];
  const year = new Date().getFullYear();

  const columns = [
    {
      title: c.brand,
      links: [
        { to: "/sobre-nosotros", label: c.about },
        { to: "/blog", label: c.blog },
        { to: "/dejar-resena", label: c.reviews },
        { to: "/sitemap.xml", label: "Sitemap", external: true },
      ],
    },
    {
      title: c.services,
      links: [
        { to: "/mi-pedido", label: c.myOrder },
        { to: "/contacto", label: c.contact },
        { to: "/faq", label: c.faq },
        { to: "/envios-y-entregas", label: c.shipping },
        { to: "/devoluciones-y-reembolsos", label: c.returns },
        { to: "/condiciones", label: c.terms },
        { to: "/privacidad", label: c.privacy },
        { to: "/copyright", label: c.copyright },
        { to: "/trademark", label: c.trademark },
        { to: "/licencias-y-avisos-legales", label: c.licenses },
      ],
    },
    {
      title: c.categories,
      links: [
        { to: "/products", label: c.products },
        { to: "/aprender/ingles-espanol", label: c.english },
        { to: "/aprender/espanol-ingles", label: c.spanish },
        { to: "/aprender/peru", label: c.peru },
        { to: "/aprender", label: c.other },
      ],
    },
    {
      title: c.community,
      links: [
        {
          to: "https://www.instagram.com/ilinguerelax/",
          label: "Instagram",
          external: true,
        },
        {
          to: "https://web.facebook.com/ilinguerelax/",
          label: "Facebook",
          external: true,
        },
        {
          to: "https://wa.me/12512724704",
          label: "WhatsApp",
          external: true,
        },
      ],
    },
  ];

  return (
    <footer className="bg-foreground text-primary-foreground w-full max-w-full overflow-hidden pb-24 md:pb-8 pt-8 px-4 box-border">
      <div className="container px-4 md:px-6 py-14 w-full max-w-full overflow-hidden">
        {/* Brand row */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 pb-8 border-b border-primary-foreground/10">
          <Link to="/" className="flex flex-col">
            <span className="text-2xl font-bold tracking-tight">
              iLingue <span className="font-light">Relax</span>
            </span>
            <span className="text-sm text-primary-foreground/60 mt-1 max-w-md">
              {c.tagline}
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <a
              href="https://www.instagram.com/ilinguerelax/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center text-primary-foreground/70 hover:bg-primary-foreground/20 hover:text-primary-foreground transition-all"
              aria-label="Instagram @ilinguerelax"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="https://web.facebook.com/ilinguerelax/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center text-primary-foreground/70 hover:bg-primary-foreground/20 hover:text-primary-foreground transition-all"
              aria-label="Facebook iLingue Relax"
            >
              <Facebook className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-bold tracking-wider mb-4 text-primary-foreground">
                {col.title}
              </h3>
              <ul className="space-y-2.5 text-sm text-primary-foreground/70">
                {col.links.map((link) =>
                  link.external ? (
                    <li key={link.label}>
                      <a
                        href={link.to}
                        target={link.to.startsWith("http") ? "_blank" : undefined}
                        rel={link.to.startsWith("http") ? "noopener noreferrer" : undefined}
                        className="hover:text-primary-foreground transition-colors"
                      >
                        {link.label}
                      </a>
                    </li>
                  ) : (
                    <li key={link.label}>
                      <Link
                        to={link.to}
                        className="hover:text-primary-foreground transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-6 border-t border-primary-foreground/10 text-center space-y-2">
          <div className="flex justify-center px-2">
            <CountryPicker lang={language === "en" ? "en" : "es"} className="!text-primary-foreground/70 hover:!text-primary-foreground hover:!bg-primary-foreground/5" />
          </div>
          <p className="text-sm text-primary-foreground/50">
            © {year} iLingue Relax. All rights reserved.
          </p>
          <p className="text-xs text-primary-foreground/40">
            iLingue Relax™ is a registered trademark.
          </p>

        </div>

      </div>
    </footer>
  );
};
