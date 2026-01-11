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

const Index = () => {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
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
