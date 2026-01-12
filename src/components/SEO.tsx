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
}: SEOProps) => {
  const fullTitle = title.includes("iLingue Relax")
    ? title
    : `${title} | iLingue Relax`;

  const productStructuredData = type === "product" && price ? {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": title,
    "description": description,
    "image": image,
    "url": canonicalUrl,
    "sku": sku || title.toLowerCase().replace(/\s+/g, '-').substring(0, 50),
    "mpn": sku || "ILINGUE-" + (price || "00"),
    "brand": {
      "@type": "Brand",
      "name": "iLingue Relax"
    },
    "offers": {
      "@type": "Offer",
      "url": canonicalUrl,
      "priceCurrency": "USD",
      "price": price,
      ...(originalPrice && { "priceValidUntil": "2026-12-31" }),
      "availability": "https://schema.org/InStock",
      "itemCondition": "https://schema.org/NewCondition",
      "seller": {
        "@type": "Organization",
        "name": "iLingue Relax"
      },
      "hasMerchantReturnPolicy": {
        "@type": "MerchantReturnPolicy",
        "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
        "merchantReturnDays": 7,
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
      "review": {
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": rating,
          "bestRating": "5",
          "worstRating": "1"
        },
        "author": {
          "@type": "Person",
          "name": "Cliente verificado"
        },
        "reviewBody": "Excelente libro para aprender inglés con pronunciación clara para hispanohablantes."
      }
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

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Additional Meta Tags */}
      <meta name="author" content="iLingue Relax" />
      <meta name="language" content="es" />
      <meta name="revisit-after" content="7 days" />
      <meta name="distribution" content="global" />

      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:locale" content="es_ES" />
      <meta property="og:site_name" content="iLingue Relax" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      {canonicalUrl && <meta name="twitter:url" content={canonicalUrl} />}
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

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
    </Helmet>
  );
};
