import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Benefits } from "@/components/Benefits";
import { Languages } from "@/components/Languages";
import { HowItWorks } from "@/components/HowItWorks";
import { Pricing } from "@/components/Pricing";
import { AboutMe } from "@/components/AboutMe";
import { Contact } from "@/components/Contact";
import { CTA } from "@/components/CTA";
import { Footer } from "@/components/Footer";

// Partner logos
import logoAmazon from "@/assets/logo-amazon.png";
import logoEtsy from "@/assets/logo-etsy.png";
import logoHotmart from "@/assets/logo-hotmart.svg";
import logoShopify from "@/assets/logo-shopify.png";
import logoKindle from "@/assets/logo-kindle.png";

const partnerLogos = [
  { src: logoAmazon, alt: "Amazon", height: "h-8 md:h-12" },
  { src: logoEtsy, alt: "Etsy", height: "h-8 md:h-12" },
  { src: logoShopify, alt: "Shopify", height: "h-8 md:h-12" },
  { src: logoHotmart, alt: "Hotmart", height: "h-6 md:h-10" },
  { src: logoKindle, alt: "Amazon Kindle", height: "h-6 md:h-10" },
];

const Index = () => {
  return (
    <main className="min-h-screen">
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
                    className={`${logo.height} w-auto object-contain shrink-0 brightness-0 invert opacity-80`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Benefits />
      <Languages />
      <HowItWorks />
      <Pricing />
      <AboutMe />
      <Contact />
      <CTA />
      <Footer />
    </main>
  );
};

export default Index;
