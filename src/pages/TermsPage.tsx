import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { FileText, ShoppingCart, RotateCcw, BookOpen, Scale, AlertTriangle, Copyright, Gavel } from "lucide-react";
import { WhatsAppButton } from "@/components/WhatsAppButton";

const sections = [
  {
    icon: FileText,
    title: "Aceptación de los Términos",
    content: `Al acceder y utilizar el sitio web de iLingue Relax (ilinguerelax.com) y adquirir nuestros productos, aceptas estos términos y condiciones en su totalidad. Si no estás de acuerdo con alguna parte de estos términos, te pedimos que no utilices nuestros servicios.

Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en vigor inmediatamente después de su publicación. Te recomendamos revisar esta página periódicamente.`
  },
  {
    icon: ShoppingCart,
    title: "Productos y Servicios",
    content: `iLingue Relax ofrece productos educativos digitales (ebooks, guías PDF, audios) y libros físicos disponibles próximamente a través de la tienda de Amazon. Todos los productos digitales son de descarga inmediata una vez completado el pago.

• Productos digitales vendidos a través de Hotmart (Latinoamérica): la entrega y el acceso se realizan directamente dentro de la plataforma de Hotmart una vez confirmado el pago.
• Productos digitales vendidos en la tienda de iLingue Relax (Stripe, Mercado Pago, Yape/Plin): la entrega se realiza mediante una página web de descarga protegida por contraseña. La contraseña se envía por correo electrónico de forma automática (pagos con Stripe y Mercado Pago) o de forma manual (pagos con Yape/Plin, una vez que la Supervisora de Pagos verifica el comprobante en un plazo de 1 a 24 horas).
• Libros físicos: próximamente disponibles a través de la tienda de Amazon; los tiempos de entrega, envío y devoluciones se rigen por las políticas de Amazon y sus socios logísticos.
• Disponibilidad: nos reservamos el derecho de modificar, suspender o discontinuar cualquier producto sin previo aviso.`
  },
  {
    icon: BookOpen,
    title: "Licencia de Uso (Productos Digitales)",
    content: `Al adquirir un producto digital de iLingue Relax, recibes una licencia personal, no exclusiva y no transferible para usar el contenido:

✓ Uso permitido: descargar y usar el contenido para tu aprendizaje personal. Puedes imprimir copias para uso personal y no comercial.

✗ Uso prohibido:
  • Revender, redistribuir o compartir los archivos con terceros.
  • Subir el contenido a sitios web, foros, redes sociales o plataformas de intercambio de archivos.
  • Modificar, adaptar o crear trabajos derivados para distribución.
  • Usar el contenido con fines comerciales sin autorización escrita.

El incumplimiento de estas condiciones puede resultar en la cancelación de tu acceso y acciones legales por violación de derechos de autor.`
  },
  {
    icon: RotateCcw,
    title: "Política de Reembolsos y Garantía",
    content: `Para productos digitales:
• Ofrecemos una garantía de 7 días desde la fecha de compra. Si el producto no cumple con tus expectativas, puedes solicitar un reembolso completo contactándonos en hola@ilinguerelax.com.
• El reembolso se procesará al método de pago original en un plazo de 5 a 10 días hábiles.
• Nos reservamos el derecho de denegar reembolsos en casos de abuso de la política (múltiples solicitudes del mismo usuario).

Para libros físicos (próximamente en Amazon):
• Las devoluciones, cambios y reclamos por daños en el envío se gestionan directamente según la política vigente de la tienda de Amazon.`
  },
  {
    icon: Scale,
    title: "Precios y Pagos",
    content: `• Todos los precios mostrados en el sitio pueden aparecer en USD o en tu moneda local (según detección automática de país por IP). Los precios locales son aproximaciones y pueden variar ligeramente según la tasa de cambio del día del pago aplicada por el procesador.
• Los pagos se procesan de forma segura a través de los siguientes proveedores autorizados:
   – Stripe: tarjetas de crédito/débito (Visa, Mastercard, Amex), Apple Pay, Google Pay y Link. Disponible en Latinoamérica, Norteamérica, Europa, Asia y Oceanía con conversión automática a tu moneda local.
   – Mercado Pago: transferencias bancarias (BCP, BBVA, Interbank, Scotiabank), PagoEfectivo, Western Union, Tambo y Kasnet. Disponible únicamente desde Perú.
   – Yape y Plin: pago manual desde Perú al número privado de nuestra Supervisora de Pagos, mostrado únicamente durante el proceso de checkout. Verificación en 1 a 24 horas.
   – Hotmart: procesa pagos únicamente en Latinoamérica con múltiples métodos locales, incluyendo Nequi (Colombia), PIX (Brasil), OXXO (México), Boleto, tarjetas locales y transferencias bancarias regionales.
   – Amazon: procesa los pagos de los libros físicos (próximamente) directamente en su plataforma.
   – Próximamente: dLocal y eBanx para ampliar cobertura de métodos de pago locales en América Latina, África, Asia y Medio Oriente.
• Los precios están sujetos a cambio sin previo aviso. Las promociones y descuentos tienen fechas de vigencia específicas.
• Los impuestos aplicables (IVA, GST, IGV, etc.) se calculan según la legislación de tu país y se muestran en el checkout antes de confirmar la compra.`

  },
  {
    icon: Copyright,
    title: "Propiedad Intelectual",
    content: `Todo el contenido del sitio web y los productos de iLingue Relax (textos, imágenes, diseños, logotipos, audios, marcas) está protegido por derechos de autor, marcas registradas y otras leyes de propiedad intelectual.

• iLingue Relax® y nuestro logotipo son marcas registradas.
• El contenido de nuestros ebooks y guías es propiedad exclusiva de iLingue Relax.
• Queda estrictamente prohibida la reproducción, distribución o comunicación pública sin autorización previa por escrito.`
  },
  {
    icon: AlertTriangle,
    title: "Limitación de Responsabilidad",
    content: `iLingue Relax proporciona materiales educativos de calidad, pero no garantiza resultados específicos de aprendizaje. El progreso depende del esfuerzo y dedicación individual de cada usuario.

• No somos responsables por daños indirectos, incidentales o consecuenciales derivados del uso de nuestros productos o sitio web.
• No garantizamos que el sitio esté libre de errores o disponible ininterrumpidamente.
• Las recomendaciones y ejemplos de pronunciación son orientativas y pueden variar según el acento o dialecto regional.`
  },
  {
    icon: Gavel,
    title: "Ley Aplicable y Resolución de Disputas",
    content: `Estos términos se rigen por las leyes del Estado de Nuevo México, Estados Unidos, sin considerar sus principios de conflicto de leyes.

• Antes de iniciar cualquier acción legal, ambas partes se comprometen a intentar resolver cualquier disputa de buena fe mediante negociación directa.
• Si no se alcanza una solución, las disputas se resolverán mediante arbitraje vinculante de conformidad con las reglas de la Asociación Americana de Arbitraje (AAA).
• Cualquier acción legal debe iniciarse dentro de los 12 meses siguientes a la causa de la reclamación.`
  },
];

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Condiciones de Uso - iLingue Relax"
        description="Lee los términos y condiciones de uso de iLingue Relax. Política de reembolsos, licencias de productos digitales y derechos de autor."
        canonicalUrl="https://ilinguerelax.com/condiciones"
        keywords="términos y condiciones iLingue Relax, condiciones de uso, política de reembolso, licencia productos digitales"
      />
      <Navbar />

      {/* Hero */}
      <motion.section
        className="pt-32 pb-16 gradient-hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="container px-4 md:px-6">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4">
              Condiciones de Uso
            </h1>
            <p className="text-lg text-primary-foreground/90">
              Términos y condiciones que rigen el uso de nuestros servicios y productos.
            </p>
            <p className="text-sm text-primary-foreground/70 mt-4">
              Última actualización: 9 de julio de 2026
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Content */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto space-y-12">
            {sections.map((section, index) => (
              <motion.div
                key={section.title}
                className="bg-card rounded-2xl border border-border shadow-card p-6 md:p-8"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <section.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-foreground mb-3">
                      {section.title}
                    </h2>
                    <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                      {section.content}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
</div>
  );
};

export default TermsPage;
