export const Footer = () => {
  return <footer className="py-12 bg-foreground">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">i</span>
            </div>
            <span className="text-primary-foreground font-semibold text-lg">
              iLingue Relax
            </span>
          </div>

          <nav className="flex flex-wrap justify-center gap-6 text-sm text-primary-foreground/70">
            <a href="#" className="hover:text-primary-foreground transition-colors">
              Términos
            </a>
            <a href="#" className="hover:text-primary-foreground transition-colors">
              Privacidad
            </a>
            <a href="#" className="hover:text-primary-foreground transition-colors">
              Contacto
            </a>
            <a href="#" className="hover:text-primary-foreground transition-colors">
              FAQ
            </a>
          </nav>

          <p className="text-sm text-primary-foreground/50">
            © 2026 iLingue Relax. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>;
};