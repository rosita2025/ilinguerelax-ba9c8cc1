import { Link } from "react-router-dom";
import logoIlingueRelax from "@/assets/logo-ilingue-relax.png";

export const Footer = () => {
  return (
    <footer className="py-12 bg-foreground">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-3">
            <img 
              src={logoIlingueRelax} 
              alt="iLingue Relax" 
              className="h-10 w-auto"
            />
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

          <p className="text-sm text-primary-foreground/50">
            © 2026 iLingue Relax. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};