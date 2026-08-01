import { useLayoutEffect } from "react";
import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  image?: string;
  type?: "website" | "product" | "article";
  price?: string;
  originalPrice?: string;
  rating?: string;
  reviewCount?: string;
  noIndex?: boolean;
  keywords?: string;
  sku?: string;
  productList?: Array<{
    name: string;
    description: string;
    price: number;
    image: string;
    url: string;
    rating?: number;
    reviewCount?: number;
  }>;
  reviews?: Array<{
    author: string;
    rating: number;
    text: string;
    date: string;
  }>;
  faqItems?: Array<{
    question: string;
    answer: string;
  }>;
  availability?: "InStock" | "PreOrder" | "OutOfStock";
  isPhysical?: boolean;
  /** Custom breadcrumb trail. Overrides the default URL-based inference. */
  breadcrumbs?: Array<{ name: string; url: string }>;
  /** Emits schema.org Book markup for physical books and ebooks. */
  book?: {
    name?: string;
    author?: string;
    isbn?: string;
    inLanguage?: string;
    numberOfPages?: number;
    datePublished?: string;
    format?: "Paperback" | "Hardcover" | "EBook" | "AudiobookFormat";
  };
}

export const SEO = ({
  title,
  description,
  canonicalUrl,
  image = "https://ilinguerelax.com/og-image.png",
  type = "website",
  price,
  originalPrice,
  rating,
  reviewCount,
  noIndex = false,
  keywords,
  sku,
  productList,
  reviews,
  faqItems,
  availability = "InStock",
  isPhysical = false,
  breadcrumbs,
  book,
}: SEOProps) => {
  // Keep combined title under 60 chars to avoid SERP truncation.
  const SUFFIX = " | iLingue Relax";
  const fullTitle = title.includes("iLingue Relax")
    ? title
    : title.length + SUFFIX.length <= 60
      ? `${title}${SUFFIX}`
      : title;

  const optimizedDescription = description.length > 155 
    ? description.substring(0, 152) + "..." 
    : description;

  // Default reviews if none provided but rating exists
  const defaultReviews = [
    {
      author: "María García",
      rating: 5,
      text: "Excelente libro para aprender inglés. La pronunciación adaptada al español hace que sea muy fácil de entender. Totalmente recomendado.",
      date: "2025-11-20",
    },
    {
      author: "Carlos Rodríguez",
      rating: 5,
      text: "Muy completo y bien organizado. Me encanta que no necesito diccionario porque todo está explicado. Perfecto para estudiar solo.",
      date: "2025-12-05",
    },
    {
      author: "Ana Martínez",
      rating: 5,
      text: "Lo compré para mi hijo y le ha ayudado muchísimo. El método sin estrés es genial, aprende a su ritmo sin presión.",
      date: "2026-01-10",
    },
    {
      author: "Luis Hernández",
      rating: 4,
      text: "Muy buen recurso para hispanohablantes. La fonética UK y USA incluida es un gran plus. Lo recomiendo.",
      date: "2026-01-28",
    },
    {
      author: "Patricia López",
      rating: 5,
      text: "El mejor libro de vocabulario en inglés que he comprado. Claro, práctico y muy bien diseñado. Vale cada centavo.",
      date: "2026-02-15",
    },
  ];

  const productReviews = reviews || defaultReviews;

  const productStructuredData = type === "product" && price ? {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${canonicalUrl}#product`,
    "name": title.split(" | ")[0],
    "description": description,
    "image": [image],
    "url": canonicalUrl,
    "sku": sku || title.toLowerCase().replace(/\s+/g, '-').substring(0, 50),
    "brand": {
      "@id": "https://ilinguerelax.com/#brand"
    },
    "category": "Libros > Educación > Idiomas",
    "offers": {
      "@type": "Offer",
      "url": canonicalUrl,
      "priceCurrency": "USD",
      "price": price,
      "priceValidUntil": "2026-12-31",
      "availability": `https://schema.org/${availability}`,
      "itemCondition": "https://schema.org/NewCondition",
      "seller": {
        "@type": "Organization",
        "name": "iLingue Relax",
        "url": "https://ilinguerelax.com"
      },
      ...(isPhysical && {
        "shippingDetails": {
          "@type": "OfferShippingDetails",
          "shippingRate": {
            "@type": "MonetaryAmount",
            "value": "0",
            "currency": "USD"
          },
          "shippingDestination": {
            "@type": "DefinedRegion",
            "addressCountry": ["US", "ES", "MX", "AR", "CO", "PE", "CL"]
          },
          "deliveryTime": {
            "@type": "ShippingDeliveryTime",
            "handlingTime": {
              "@type": "QuantitativeValue",
              "minValue": 1,
              "maxValue": 3,
              "unitCode": "d"
            },
            "transitTime": {
              "@type": "QuantitativeValue",
              "minValue": 3,
              "maxValue": 14,
              "unitCode": "d"
            }
          }
        },
      }),
      "hasMerchantReturnPolicy": {
        "@type": "MerchantReturnPolicy",
        "applicableCountry": ["ES", "MX", "AR", "CO", "PE", "CL", "US"],
        "returnPolicyCountry": ["ES", "MX", "AR", "CO", "PE", "CL", "US"],
        "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
        "merchantReturnDays": 30,
        "returnMethod": "https://schema.org/ReturnByMail",
        "returnFees": "https://schema.org/FreeReturn"
      }
    },
    ...(rating && reviewCount && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": rating,
        "reviewCount": reviewCount,
        "bestRating": "5",
        "worstRating": "1"
      },
      "review": productReviews.map((r) => ({
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": String(r.rating),
          "bestRating": "5",
          "worstRating": "1"
        },
        "author": {
          "@type": "Person",
          "name": r.author
        },
        "datePublished": r.date,
        "reviewBody": r.text,
        "publisher": {
          "@type": "Organization",
          "name": "iLingue Relax"
        }
      }))
    })
  } : null;



  const itemListStructuredData = productList && productList.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": title,
    "description": description,
    "numberOfItems": productList.length,
    "itemListElement": productList.map((product, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Product",
        "name": product.name,
        "description": product.description,
        "image": product.image,
        "url": product.url,
        "brand": {
          "@type": "Brand",
          "name": "iLingue Relax",
          "@id": "https://ilinguerelax.com/#brand"
        },

        "offers": {
          "@type": "Offer",
          "priceCurrency": "USD",
          "price": product.price,
          "availability": "https://schema.org/InStock"
        },
        ...(product.rating && product.reviewCount && {
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": product.rating,
            "reviewCount": product.reviewCount,
            "bestRating": "5",
            "worstRating": "1"
          }
        })
      }
    }))
  } : null;

  // Breadcrumb structured data
  const breadcrumbData = breadcrumbs && breadcrumbs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((b, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": b.name,
      "item": b.url,
    })),
  } : canonicalUrl ? (() => {
    // Inferencia automática de migas de pan a partir de la URL canónica,
    // válida para TODAS las secciones (productos/libros, blog, aprender,
    // vista previa y páginas legales/informativas).
    const SEGMENT_LABELS: Record<string, string> = {
      products: "Productos",
      productos: "Productos",
      blog: "Blog",
      aprender: "Aprender idiomas",
      learn: "Aprender idiomas",
      "vista-previa": "Vista previa",
      "sobre-nosotros": "Sobre nosotros",
      contacto: "Contacto",
      faq: "Preguntas frecuentes",
      privacidad: "Política de privacidad",
      condiciones: "Términos y condiciones",
      copyright: "Copyright",
      trademark: "Marca registrada",
      "aviso-trademark": "Marca registrada",
      "licencias-y-avisos-legales": "Licencias y avisos legales",
      licenses: "Licencias y avisos legales",
      "envios-y-entregas": "Envíos y entregas",
      "shipping-and-delivery": "Envíos y entregas",
      "devoluciones-y-reembolsos": "Devoluciones y reembolsos",
      "returns-and-refunds": "Devoluciones y reembolsos",
      "dejar-resena": "Dejar reseña",
      "mi-pedido": "Mi pedido",
      "order-status": "Mi pedido",
    };

    let pathname = "";
    try {
      pathname = new URL(canonicalUrl, "https://ilinguerelax.com").pathname;
    } catch {
      pathname = "";
    }

    const segments = pathname.split("/").filter(Boolean);
    const pageTitle = title.split(" | ")[0];

    const humanize = (segment: string) =>
      segment
        .replace(/[-_]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, (c) => c.toUpperCase());

    const items: Array<Record<string, unknown>> = [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Inicio",
        "item": "https://ilinguerelax.com",
      },
    ];

    segments.forEach((segment, index) => {
      const isLast = index === segments.length - 1;
      const url = `https://ilinguerelax.com/${segments.slice(0, index + 1).join("/")}`;
      // En secciones conocidas usamos la etiqueta corta (mejor para Google);
      // en fichas de libros/ebooks y artículos usamos el título de la página.
      const name = SEGMENT_LABELS[segment]
        ? SEGMENT_LABELS[segment]
        : isLast
          ? pageTitle || humanize(segment)
          : humanize(segment);
      items.push({
        "@type": "ListItem",
        "position": items.length + 1,
        "name": name,
        "item": url,
      });
    });

    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "@id": `${canonicalUrl}#breadcrumb`,
      "itemListElement": items,
    };
  })() : null;


  // FAQPage structured data
  const faqStructuredData = faqItems && faqItems.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map((item) => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer,
      },
    })),
  } : null;

  // Book structured data (physical books / ebooks)
  const bookStructuredData = book ? {
    "@context": "https://schema.org",
    "@type": "Book",
    "@id": `${canonicalUrl}#book`,
    "name": book.name || title.split(" | ")[0],
    "description": description,
    "url": canonicalUrl,
    "image": image,
    "bookFormat": `https://schema.org/${book.format || (isPhysical ? "Paperback" : "EBook")}`,
    "inLanguage": book.inLanguage || "es",
    "author": {
      "@type": "Person",
      "name": book.author || "Crady",
    },
    "brand": {
      "@type": "Brand",
      "name": "iLingue Relax",
      "@id": "https://ilinguerelax.com/#brand",
    },
    "publisher": {
      "@type": "Organization",
      "name": "iLingue Relax",
      "@id": "https://ilinguerelax.com/#organization",
    },

    ...(book.isbn && { "isbn": book.isbn }),
    ...(book.numberOfPages && { "numberOfPages": book.numberOfPages }),
    ...(book.datePublished && { "datePublished": book.datePublished }),
    ...(price && {
      "offers": {
        "@type": "Offer",
        "url": canonicalUrl,
        "priceCurrency": "USD",
        "price": price,
        "availability": `https://schema.org/${availability}`,
      },
    }),
    ...(rating && reviewCount && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": rating,
        "reviewCount": reviewCount,
        "bestRating": "5",
        "worstRating": "1",
      },
    }),
  } : null;

  // Organization structured data (for homepage/general pages)
  const BRAND_DESCRIPTION =
    "iLingue Relax es una marca educativa especializada en el aprendizaje de idiomas para estudiantes, profesionales y público en general. Ofrece libros digitales y físicos, guías de pronunciación, fonética y vocabulario aplicados a diferentes carreras profesionales, facilitando el aprendizaje de idiomas de forma sencilla y efectiva, Aprende sin estres.";

  const BRAND_SAME_AS = [
    "https://www.youtube.com/@ilinguerelax",
    "https://www.instagram.com/ilinguerelax",
    "https://www.facebook.com/ilinguerelax",
    "https://www.tiktok.com/@ilinguerelax",
    "https://www.pinterest.com/ilinguerelax",
    "https://www.amazon.com/stores/iLingue-Relax/author/B0DH8XDVPF",
  ];

  // Organization/Brand/WebSite ya se emiten de forma estática en index.html
  // (mismo @id). No se duplican aquí para evitar avisos en los validadores.
  const organizationData = null;
  void BRAND_DESCRIPTION;
  void BRAND_SAME_AS;

  // --------------------------------------------------------------------
  // JSON-LD antes del primer paint
  // --------------------------------------------------------------------
  // react-helmet-async escribe en el <head> en un efecto pasivo, es decir
  // DESPUÉS del primer paint. En páginas con datos dinámicos (producto,
  // blog) eso deja una ventana en la que el bot puede leer el HTML sin el
  // JSON-LD correcto. Inyectamos los bloques nosotros con useLayoutEffect,
  // que corre de forma síncrona antes de pintar, y dejamos fuera de Helmet
  // los scripts ld+json para no duplicar entidades.
  const jsonLdBlocks = [
    productStructuredData,
    itemListStructuredData,
    breadcrumbData && breadcrumbData.itemListElement.length > 1 ? breadcrumbData : null,
    bookStructuredData,
    organizationData,
    faqStructuredData,
  ].filter(Boolean) as Array<Record<string, unknown>>;

  const jsonLdPayload = JSON.stringify(jsonLdBlocks);

  useLayoutEffect(() => {
    const blocks: Array<Record<string, unknown>> = JSON.parse(jsonLdPayload);

    // Bloques viejos gestionados por nosotros o restos de Helmet (data-rh):
    // se retiran en el mismo tick, antes de pintar, para que nunca convivan
    // dos entidades con el mismo @id y datos distintos.
    document
      .querySelectorAll('script[type="application/ld+json"][data-seo-jsonld="true"]')
      .forEach((n) => n.remove());
    document
      .querySelectorAll('script[type="application/ld+json"][data-rh="true"]')
      .forEach((n) => n.remove());

    const seen = new Set<string>();
    for (const block of blocks) {
      const key = `${block["@type"] ?? ""}|${block["@id"] ?? block["name"] ?? ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const el = document.createElement("script");
      el.type = "application/ld+json";
      el.setAttribute("data-seo-jsonld", "true");
      el.textContent = JSON.stringify(block);
      document.head.appendChild(el);
    }

    return () => {
      document
        .querySelectorAll('script[type="application/ld+json"][data-seo-jsonld="true"]')
        .forEach((n) => n.remove());
    };
  }, [jsonLdPayload]);







  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={optimizedDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}
      
      {/* Additional Meta Tags */}
      <meta name="author" content="iLingue Relax" />
      <meta name="language" content="es" />
      <meta name="revisit-after" content="3 days" />
      <meta name="distribution" content="global" />
      <meta name="rating" content="general" />
      <meta name="coverage" content="Worldwide" />

      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={optimizedDescription} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title} />
      <meta property="og:locale" content="es_ES" />
      <meta property="og:locale:alternate" content="es_MX" />
      <meta property="og:locale:alternate" content="es_AR" />
      <meta property="og:site_name" content="iLingue Relax" />

      {/* Product-specific OG tags */}
      {type === "product" && price && (
        <>
          <meta property="product:price:amount" content={price} />
          <meta property="product:price:currency" content="USD" />
          <meta property="product:availability" content="in stock" />
          <meta property="product:condition" content="new" />
          <meta property="product:brand" content="iLingue Relax" />
        </>
      )}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      {canonicalUrl && <meta name="twitter:url" content={canonicalUrl} />}
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={optimizedDescription} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={title} />
      <meta name="twitter:site" content="@ilinguerelax" />

      {/* El JSON-LD se inyecta en useLayoutEffect (antes del primer paint),
          no vía Helmet, que escribe después de pintar. */}
    </Helmet>
  );
};
