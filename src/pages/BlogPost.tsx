import { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Calendar, Clock, ArrowLeft, ArrowRight, Share2, BookOpen, Tag } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { getBlogPostBySlug, getRelatedPosts, blogPosts, type BlogPost as BlogPostType } from "@/data/blogPosts";
import { fetchGeneratedBlogPostBySlug, fetchGeneratedBlogPosts } from "@/hooks/useGeneratedBlogPosts";

import { getProductById } from "@/data/products";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCardPrice } from "@/hooks/useCardPrice";

const BlogPost = () => {
  const cardPrice = useCardPrice();
  const { slug } = useParams<{ slug: string }>();
  const staticPost = slug ? getBlogPostBySlug(slug) : null;
  const [post, setPost] = useState<(BlogPostType & { updatedAt?: string }) | null>(staticPost ?? null);
  const [loading, setLoading] = useState(!staticPost);
  const [generatedAll, setGeneratedAll] = useState<BlogPostType[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const all = await fetchGeneratedBlogPosts();
      if (!cancelled) setGeneratedAll(all);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (staticPost || !slug) return;
    let cancelled = false;
    (async () => {
      const remote = await fetchGeneratedBlogPostBySlug(slug);
      if (!cancelled) {
        setPost(remote);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, staticPost]);

  if (loading) return null;
  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  // Merge static + generated posts for internal linking (prev/next/related)
  const allPosts: BlogPostType[] = [...generatedAll, ...blogPosts];
  const uniqueBySlug = Array.from(new Map(allPosts.map((p) => [p.slug, p])).values());

  // Related: same category first, otherwise recent, excluding current
  const related = uniqueBySlug
    .filter((p) => p.slug !== post.slug)
    .sort((a, b) => (a.category === post.category ? -1 : 1))
    .slice(0, 3);
  const relatedPosts = related.length ? related : getRelatedPosts(post.slug, 3);

  const relatedProducts = post.relatedProducts
    .map(id => getProductById(id))
    .filter(Boolean);


  // Convert markdown-like content to HTML
  const renderContent = (content: string) => {
    return content
      .split('\n')
      .map((line, index) => {
        // Headers
        if (line.startsWith('# ')) {
          return <h2 key={index} className="text-3xl font-bold mt-8 mb-4">{line.replace('# ', '')}</h2>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={index} className="text-2xl font-bold mt-6 mb-3">{line.replace('## ', '')}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-xl font-semibold mt-4 mb-2">{line.replace('### ', '')}</h3>;
        }
        // Bold text
        if (line.includes('**')) {
          const parts = line.split(/\*\*(.*?)\*\*/g);
          return (
            <p key={index} className="mb-3 text-muted-foreground leading-relaxed">
              {parts.map((part, i) => 
                i % 2 === 1 ? <strong key={i} className="text-foreground">{part}</strong> : part
              )}
            </p>
          );
        }
        // Lists
        if (line.startsWith('- ')) {
          return (
            <li key={index} className="ml-4 mb-2 text-muted-foreground flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>{line.replace('- ', '')}</span>
            </li>
          );
        }
        // Numbered lists
        if (/^\d+\.\s/.test(line)) {
          const num = line.match(/^(\d+)\./)?.[1];
          return (
            <li key={index} className="ml-4 mb-2 text-muted-foreground flex items-start gap-2">
              <span className="text-primary font-semibold">{num}.</span>
              <span>{line.replace(/^\d+\.\s/, '')}</span>
            </li>
          );
        }
        // Tables (simple rendering)
        if (line.startsWith('|')) {
          const cells = line.split('|').filter(c => c.trim());
          if (cells.some(c => c.includes('---'))) return null;
          return (
            <div key={index} className="grid grid-cols-2 md:grid-cols-3 gap-2 py-2 border-b border-border">
              {cells.map((cell, i) => (
                <span key={i} className={i === 0 ? "font-medium" : "text-muted-foreground"}>
                  {cell.trim()}
                </span>
              ))}
            </div>
          );
        }
        // Empty lines
        if (line.trim() === '') return <div key={index} className="h-2" />;
        // Regular paragraphs
        if (line.trim()) {
          return <p key={index} className="mb-3 text-muted-foreground leading-relaxed">{line}</p>;
        }
        return null;
      });
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.excerpt,
    "image": post.image,
    "datePublished": post.date,
    "dateModified": (post.updatedAt ?? post.date).slice(0, 10),

    "author": {
      "@type": "Organization",
      "name": post.author,
      "url": "https://ilinguerelax.com"
    },
    "publisher": {
      "@type": "Organization",
      "name": "iLingue Relax",
      "logo": {
        "@type": "ImageObject",
        "url": "https://ilinguerelax.com/og-image.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://ilinguerelax.com/blog/${post.slug}`
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Inicio",
        "item": "https://ilinguerelax.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Blog",
        "item": "https://ilinguerelax.com/blog"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": post.title,
        "item": `https://ilinguerelax.com/blog/${post.slug}`
      }
    ]
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    }
  };

  // Find current post index for navigation
  const currentIndex = blogPosts.findIndex(p => p.slug === post.slug);
  const prevPost = currentIndex > 0 ? blogPosts[currentIndex - 1] : null;
  const nextPost = currentIndex < blogPosts.length - 1 ? blogPosts[currentIndex + 1] : null;

  return (
    <>
      <SEO 
        title={`${post.title} | Blog iLingue Relax`}
        description={post.excerpt}
        canonicalUrl={`https://ilinguerelax.com/blog/${post.slug}`}
        keywords={post.tags.join(", ")}
        image={post.image}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>
      <Navbar />
      
      <main className="min-h-screen bg-background">
        {/* Hero Image */}
        <div className="relative h-64 md:h-96 overflow-hidden">
          <img 
            src={post.image} 
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>

        <div className="container mx-auto px-4 -mt-32 relative z-10">
          <article className="max-w-4xl mx-auto">
            {/* Breadcrumb */}
            <nav className="mb-6" aria-label="Breadcrumb">
              <ol className="flex items-center gap-2 text-sm">
                <li>
                  <Link to="/" className="text-muted-foreground hover:text-primary">
                    Inicio
                  </Link>
                </li>
                <li className="text-muted-foreground">/</li>
                <li>
                  <Link to="/blog" className="text-muted-foreground hover:text-primary">
                    Blog
                  </Link>
                </li>
                <li className="text-muted-foreground">/</li>
                <li className="text-foreground truncate max-w-[200px]">
                  {post.title}
                </li>
              </ol>
            </nav>

            {/* Article Header */}
            <Card className="mb-8">
              <CardContent className="p-6 md:p-10">
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge>{post.category}</Badge>
                  {post.tags.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  {post.title}
                </h1>

                <p className="text-lg text-muted-foreground mb-6">
                  {post.excerpt}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(post.date).toLocaleDateString('es-ES', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {post.readTime} de lectura
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      {post.author}
                    </span>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleShare}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Compartir
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Article Content */}
            <Card className="mb-8">
              <CardContent className="p-6 md:p-10 prose prose-lg max-w-none">
                {renderContent(post.content)}
              </CardContent>
            </Card>

            {/* Related Products CTA */}
            {relatedProducts.length > 0 && (
              <Card className="mb-8 bg-primary/5 border-primary/20">
                <CardContent className="p-6 md:p-8">
                  <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    Recursos Recomendados
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Acelera tu aprendizaje con nuestros diccionarios completos:
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {relatedProducts.map(product => product && (
                      <Link 
                        key={product.id} 
                        to={`/products/${product.slug}`}
                        className="flex items-center gap-4 p-4 bg-background rounded-lg border border-border hover:border-primary hover:shadow-md transition-all group"
                      >
                        <img 
                          src={product.image} 
                          alt={product.title}
                          className="w-16 h-16 object-contain"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {product.title}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {product.subtitle}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-lg font-bold text-primary">
                              {cardPrice.format(product.slug, product.price)}
                            </span>
                            {product.originalPrice && (
                              <span className="text-sm text-muted-foreground line-through">
                                {cardPrice.format(product.slug, product.originalPrice)}
                              </span>
                            )}
                            <span className="text-xs text-primary/70 font-semibold">{cardPrice.currencyLabel(product.slug)}</span>
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{cardPrice.regionLabel}</span>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Post Navigation */}
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {prevPost ? (
                <Link 
                  to={`/blog/${prevPost.slug}`}
                  className="flex items-center gap-3 p-4 bg-card rounded-lg border border-border hover:border-primary transition-colors group"
                >
                  <ArrowLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                  <div>
                    <span className="text-xs text-muted-foreground">Anterior</span>
                    <p className="text-sm font-medium text-foreground group-hover:text-primary line-clamp-1">
                      {prevPost.title}
                    </p>
                  </div>
                </Link>
              ) : <div />}
              {nextPost && (
                <Link 
                  to={`/blog/${nextPost.slug}`}
                  className="flex items-center justify-end gap-3 p-4 bg-card rounded-lg border border-border hover:border-primary transition-colors group text-right"
                >
                  <div>
                    <span className="text-xs text-muted-foreground">Siguiente</span>
                    <p className="text-sm font-medium text-foreground group-hover:text-primary line-clamp-1">
                      {nextPost.title}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                </Link>
              )}
            </div>

            <Separator className="mb-8" />

            {/* Related Posts */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                Artículos Relacionados
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {relatedPosts.map(relatedPost => (
                  <Link key={relatedPost.id} to={`/blog/${relatedPost.slug}`}>
                    <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow group">
                      <div className="relative h-40 overflow-hidden">
                        <img 
                          src={relatedPost.image} 
                          alt={relatedPost.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <CardContent className="p-4">
                        <Badge variant="secondary" className="mb-2 text-xs">
                          {relatedPost.category}
                        </Badge>
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                          {relatedPost.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-2">
                          {relatedPost.readTime} de lectura
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          </article>
        </div>

        {/* Back to Blog */}
        <div className="container mx-auto px-4 pb-12">
          <div className="max-w-4xl mx-auto text-center">
            <Button asChild variant="outline" size="lg">
              <Link to="/blog">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Blog
              </Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default BlogPost;
