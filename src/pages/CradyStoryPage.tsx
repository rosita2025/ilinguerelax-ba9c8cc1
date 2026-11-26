import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Heart, Ear, BookOpen, Sparkles } from "lucide-react";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

/**
 * Historia de Crady (fundadora de iLingue Relax). Solo datos dados por la dueña: discapacidad auditiva, clases de inglés que le parecían aburridas y
 * que le daban vergüenza (no oía bien, no sabía cómo se pronunciaban las palabras y las decía mal), iLingue Relax (libros para aprender idiomas sin
 * estrés, con la pronunciación escrita paso a paso), 10 años en marketing, Ingeniería Civil de base, más de 2.000 personas en un año y «5.000 palabras
 * en inglés» como el más popular. Va SOLO con el alias «Crady» (nunca el nombre completo) y con la foto SIN cara; la cara solo se muestra en YMT Fitness.
 * No inventar cifras, años ni testimonios.
 */
const PATRONES_URL = "/products/patrones-especiales-alfabeto-combinaciones-secretas-ingles";
const URL = "https://ilinguerelax.com/historia-de-crady";

const Section = ({ icon: Icon, title, children }: { icon: typeof Heart; title: string; children: React.ReactNode }) => (
  <section className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
      <h2 className="text-xl font-bold leading-tight text-foreground md:text-2xl">{title}</h2>
    </div>
    <div className="mt-4 space-y-3 text-base leading-relaxed text-foreground/85 md:text-lg">{children}</div>
  </section>
);

const CradyStoryPage = () => (
  <main className="min-h-screen bg-background">
    <Helmet>
      <script type="application/ld+json">{JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebPage",
        "@id": `${URL}#webpage`,
        "name": "Historia de Crady, fundadora de iLingue Relax",
        "url": URL,
        "inLanguage": "es",
        "isPartOf": { "@id": "https://ilinguerelax.com/#website" },
        "about": { "@id": "https://ilinguerelax.com/#organization" },
        "publisher": { "@id": "https://ilinguerelax.com/#organization" },
        "breadcrumb": {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://ilinguerelax.com" },
            { "@type": "ListItem", "position": 2, "name": "Historia de Crady", "item": URL },
          ],
        },
      })}</script>
    </Helmet>
    <SEO
      title="Historia de Crady - Fundadora de iLingue Relax"
      description="Tengo discapacidad auditiva y las clases de inglés me daban vergüenza: no sabía cómo se pronunciaban las palabras. Así nació iLingue Relax, con la pronunciación escrita paso a paso."
      canonicalUrl={URL}
      keywords="Crady, historia iLingue Relax, aprender inglés sin vergüenza, discapacidad auditiva, pronunciación inglés paso a paso, patrones de pronunciación"
    />
    <Navbar />

    {/* Encabezado: foto SIN cara + título */}
    <section className="bg-primary/[0.06] px-4 pb-10 pt-28 md:px-6 md:pb-14 md:pt-36">
      <div className="mx-auto grid max-w-5xl items-center gap-8 md:grid-cols-[minmax(0,300px)_minmax(0,1fr)] md:gap-14">
        <figure className="mx-auto w-full max-w-[260px] md:mx-0 md:max-w-[300px]">
          <div className="rounded-t-[999px] rounded-b-3xl bg-primary/15 p-2 shadow-xl">
            <img
              src="/images/crady-ilingue-relax.webp"
              alt="Crady, fundadora de iLingue Relax, sentada en una silla colgante"
              width={720}
              height={893}
              decoding="async"
              className="aspect-[720/893] w-full rounded-t-[999px] rounded-b-2xl border-2 border-primary/50 bg-muted object-cover"
            />
          </div>
        </figure>
        <div>
          <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-primary">
            <span className="h-px w-10 bg-primary" aria-hidden="true" /> Historia de Crady
          </div>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-foreground md:text-5xl">
            Aprendí inglés con vergüenza. <span className="text-primary">Por eso creé iLingue Relax.</span>
          </h1>
          <p className="mt-4 text-lg text-foreground/80">Soy Crady, la fundadora de iLingue Relax. Esta es mi historia.</p>
        </div>
      </div>
    </section>

    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 md:px-6 md:py-14">
      <Section icon={Ear} title="Una clase que me daba vergüenza">
        <p>Tengo <b className="text-primary">discapacidad auditiva</b>. En la universidad, las clases de inglés me parecían muy aburridas y, sobre todo, me daban <b className="text-primary">vergüenza</b>.</p>
        <p>No escuchaba bien, no sabía cómo se pronunciaban las palabras y las decía mal. Me quedaba callada para no equivocarme delante de todos.</p>
      </Section>

      <Section icon={Sparkles} title="Me faltaba algo muy simple">
        <p>No me faltaban ganas de aprender. Me faltaba <b className="text-primary">ver la pronunciación escrita, paso a paso</b>, en lugar de adivinarla escuchando.</p>
      </Section>

      <Section icon={Heart} title="Así nació iLingue Relax">
        <p>Por eso creé <b className="text-primary">iLingue Relax</b>: libros para aprender idiomas <b className="text-primary">sin estrés</b>, rápido y con la <b className="text-primary">pronunciación escrita paso a paso</b>.</p>
        <p>También están pensados para personas con discapacidad auditiva, porque sé lo que se siente no poder apoyarse solo en el oído.</p>
      </Section>

      <Section icon={BookOpen} title="Patrones: la pronunciación del inglés, explicada con patrones">
        <p>De esa idea salió <b className="text-primary">Patrones especiales</b>: el alfabeto y las combinaciones de letras del inglés, explicados con patrones para que dejes de adivinar cómo se dice una palabra.</p>
        <p>Si hoy te pasa lo que me pasaba a mí, empieza por ahí.</p>
        <Link to={PATRONES_URL} className="mt-2 inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-base font-bold text-primary-foreground shadow-md transition hover:brightness-110">
          Ver Patrones especiales
        </Link>
      </Section>

      <Section icon={Sparkles} title="Quién está detrás">
        <p>Trabajé más de <b className="text-primary">10 años en marketing</b> y mi carrera de base es <b className="text-primary">Ingeniería Civil</b>. Creo que no existen límites para aprender.</p>
        <p>En un año, <b className="text-primary">más de 2.000 personas de varios países</b> ya aprenden con iLingue Relax. El más popular: <b className="text-primary">5.000 palabras en inglés</b>.</p>
      </Section>

      <p className="pt-2 text-center text-xl font-bold text-primary">¡Mucho gusto! Aprende a tu ritmo, sin vergüenza. 💙</p>
      <p className="text-center text-sm text-muted-foreground">
        ¿Quieres saber más de la marca? Visita <Link to="/sobre-nosotros" className="font-semibold text-primary underline">Sobre nosotros</Link>.
      </p>
    </div>

    <Footer />
  </main>
);

export default CradyStoryPage;
