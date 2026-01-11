import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logoIlingue from "@/assets/logo-ilingue.png";

export const Navbar = () => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="container px-4 md:px-6 py-4">
        <nav className="flex items-center justify-between bg-card/80 backdrop-blur-lg rounded-2xl px-6 py-3 border border-border shadow-card">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img 
              src={logoIlingue} 
              alt="iLingue Relax" 
              className="h-10 w-auto"
            />
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className="text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Home
            </Link>
            <Link
              to="/productos"
              className="text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Productos
            </Link>
            <button
              onClick={() => scrollToSection("sobre-mi")}
              className="text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Sobre Mí
            </button>
            <button
              onClick={() => scrollToSection("contacto")}
              className="text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Contacto
            </button>
          </div>

          {/* CTA */}
          <Link to="/productos">
            <Button variant="hero" size="default">
              Ver Productos
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
};
