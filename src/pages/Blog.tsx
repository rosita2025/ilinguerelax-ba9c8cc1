import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Calendar, Clock, ArrowRight, BookOpen } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { blogPosts, getAllCategories, type BlogPost } from "@/data/blogPosts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { useGeneratedBlogPosts } from "@/hooks/useGeneratedBlogPosts";

const SITE = "https://ilinguerelax.com";

const formatDate = (value: string, long = false) =>
  new Date(value).toLocaleDateString("es-ES", long
    ? { year: "numeric", month: "long", day: "numeric" }
    : { month: "short", day: "numeric" });

const Blog = () => {
  const categories = getAllCategories();
  const { posts: generatedPosts } = useGeneratedBlogPosts();
  const [activeCategory, setActiveCategory] = useState<string>("Todos");

  const allPosts: BlogPost[] = useMemo(
    () => [...generatedPosts, ...blogPosts],
    [generatedPosts],
  );

  const featuredPost = blogPosts[0];
  const otherPosts = useMemo(() => {
    const rest = allPosts.filter((p) => p.slug !== featuredPost.slug);
    return activeCategory === "Todos"
      ? rest
      : rest.filter((p) => p.category === activeCategory);
  }, [allPosts, activeCategory, featuredPost.slug]);

  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Blog iLingue Relax - Aprende Inglés",
    description:
      "Artículos, guías y consejos para aprender inglés de forma efectiva con pronunciación y fonética UK/USA.",
    url: `${SITE}/blog`,
    inLanguage: "es",
    publisher: {
      "@type": "Organization",
      name: "iLingue Relax",
      url: SITE,
      logo: { "@type": "ImageObject", url: `${SITE}/og-image.png` },
    },
    blogPost: allPosts.slice(0, 30).map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      image: post.image,
      datePublished: post.date,
      dateModified: post.date,
      inLanguage: "es",
      keywords: (post.tags ?? []).join(", "),
      articleSection: post.category,
      author: { "@type": "Organization", name: post.author || "iLingue Relax" },
      publisher: {
        "@type": "Organization",
        name: "iLingue Relax",
        logo: { "@type": "ImageObject", url: `${SITE}/og-image.png` },
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE}/blog/${post.slug}` },
      url: `${SITE}/blog/${post.slug}`,
    })),
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Artículos del blog de iLingue Relax",
    itemListElement: allPosts.slice(0, 30).map((post, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: post.title,
      url: `${SITE}/blog/${post.slug}`,
    })),
  };

  return (
    <>
      <SEO
        title="Blog para Aprender Inglés: Guías, Fonética y Vocabulario"
        description="Guías prácticas para aprender inglés desde cero: vocabulario, gramática, pronunciación en español y fonética UK/USA para hispanohablantes. Actualizado cada semana."
        canonicalUrl={`${SITE}/blog`}
        type="website"
        keywords="blog aprender inglés, consejos inglés hispanohablantes, guías vocabulario inglés, pronunciación inglés español, fonética inglés UK USA, errores comunes inglés"
        breadcrumbs={[
          { name: "Inicio", url: SITE },
          { name: "Blog", url: `${SITE}/blog` },
        ]}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(blogSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(itemListSchema)}</script>
      </Helmet>
      <Navbar />

      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-14 md:py-20">
          <div className="container mx-auto px-4">
            <nav aria-label="Ruta de navegación" className="mb-4 text-sm text-muted-foreground">
              <ol className="flex justify-center gap-2">
                <li><Link to="/" className="hover:text-primary">Inicio</Link></li>
                <li aria-hidden="true">/</li>
                <li aria-current="page" className="text-foreground">Blog</li>
              </ol>
            </nav>
            <div className="text-center max-w-3xl mx-auto">
              <Badge className="mb-4 bg-primary/20 text-primary hover:bg-primary/30">
                <BookOpen className="w-3 h-3 mr-1" />
                Blog Educativo
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Aprende Inglés con Nuestras{" "}
                <span className="text-primary">Guías y Artículos</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Estrategias, vocabulario y pronunciación en español con fonética UK/USA.
                Contenido pensado para hispanohablantes que quieren avanzar rápido.
              </p>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-6 border-b border-border" aria-label="Categorías del blog">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap gap-2 justify-center">
              {["Todos", ...categories].map((category) => (
                <Badge
                  key={category}
                  variant={activeCategory === category ? "default" : "outline"}
                  role="button"
                  tabIndex={0}
                  aria-pressed={activeCategory === category}
                  onClick={() => setActiveCategory(category)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setActiveCategory(category);
                    }
                  }}
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Post */}
        <section className="py-10" aria-labelledby="destacado-heading">
          <div className="container mx-auto px-4">
            <h2 id="destacado-heading" className="sr-only">Artículo destacado</h2>
            <article>
              <Link to={`/blog/${featuredPost.slug}`} aria-label={`Leer: ${featuredPost.title}`}>
                <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300 group">
                  <div className="grid md:grid-cols-2 gap-0">
                    <div className="relative h-64 md:h-auto overflow-hidden">
                      <img
                        src={featuredPost.image}
                        alt={`Artículo destacado: ${featuredPost.title}`}
                        width={800}
                        height={450}
                        loading="eager"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <Badge className="absolute top-4 left-4 bg-primary">Destacado</Badge>
                    </div>
                    <CardContent className="p-6 md:p-8 flex flex-col justify-center">
                      <Badge variant="secondary" className="w-fit mb-3">
                        {featuredPost.category}
                      </Badge>
                      <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                        {featuredPost.title}
                      </h3>
                      <p className="text-muted-foreground mb-4">{featuredPost.excerpt}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" aria-hidden="true" />
                          <time dateTime={featuredPost.date}>{formatDate(featuredPost.date, true)}</time>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" aria-hidden="true" />
                          {featuredPost.readTime} de lectura
                        </span>
                      </div>
                      <Button className="w-fit group/btn">
                        Leer artículo
                        <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </CardContent>
                  </div>
                </Card>
              </Link>
            </article>
          </div>
        </section>

        {/* Other Posts Grid */}
        <section className="py-10 bg-muted/30" aria-labelledby="mas-articulos">
          <div className="container mx-auto px-4">
            <h2 id="mas-articulos" className="text-2xl font-bold text-foreground mb-6">
              {activeCategory === "Todos" ? "Más artículos" : `Artículos de ${activeCategory}`}
            </h2>
            {otherPosts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No pudimos cargar los artículos dinámicos en este momento.</p>
                <Button variant="ghost" className="mt-4" onClick={() => window.location.reload()}>
                  Reintentar
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {otherPosts.map((post) => (
                  <article key={post.id}>
                    <Link to={`/blog/${post.slug}`} aria-label={`Leer: ${post.title}`}>
                      <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={post.image}
                            alt={`Portada del artículo ${post.title}`}
                            width={600}
                            height={340}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <Badge className="absolute top-3 left-3 bg-background/90 text-foreground">
                            {post.category}
                          </Badge>
                        </div>
                        <CardContent className="p-5">
                          <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                            {post.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                            {post.excerpt}
                          </p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" aria-hidden="true" />
                              <time dateTime={post.date}>{formatDate(post.date)}</time>
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" aria-hidden="true" />
                              {post.readTime}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-14 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">¿Listo para Empezar a Aprender?</h2>
            <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Descubre nuestros diccionarios con pronunciación en español y fonética UK/USA.
              La herramienta perfecta para dominar el inglés.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="secondary">
                <Link to="/products/5-000-palabras-en-ingles-con-pronunciacion-espanol-y-fonetica-uk-usa">
                  Ver 5,000 Palabras
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                <Link to="/products/8-000-palabras-en-ingles-con-pronunciacion-espanol-y-fonetica-uk-usa">
                  Ver 8,000 Palabras
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <WhatsAppButton />
      <Footer />
    </>
  );
};

export default Blog;
