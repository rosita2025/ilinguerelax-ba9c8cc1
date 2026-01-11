import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import logoIlingue from "@/assets/logo-ilingue.png";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMenuOpen(false);
  };

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="relative z-50">
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

          {/* Desktop Navigation Links */}
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
            <Link
              to="/sobre-nosotros"
              className="text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Sobre Nosotros
            </Link>
            <Link
              to="/contacto"
              className="text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Contacto
            </Link>
            <Link
              to="/faq"
              className="text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              FAQ
            </Link>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/productos">
              <Button variant="hero" size="default">
                Comenzar Ahora
              </Button>
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-foreground hover:bg-secondary rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-2 bg-card/95 backdrop-blur-lg rounded-2xl border border-border shadow-card p-4 animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-2">
              <Link
                to="/"
                onClick={handleLinkClick}
                className="px-4 py-3 text-foreground hover:bg-secondary rounded-xl transition-colors font-medium"
              >
                Home
              </Link>
              <Link
                to="/productos"
                onClick={handleLinkClick}
                className="px-4 py-3 text-foreground hover:bg-secondary rounded-xl transition-colors font-medium"
              >
                Productos
              </Link>
              <Link
                to="/sobre-nosotros"
                onClick={handleLinkClick}
                className="px-4 py-3 text-foreground hover:bg-secondary rounded-xl transition-colors font-medium"
              >
                Sobre Nosotros
              </Link>
              <Link
                to="/contacto"
                onClick={handleLinkClick}
                className="px-4 py-3 text-foreground hover:bg-secondary rounded-xl transition-colors font-medium"
              >
                Contacto
              </Link>
              <Link
                to="/faq"
                onClick={handleLinkClick}
                className="px-4 py-3 text-foreground hover:bg-secondary rounded-xl transition-colors font-medium"
              >
                FAQ
              </Link>
              <div className="pt-2 border-t border-border mt-2">
                <Link to="/productos" onClick={handleLinkClick}>
                  <Button variant="hero" size="default" className="w-full">
                    Comenzar Ahora
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
