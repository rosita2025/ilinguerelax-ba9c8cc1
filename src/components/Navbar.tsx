import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { CartDrawer } from "@/components/CartDrawer";
import { LanguageCurrencySelector } from "@/components/LanguageCurrencySelector";
import { useI18n } from "@/i18n/I18nContext";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t, language } = useI18n();
  const myOrderLabel =
    { es: "Mi Pedido", en: "My Order", fr: "Ma Commande", pt: "Meu Pedido" }[language] ?? "Mi Pedido";

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
      <div className="container px-4 md:px-4 py-2">
        <nav className="flex items-center justify-between bg-card/80 backdrop-blur-lg rounded-2xl px-4 py-2 border border-border shadow-card">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-foreground tracking-tight">
              iLingue <span className="font-light">Relax</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-4 xl:gap-6">
            <Link
              to="/"
              className="text-sm xl:text-base text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              {t.nav.home}
            </Link>
            <Link
              to="/products"
              className="text-sm xl:text-base text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              {t.nav.products}
            </Link>
            <Link
              to="/sobre-nosotros"
              className="text-sm xl:text-base text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              {t.nav.about}
            </Link>
            <Link
              to="/contacto"
              className="text-sm xl:text-base text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              {t.nav.contact}
            </Link>
            <Link
              to="/faq"
              className="text-sm xl:text-base text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              {t.nav.faq}
            </Link>
            <Link
              to="/blog"
              className="text-sm xl:text-base text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              {t.nav.blog}
            </Link>
            <Link
              to="/mi-pedido"
              className="text-sm xl:text-base text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              {myOrderLabel}
            </Link>
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-2">
            <LanguageCurrencySelector />
            <CartDrawer />
            <Link to="/products">
              <Button variant="hero" size="default" className="text-sm xl:text-base px-4 xl:px-6">
                {t.hero.cta}
              </Button>
            </Link>
          </div>

          {/* Mobile Actions: Cart + Hamburger */}
          <div className="lg:hidden flex items-center gap-2">
            <CartDrawer />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-foreground hover:bg-secondary rounded-lg transition-colors border border-border"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden mt-2 bg-card/95 backdrop-blur-lg rounded-2xl border border-border shadow-card p-4 animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-2">
              {/* Language/Currency Selector in Mobile */}
              <div className="px-4 py-2 border-b border-border mb-2">
                <LanguageCurrencySelector />
              </div>
              <Link
                to="/"
                onClick={handleLinkClick}
                className="px-4 py-3 text-foreground hover:bg-secondary rounded-xl transition-colors font-medium"
              >
                {t.nav.home}
              </Link>
              <Link
                to="/products"
                onClick={handleLinkClick}
                className="px-4 py-3 text-foreground hover:bg-secondary rounded-xl transition-colors font-medium"
              >
                {t.nav.products}
              </Link>
              <Link
                to="/sobre-nosotros"
                onClick={handleLinkClick}
                className="px-4 py-3 text-foreground hover:bg-secondary rounded-xl transition-colors font-medium"
              >
                {t.nav.about}
              </Link>
              <Link
                to="/contacto"
                onClick={handleLinkClick}
                className="px-4 py-3 text-foreground hover:bg-secondary rounded-xl transition-colors font-medium"
              >
                {t.nav.contact}
              </Link>
              <Link
                to="/faq"
                onClick={handleLinkClick}
                className="px-4 py-3 text-foreground hover:bg-secondary rounded-xl transition-colors font-medium"
              >
                {t.nav.faq}
              </Link>
              <Link
                to="/blog"
                onClick={handleLinkClick}
                className="px-4 py-3 text-foreground hover:bg-secondary rounded-xl transition-colors font-medium"
              >
                {t.nav.blog}
              </Link>
              <Link
                to="/mi-pedido"
                onClick={handleLinkClick}
                className="px-4 py-3 text-foreground hover:bg-secondary rounded-xl transition-colors font-medium"
              >
                {myOrderLabel}
              </Link>
              <div className="pt-2 border-t border-border mt-2">
                <Link to="/products" onClick={handleLinkClick}>
                  <Button variant="hero" size="default" className="w-full">
                    {t.hero.cta}
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
