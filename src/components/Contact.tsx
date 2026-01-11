import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MessageSquare, Send, Instagram, Facebook } from "lucide-react";
import { toast } from "sonner";

export const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    if (formData.name.length > 100 || formData.email.length > 255 || formData.message.length > 1000) {
      toast.error("Uno o más campos exceden el límite de caracteres");
      return;
    }

    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    toast.success("¡Mensaje enviado! Te responderemos pronto.");
    setFormData({ name: "", email: "", message: "" });
    setIsSubmitting(false);
  };

  return (
    <section id="contacto" className="py-20 md:py-28">
      <div className="container px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
              <MessageSquare className="w-4 h-4" />
              Estamos aquí para ayudarte
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Contáctanos
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              ¿Tienes preguntas sobre nuestros productos? Escríbenos y te responderemos lo antes posible.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-card rounded-2xl border border-border shadow-card p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                    Nombre
                  </label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Tu nombre"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    maxLength={100}
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    maxLength={255}
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                    Mensaje
                  </label>
                  <Textarea
                    id="message"
                    placeholder="¿En qué podemos ayudarte?"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    maxLength={1000}
                    rows={4}
                    className="w-full resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-right">
                    {formData.message.length}/1000
                  </p>
                </div>

                <Button 
                  type="submit" 
                  variant="hero" 
                  size="lg" 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    "Enviando..."
                  ) : (
                    <>
                      Enviar Mensaje
                      <Send className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-6">
              <div className="bg-card rounded-2xl border border-border shadow-card p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">Email</h3>
                    <p className="text-muted-foreground">contacto@ilinguerelax.com</p>
                    <p className="text-sm text-muted-foreground mt-1">Respondemos en 24-48 horas</p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-2xl border border-border shadow-card p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Síguenos</h3>
                <div className="flex gap-4">
                  <a 
                    href="https://www.instagram.com/ilinguerelax/" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-xl bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors"
                    aria-label="Instagram @ilinguerelax"
                  >
                    <Instagram className="w-5 h-5 text-foreground" />
                  </a>
                  <a 
                    href="https://web.facebook.com/ilinguerelax/" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-xl bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors"
                    aria-label="Facebook iLingue Relax"
                  >
                    <Facebook className="w-5 h-5 text-foreground" />
                  </a>
                </div>
              </div>

              <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-6 border border-primary/20">
                <h3 className="text-lg font-semibold text-foreground mb-2">¿Necesitas ayuda rápida?</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Consulta nuestras preguntas frecuentes para respuestas inmediatas.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a href="/productos">Ver FAQ</a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
