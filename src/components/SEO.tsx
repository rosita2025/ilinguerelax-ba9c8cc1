import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  image?: string;
  type?: "website" | "product" | "article";
  price?: string;
  rating?: string;
  reviewCount?: string;
  noIndex?: boolean;
}

export const SEO = ({
  title,
  description,
  canonicalUrl,
  image = "https://ilinguerelax.com/og-image.png",
  type = "website",
  price,
  rating,
  reviewCount,
  noIndex = false,
}: SEOProps) => {
  const fullTitle = title.includes("iLingue Relax")
    ? title
    : `${title} | iLingue Relax`;

  const structuredData = type === "product" && price ? {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": title,
    "description": description,
    "brand": {
      "@type": "Brand",
      "name": "iLingue Relax"
    },
    "offers": {
      "@type": "Offer",
      "priceCurrency": "USD",
      "price": price,
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": "iLingue Relax"
      }
    },
    ...(rating && reviewCount && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": rating,
        "reviewCount": reviewCount,
        "bestRating": "5",
        "worstRating": "1"
      }
    })
  } : null;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

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
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};
