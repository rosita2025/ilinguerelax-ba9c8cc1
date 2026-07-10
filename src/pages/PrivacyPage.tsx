import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { Shield, Lock, Eye, Database, Mail, UserCheck, Cookie, Globe } from "lucide-react";
import { WhatsAppButton } from "@/components/WhatsAppButton";

const sections = [
  {
    icon: Shield,
    title: "Información que Recopilamos",
    content: `Recopilamos la información necesaria para brindarte nuestros servicios y productos digitales:

• Datos de contacto: nombre, correo electrónico y número de teléfono (cuando nos contactas o realizas una compra).
• Información de pago: procesada de forma segura por nuestros proveedores autorizados (Stripe, Mercado Pago, Yape/Plin, Hotmart y Amazon). No almacenamos datos completos de tarjetas de crédito ni credenciales bancarias en nuestros servidores.
• Datos de navegación: dirección IP, país de origen, tipo de dispositivo y comportamiento en el sitio (páginas visitadas, tiempo de sesión), recopilados mediante cookies y herramientas de análisis como Meta Pixel y Google Analytics.
• Preferencias de idioma y moneda: para personalizar tu experiencia de compra.`
  },
  {
    icon: Lock,
    title: "Uso de la Información",
    content: `Utilizamos tu información para los siguientes fines:

• Procesar y entregar tus pedidos de productos digitales.
• Enviar confirmaciones de compra, accesos a contenido y comunicaciones relacionadas con tu orden.
• Brindar soporte al cliente y responder a tus consultas.
• Personalizar tu experiencia: mostrar precios en tu moneda local y contenido en tu idioma.
• Medir el rendimiento de nuestras campañas publicitarias (Meta Pixel, solo con tu consentimiento en países de la UE).
• Enviar comunicaciones promocionales y ofertas especiales (puedes darte de baja en cualquier momento).`
  },
  {
    icon: Eye,
    title: "Compartición de Datos",
    content: `No vendemos ni alquilamos tu información personal. Solo compartimos datos con:

• Proveedores de pago autorizados:
   – Stripe (SSL) – tarjetas de crédito/débito internacionales, Apple Pay, Google Pay y Link. Cobertura global (Latinoamérica, Norteamérica, Europa, Asia, Oceanía) con conversión automática a moneda local.
   – Mercado Pago – transferencias bancarias (BCP, BBVA, Interbank, Scotiabank), PagoEfectivo, Western Union, Tambo y Kasnet. Disponible desde Perú y otros países de Latinoamérica.
   – Yape y Plin – pago manual desde Perú al número privado de nuestra Supervisora de Pagos (mostrado únicamente durante el checkout). Verificación en 1-24h.
   – Hotmart – procesa pagos en Latinoamérica con métodos locales como Nequi (Colombia), PIX (Brasil), OXXO (México), Boleto, tarjetas locales y transferencias regionales.
   – Amazon – procesa los pagos de los libros físicos (próximamente) directamente en su plataforma.
   – Próximamente: dLocal y eBanx para ampliar métodos de pago locales en América Latina, África, Asia y Medio Oriente.
• Servicios de email: Brevo y Resend, para enviar correos transaccionales y promocionales.
• Análisis y publicidad: Meta (Facebook/Instagram) y Google, solo datos agregados o anonimizados para medición de campañas.
• Cumplimiento legal: cuando sea requerido por ley o para proteger nuestros derechos legales.

Todos nuestros proveedores cumplen con estándares de seguridad y protección de datos (GDPR, CCPA, PCI-DSS cuando aplica).`

  },
  {
    icon: Database,
    title: "Almacenamiento y Seguridad",
    content: `Tus datos se almacenan en servidores seguros de Supabase (infraestructura cloud con encriptación en tránsito y en reposo). Implementamos medidas de seguridad técnicas y organizativas para proteger tu información contra acceso no autorizado, alteración, divulgación o destrucción.

Los productos digitales se entregan mediante links de descarga únicos o acceso a plataformas seguras (Hotmart). Los libros físicos estarán disponibles próximamente a través de la tienda de Amazon y se envían mediante sus socios logísticos.`
  },
  {
    icon: Cookie,
    title: "Cookies y Tecnologías Similares",
    content: `Utilizamos cookies para:

• Funcionalidad esencial: mantener tu sesión de carrito de compras y preferencias de idioma/moneda.
• Análisis: entender cómo los visitantes usan nuestro sitio y mejorar la experiencia.
• Publicidad: medir la efectividad de nuestros anuncios en Meta e Instagram (solo con consentimiento en la UE).

Puedes gestionar tus preferencias de cookies mediante el banner de consentimiento que aparece al visitar el sitio, o a través de la configuración de tu navegador.`
  },
  {
    icon: UserCheck,
    title: "Tus Derechos",
    content: `Dependiendo de tu ubicación, tienes derechos sobre tus datos personales:

• Acceso: solicitar una copia de la información que tenemos sobre ti.
• Rectificación: corregir datos inexactos o incompletos.
• Eliminación: solicitar la eliminación de tus datos personales.
• Oposición: oponerte al procesamiento de tus datos para fines de marketing.
• Portabilidad: recibir tus datos en un formato estructurado y transferirlos a otro servicio.

Para ejercer estos derechos, contáctanos en hola@ilinguerelax.com.`
  },
  {
    icon: Globe,
    title: "Transferencias Internacionales",
    content: `iLingue Relax opera desde los Estados Unidos y utiliza proveedores de servicios en distintas jurisdicciones (EE.UU., Europa, etc.). Cuando transferimos datos fuera de tu país, nos aseguramos de que existan salvaguardias adecuadas (cláusulas contractuales tipo, certificaciones de privacidad) para proteger tu información.`
  },
  {
    icon: Mail,
    title: "Contacto y Cambios",
    content: `Si tienes preguntas sobre esta política de privacidad o deseas ejercer tus derechos, contáctanos:

• Email: hola@ilinguerelax.com
• WhatsApp: +1 251 272 4704

Esta política puede actualizarse ocasionalmente. Publicaremos cualquier cambio en esta página con la fecha de última actualización.`
  },
];

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Política de Privacidad - iLingue Relax"
        description="Conoce cómo iLingue Relax recopila, utiliza y protege tu información personal. Productos digitales seguros y compras protegidas."
        canonicalUrl="https://ilinguerelax.com/privacidad"
        keywords="política de privacidad iLingue Relax, protección de datos, cookies, GDPR, derechos del usuario"
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
              Política de Privacidad
            </h1>
            <p className="text-lg text-primary-foreground/90">
              Tu confianza es importante. Aquí explicamos cómo manejamos tu información.
            </p>
            <p className="text-sm text-primary-foreground/70 mt-4">
              Última actualización: 7 de junio de 2026
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

export default PrivacyPage;
