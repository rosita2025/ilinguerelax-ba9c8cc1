import { Link } from "react-router-dom";
import { Calendar, Clock, ArrowRight, BookOpen } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { blogPosts, getAllCategories } from "@/data/blogPosts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { useGeneratedBlogPosts } from "@/hooks/useGeneratedBlogPosts";

const Blog = () => {
  const categories = getAllCategories();
  const { posts: generatedPosts } = useGeneratedBlogPosts();
  const featuredPost = blogPosts[0];
  const otherPosts = [...generatedPosts, ...blogPosts.slice(1)];


  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Blog iLingue Relax - Aprende Inglés",
    "description": "Artículos, guías y consejos para aprender inglés de forma efectiva con pronunciación y fonética.",
    "url": "https://ilinguerelax.com/blog",
    "publisher": {
      "@type": "Organization",
      "name": "iLingue Relax",
      "logo": {
        "@type": "ImageObject",
        "url": "https://ilinguerelax.com/og-image.png"
      }
    },
    "blogPost": blogPosts.map(post => ({
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.excerpt,
      "image": post.image,
      "datePublished": post.date,
      "author": {
        "@type": "Organization",
        "name": post.author
      },
      "url": `https://ilinguerelax.com/blog/${post.slug}`
    }))
  };

  return (
    <>
      <SEO 
        title="Blog - Aprende Inglés con Consejos y Guías Prácticas"
        description="Artículos y guías para aprender inglés con pronunciación. Vocabulario, gramática, fonética UK/USA y estrategias para hispanohablantes. ¡Mejora tu inglés hoy!"
        canonicalUrl="https://ilinguerelax.com/blog"
        keywords="blog aprender inglés, consejos inglés hispanohablantes, guías vocabulario inglés, pronunciación inglés español, fonética inglés UK USA, errores comunes inglés"
      />
      <Navbar />
      
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <Badge className="mb-4 bg-primary/20 text-primary hover:bg-primary/30">
                <BookOpen className="w-3 h-3 mr-1" />
                Blog Educativo
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Aprende Inglés con Nuestros{" "}
                <span className="text-primary">Artículos</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Guías, consejos y estrategias para dominar el inglés de forma efectiva. 
                Descubre los mejores métodos de aprendizaje.
              </p>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-8 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                Todos
              </Badge>
              {categories.map(category => (
                <Badge 
                  key={category} 
                  variant="outline" 
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Post */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <Link to={`/blog/${featuredPost.slug}`}>
              <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300 group">
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="relative h-64 md:h-auto overflow-hidden">
                    <img 
                      src={featuredPost.image} 
                      alt={featuredPost.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <Badge className="absolute top-4 left-4 bg-primary">
                      Destacado
                    </Badge>
                  </div>
                  <CardContent className="p-6 md:p-8 flex flex-col justify-center">
                    <Badge variant="secondary" className="w-fit mb-3">
                      {featuredPost.category}
                    </Badge>
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                      {featuredPost.title}
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      {featuredPost.excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(featuredPost.date).toLocaleDateString('es-ES', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
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
          </div>
        </section>

        {/* Other Posts Grid */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-foreground mb-8">Más Artículos</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherPosts.map(post => (
                <Link key={post.id} to={`/blog/${post.slug}`}>
                  <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={post.image} 
                        alt={post.title}
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
                          <Calendar className="w-3 h-3" />
                          {new Date(post.date).toLocaleDateString('es-ES', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {post.readTime}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              ¿Listo para Empezar a Aprender?
            </h2>
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
