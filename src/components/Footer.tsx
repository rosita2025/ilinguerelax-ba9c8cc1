import { Link } from "react-router-dom";
import { Instagram, Facebook } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="py-12 bg-foreground">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Link to="/" className="flex items-center">
            <span className="text-xl font-bold text-primary-foreground tracking-tight">
              iLingue <span className="font-light">Relax</span>
            </span>
          </Link>

          <nav className="flex flex-wrap justify-center gap-6 text-sm text-primary-foreground/70">
            <Link to="/productos" className="hover:text-primary-foreground transition-colors">
              Productos
            </Link>
            <Link to="/sobre-nosotros" className="hover:text-primary-foreground transition-colors">
              Sobre Nosotros
            </Link>
            <Link to="/contacto" className="hover:text-primary-foreground transition-colors">
              Contacto
            </Link>
            <Link to="/faq" className="hover:text-primary-foreground transition-colors">
              FAQ
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

        <div className="mt-8 pt-6 border-t border-primary-foreground/10 text-center">
          <p className="text-sm text-primary-foreground/50">
            © 2026 iLingue Relax. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};