import { Button } from "@/components/ui/button";

export const Navbar = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="container px-4 md:px-6 py-4">
        <nav className="flex items-center justify-between bg-card/80 backdrop-blur-lg rounded-2xl px-6 py-3 border border-border shadow-card">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">i</span>
            </div>
            <span className="font-semibold text-lg text-foreground hidden sm:block">
              iLingue Relax
            </span>
          </div>

          {/* CTA */}
          <Button variant="hero" size="default">
            Comenzar Ahora
          </Button>
        </nav>
      </div>
    </header>
  );
};
