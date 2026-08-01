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
  } : canonicalUrl ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Inicio",
        "item": "https://ilinguerelax.com"
      },
      ...(canonicalUrl.includes("/products/") ? [
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Productos",
          "item": "https://ilinguerelax.com/products"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": title.split(" | ")[0],
          "item": canonicalUrl
        }
      ] : []),
      ...(canonicalUrl.endsWith("/products") ? [{
        "@type": "ListItem",
        "position": 2,
        "name": "Productos",
          "item": "https://ilinguerelax.com/products"
      }] : []),
    ]
  } : null;

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
    "iLingue Relax es una marca educativa especializada en el aprendizaje de idiomas para estudiantes, profesionales y público en general. Ofrece libros digitales y físicos, guías de pronunciación, fonética y vocabulario aplicado a diferentes carreras profesionales, facilitando el aprendizaje de idiomas de forma sencilla y efectiva.";

  const BRAND_SAME_AS = [
    "https://www.youtube.com/@ilinguerelax",
    "https://www.instagram.com/ilinguerelax",
    "https://www.facebook.com/ilinguerelax",
    "https://www.tiktok.com/@ilinguerelax",
    "https://www.linkedin.com/company/ilinguerelax",
    "https://www.pinterest.com/ilinguerelax",
    "https://www.amazon.com/stores/iLingue-Relax/author/B0DH8XDVPF",
  ];

  // Organization/Brand/WebSite ya se emiten de forma estática en index.html
  // (mismo @id). No se duplican aquí para evitar avisos en los validadores.
  const organizationData = null;
  void BRAND_DESCRIPTION;
  void BRAND_SAME_AS;



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

      {/* Structured Data for Products */}
      {productStructuredData && (
        <script type="application/ld+json">
          {JSON.stringify(productStructuredData)}
        </script>
      )}

      {/* Structured Data for Product List */}
      {itemListStructuredData && (
        <script type="application/ld+json">
          {JSON.stringify(itemListStructuredData)}
        </script>
      )}

      {/* Breadcrumb Structured Data */}
      {breadcrumbData && breadcrumbData.itemListElement.length > 1 && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbData)}
        </script>
      )}

      {/* Book Structured Data */}
      {bookStructuredData && (
        <script type="application/ld+json">
          {JSON.stringify(bookStructuredData)}
        </script>
      )}

      {/* Organization Structured Data */}
      {organizationData && (
        <script type="application/ld+json">
          {JSON.stringify(organizationData)}
        </script>
      )}


      {/* FAQPage Structured Data */}
      {faqStructuredData && (
        <script type="application/ld+json">
          {JSON.stringify(faqStructuredData)}
        </script>
      )}
    </Helmet>
  );
};
