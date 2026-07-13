import { Link } from "react-router-dom";
import { Instagram, Facebook } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";

export const Footer = () => {
  const { t, language } = useI18n();

  const content = {
    es: {
      products: "Productos",
      about: "Sobre Nosotros",
      contact: "Contacto",
      privacy: "Privacidad",
      terms: "Condiciones",
      rights: "Todos los derechos reservados",
    },
    en: {
      products: "Products",
      about: "About Us",
      contact: "Contact",
      privacy: "Privacy",
      terms: "Terms",
      rights: "All rights reserved",
    },
    fr: {
      products: "Produits",
      about: "À Propos",
      contact: "Contact",
      privacy: "Confidentialité",
      terms: "Conditions",
      rights: "Tous droits réservés",
    },
    pt: {
      products: "Produtos",
      about: "Sobre Nós",
      contact: "Contato",
      privacy: "Privacidade",
      terms: "Termos",
      rights: "Todos os direitos reservados",
    },
  };

  const c = content[language];

  return (
    <footer className="py-12 bg-foreground">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Link to="/" className="flex items-center">
            <span className="text-xl font-bold text-primary-foreground tracking-tight">
              iLingue <span className="font-light">Relax</span>
            </span>
          </Link>

          <nav className="flex flex-wrap justify-center gap-4 md:gap-6 text-sm text-primary-foreground/70">
            <Link to="/products" className="hover:text-primary-foreground transition-colors">
              {c.products}
            </Link>
            <Link to="/sobre-nosotros" className="hover:text-primary-foreground transition-colors">
              {c.about}
            </Link>
            <Link to="/contacto" className="hover:text-primary-foreground transition-colors">
              {c.contact}
            </Link>
            <Link to="/faq" className="hover:text-primary-foreground transition-colors">
              FAQ
            </Link>
            <Link to="/privacidad" className="hover:text-primary-foreground transition-colors">
              {c.privacy}
            </Link>
            <Link to="/condiciones" className="hover:text-primary-foreground transition-colors">
              {c.terms}
            </Link>
          </nav>

          <div className="flex items-center gap-4">
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

        <div className="mt-8 pt-6 border-t border-primary-foreground/10 text-center space-y-1">
          <p className="text-sm text-primary-foreground/50">
            © {new Date().getFullYear()} Youtumundial LLC. All Rights Reserved.
          </p>
          <p className="text-xs text-primary-foreground/40">
            iLingue Relax™ is a trademark of Youtumundial LLC.
          </p>
        </div>

      </div>
    </footer>
  );
};
