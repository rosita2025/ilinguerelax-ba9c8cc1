import { Check, X } from "lucide-react";

const comparisonData = [
  { feature: "5,000+ palabras con pronunciación", us: true, others: false },
  { feature: "Fonética para hispanohablantes", us: true, others: false },
  { feature: "Acentos UK y USA incluidos", us: true, others: false },
  { feature: "Acceso de por vida", us: true, others: true },
  { feature: "Actualizaciones gratuitas", us: true, others: false },
  { feature: "4 Bonus gratuitas incluidas", us: true, others: false },
  { feature: "Garantía de devolución 30 días", us: true, others: false },
  { feature: "Precio accesible", us: true, others: false },
];

export const ComparisonTable = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            📊 Comparativa
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            ¿Por qué elegirnos?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Mira cómo nos comparamos con otros cursos y libros de inglés
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-3 bg-muted/50 border-b border-border">
              <div className="p-4 md:p-6 font-semibold text-foreground">
                Características
              </div>
              <div className="p-4 md:p-6 text-center border-l border-border">
                <div className="inline-block px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  iLingue Relax
                </div>
              </div>
              <div className="p-4 md:p-6 text-center border-l border-border font-semibold text-muted-foreground">
                Otros cursos
              </div>
            </div>

            {/* Rows */}
            {comparisonData.map((row, index) => (
              <div 
                key={index}
                className={`grid grid-cols-3 ${index !== comparisonData.length - 1 ? 'border-b border-border' : ''}`}
              >
                <div className="p-4 md:p-5 text-sm md:text-base text-foreground">
                  {row.feature}
                </div>
                <div className="p-4 md:p-5 flex justify-center items-center border-l border-border bg-green-500/5">
                  {row.us ? (
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                      <X className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <div className="p-4 md:p-5 flex justify-center items-center border-l border-border">
                  {row.others ? (
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                      <X className="w-4 h-4 text-red-500" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
