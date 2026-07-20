import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BookOpen, Heart, Target, Users, Award, Globe, Instagram, Facebook, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Helmet } from "react-helmet-async";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const AboutPage = () => {
  return (
    <main className="min-h-screen bg-background">
      <Helmet>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "iLingue Relax",
          "alternateName": "Youtumundial LLC",
          "url": "https://ilinguerelax.com",
          "logo": "https://ilinguerelax.com/og-image.png",
          "description": "Marca educativa para aprender inglés sin estrés. Libros digitales con pronunciación adaptada para hispanohablantes. Operada por Youtumundial LLC, registrada en Nuevo México, Estados Unidos.",
          "foundingDate": "2025",
          "sameAs": [
            "https://www.instagram.com/ilinguerelax/",
            "https://www.facebook.com/ilinguerelax"
          ],
          "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "customer service",
            "url": "https://ilinguerelax.com/contacto",
            "availableLanguage": ["Spanish", "English"]
          },
          "areaServed": {
            "@type": "GeoShape",
            "name": "Americas"
          },
          "knowsAbout": ["English language learning", "Spanish to English", "Language education"],
          "numberOfEmployees": { "@type": "QuantitativeValue", "value": "1-10" }
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Sobre Nosotros - iLingue Relax",
          "description": "Conoce la historia de iLingue Relax, marca educativa para aprender inglés sin estrés.",
          "url": "https://ilinguerelax.com/sobre-nosotros",
          "isPartOf": { "@type": "WebSite", "name": "iLingue Relax", "url": "https://ilinguerelax.com" },
          "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://ilinguerelax.com" },
              { "@type": "ListItem", "position": 2, "name": "Sobre Nosotros", "item": "https://ilinguerelax.com/sobre-nosotros" }
            ]
          }
        })}</script>
      </Helmet>
      <SEO
        title="Sobre Nosotros - Aprender Idiomas Sin Estrés"
        description="iLingue Relax: marca educativa para aprender inglés sin estrés. Libros digitales con pronunciación adaptada para hispanohablantes. +10,000 estudiantes en 20+ países."
        canonicalUrl="https://ilinguerelax.com/sobre-nosotros"
        keywords="iLingue Relax, aprender inglés sin estrés, educación idiomas hispanohablantes, libros digitales inglés, pronunciación inglés español"
      />
      <Navbar />

      {/* Hero Section */}
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
              Sobre iLingue Relax: Aprendizaje de Idiomas Sin Estrés
            </h1>
            <p className="text-lg text-primary-foreground/90">
              Conoce la historia detrás de iLingue Relax
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Main Content */}
      <section className="py-20 md:py-28">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            {/* About Section */}
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Heart className="w-4 h-4" />
                Nuestra Historia
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Sobre <span className="text-gradient">iLingue Relax</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                iLingue Relax es una marca educativa enfocada en el aprendizaje de idiomas sin estrés, 
                pensada para personas que desean aprender de forma simple, clara y a su propio ritmo. 
                Creemos que aprender un idioma no debe ser difícil ni frustrante. Por eso, iLingue Relax 
                ofrece materiales prácticos, organizados y accesibles, diseñados especialmente para 
                autodidactas y principiantes.
              </p>
              <p className="text-base text-muted-foreground/80 max-w-3xl mx-auto leading-relaxed mt-4">
                iLingue Relax es una marca educativa operada por Youtumundial LLC, una empresa registrada en Nuevo México, Estados Unidos.
              </p>
            </motion.div>

            {/* Mission & Vision */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16"
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              <motion.div
                className="bg-card rounded-2xl border border-border shadow-card p-8"
                variants={fadeInUp}
              >
                <div className="w-14 h-14 rounded-xl gradient-hero flex items-center justify-center mb-6">
                  <Target className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-4">Nuestra Misión</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Ayudar a las personas a aprender idiomas de forma relajada, práctica y accesible, 
                  sin métodos complicados ni estrés innecesario. Queremos que cada estudiante disfrute 
                  del proceso de aprendizaje.
                </p>
              </motion.div>

              <motion.div
                className="bg-card rounded-2xl border border-border shadow-card p-8"
                variants={fadeInUp}
              >
                <div className="w-14 h-14 rounded-xl gradient-hero flex items-center justify-center mb-6">
                  <BookOpen className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-4">Nuestra Visión</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Convertir a iLingue Relax en una marca educativa reconocida a nivel mundial por 
                  enseñar idiomas sin estrés, de manera clara y amigable para hispanohablantes.
                </p>
              </motion.div>
            </motion.div>

            {/* Values */}
            <motion.div
              className="mb-16"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-2xl font-bold text-foreground text-center mb-8">Nuestros Valores</h3>
              <motion.div
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
                variants={staggerContainer}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
              >
                <motion.div
                  className="bg-card rounded-2xl border border-border shadow-card p-6 text-center hover:shadow-hero transition-all duration-300"
                  variants={fadeInUp}
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">Empatía</h4>
                  <p className="text-sm text-muted-foreground">
                    Entendemos las dificultades de aprender un nuevo idioma
                  </p>
                </motion.div>

                <motion.div
                  className="bg-card rounded-2xl border border-border shadow-card p-6 text-center hover:shadow-hero transition-all duration-300"
                  variants={fadeInUp}
                >
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                    <Award className="w-6 h-6 text-accent" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">Calidad</h4>
                  <p className="text-sm text-muted-foreground">
                    Contenido cuidadosamente diseñado y verificado
                  </p>
                </motion.div>

                <motion.div
                  className="bg-card rounded-2xl border border-border shadow-card p-6 text-center hover:shadow-hero transition-all duration-300"
                  variants={fadeInUp}
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Globe className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">Accesibilidad</h4>
                  <p className="text-sm text-muted-foreground">
                    Materiales accesibles para todos los presupuestos
                  </p>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Redes Sociales */}
            <motion.div
              className="mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-2xl font-bold text-foreground text-center mb-8">Síguenos en Redes Sociales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <a
                  href="https://www.instagram.com/ilinguerelax/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-card rounded-2xl border border-border shadow-card p-6 flex items-center gap-5 hover:shadow-hero transition-all duration-300"
                >
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shrink-0">
                    <Instagram className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">@ilinguerelax</h4>
                    <p className="text-sm text-muted-foreground">Tips, vocabulario y contenido diario para aprender inglés</p>
                  </div>
                  <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </a>

                <a
                  href="https://www.facebook.com/ilinguerelax"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-card rounded-2xl border border-border shadow-card p-6 flex items-center gap-5 hover:shadow-hero transition-all duration-300"
                >
                  <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                    <Facebook className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">iLingue Relax</h4>
                    <p className="text-sm text-muted-foreground">Comunidad, ofertas especiales y novedades</p>
                  </div>
                  <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </a>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-3xl p-8 md:p-12"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-2xl font-bold text-foreground text-center mb-8">Nuestros Logros</h3>
              <motion.div
                className="grid grid-cols-2 md:grid-cols-4 gap-6"
                variants={staggerContainer}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
              >
                {[
                  { number: "10,000+", label: "Estudiantes" },
                  { number: "8,000", label: "Palabras" },
                  { number: "4.9/5", label: "Valoración" },
                  { number: "20+", label: "Países" },
                ].map((stat) => (
                  <motion.div key={stat.label} className="text-center" variants={fadeInUp}>
                    <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.number}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
</main>
  );
};

export default AboutPage;
