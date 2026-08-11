import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Languages } from "@/components/Languages";
import { HowItWorks } from "@/components/HowItWorks";

import { AboutMe } from "@/components/AboutMe";
import { InstagramFeed } from "@/components/InstagramFeed";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { AllProductsReviews } from "@/components/AllProductsReviews";
import { CoreanoLaunchBanner } from "@/components/CoreanoLaunchBanner";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { useSpanishRelaxPixelPageView } from "@/hooks/useMetaPixel";

// Partner logos
import logoAmazon from "@/assets/logo-amazon.png";
import logoEtsy from "@/assets/logo-etsy.png";
import logoHotmart from "@/assets/logo-hotmart.svg";
import logoShopify from "@/assets/logo-shopify.png";
import logoKindle from "@/assets/logo-kindle.png";

const partnerLogos = [
  { src: logoAmazon, alt: "Amazon partner store", height: "h-8 md:h-12" },
  { src: logoEtsy, alt: "Etsy partner store", height: "h-8 md:h-12" },
  { src: logoShopify, alt: "Shopify partner store", height: "h-8 md:h-12" },
  { src: logoHotmart, alt: "Hotmart platform partner", height: "h-6 md:h-10" },
  { src: logoKindle, alt: "Amazon Kindle store", height: "h-6 md:h-10" },
];

const Index = () => {
  // Spanish Relax Pixel - PageView only
  useSpanishRelaxPixelPageView();

  return (
    <main className="min-h-screen">
      <SEO
        title="Aprende Idiomas con Pronunciación"
        description="Libro digital de inglés con 5,000+ palabras, pronunciación adaptada para hispanohablantes y fonética UK/USA. Método sin estrés, descarga inmediata. ¡Empieza hoy!"
        canonicalUrl="https://ilinguerelax.com/"
        keywords="aprender inglés, pronunciación inglés hispanohablantes, vocabulario inglés, fonética inglés UK USA, libro digital inglés, curso inglés online, inglés sin estrés, inglés fácil"
      />
      <Navbar />
      <Hero />
      
      {/* Logo Ticker */}
      <section className="py-6 bg-foreground">
        <div className="overflow-hidden">
          <div className="flex animate-ticker" style={{ width: 'max-content' }}>
            {[...Array(4)].map((_, setIndex) => (
              <div key={setIndex} className="flex items-center shrink-0 gap-16 md:gap-24 px-8 md:px-12">
                {partnerLogos.map((logo, index) => (
                  <img
                    key={`${setIndex}-${index}`}
                    src={logo.src}
                    alt={logo.alt}
                    loading="lazy"
                    className={`${logo.height} w-auto object-contain shrink-0 brightness-0 invert opacity-80`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <CoreanoLaunchBanner />
      <Languages />
      <HowItWorks />

      <AllProductsReviews />

      <InstagramFeed />



      <AboutMe />
      <Contact />
      <Footer />
      <WhatsAppButton />
</main>
  );
};

export default Index;
