import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { getLastCheckoutForPurchase, trackSpanishRelaxEvent } from "@/hooks/useMetaPixel";
import { trackGAEvent } from "@/hooks/useGoogleAnalytics";
import {
  CheckCircle,
  Download,
  MessageCircle,
  Mail,
  PartyPopper,
  Heart,
  ArrowRight,
} from "lucide-react";

const PaymentSuccess = () => {
  const [confetti, setConfetti] = useState(true);

  useEffect(() => {
    const lastCheckout = getLastCheckoutForPurchase();
    const contentName = typeof lastCheckout?.content_name === "string" ? lastCheckout.content_name : "Spanish Relax - 5,000 Words (Digital)";
    const contentIds = Array.isArray(lastCheckout?.content_ids) && lastCheckout.content_ids.length ? lastCheckout.content_ids : ["product-spanish-5000-digital"];
    const value = typeof lastCheckout?.value === "number" ? lastCheckout.value : 22;
    const currency = typeof lastCheckout?.currency === "string" ? lastCheckout.currency : "USD";

    // Fire Purchase event for Meta Pixel (with eventID for deduplication)
    trackSpanishRelaxEvent("Purchase", {
      content_name: contentName,
      content_category: "Digital Book",
      content_ids: contentIds,
      content_type: "product",
      value,
      currency,
      num_items: 1,
      __skipFunnelLog: true,
    });

    // Google Analytics 4: purchase (Shopify)
    const urlParams = new URLSearchParams(window.location.search);
    trackGAEvent("purchase", {
      transaction_id: urlParams.get("order") || urlParams.get("transaction") || `shopify_${Date.now()}`,
      currency,
      value,
      payment_provider: "stripe",
      items: [
        {
          item_id: String(contentIds[0] || "product-spanish-5000-digital"),
          item_name: contentName,
          item_category: "Digital Book",
          price: value,
          quantity: 1,
        },
      ],
    });

    // Hide confetti after animation
    const timer = setTimeout(() => setConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const downloadToken = new URLSearchParams(window.location.search).get("t");


  const handleWhatsApp = () => {
    window.open("https://wa.me/112512724704?text=Hello!%20I%20just%20purchased%20Spanish%20Relax%205,000%20Words", "_blank");
  };

  const handleEmail = () => {
    window.location.href = "mailto:hola@ilinguerelax.com?subject=Spanish%20Relax%20Purchase%20Support";
  };

  return (
    <main className="min-h-screen bg-background">
      <SEO
        title="Thank You For Your Purchase! - Spanish Relax"
        description="Your order has been confirmed. Download your Spanish Relax 5,000 Words eBook now!"
      />
      <Navbar />

      {/* Confetti Animation */}
      {confetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: ['#22c55e', '#8b5cf6', '#f59e0b', '#ec4899', '#3b82f6'][Math.floor(Math.random() * 5)],
              }}
              initial={{ y: -20, opacity: 1, rotate: 0 }}
              animate={{
                y: window.innerHeight + 20,
                opacity: 0,
                rotate: Math.random() * 360,
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                delay: Math.random() * 2,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      )}

      {/* Success Content */}
      <section className="pt-28 pb-20 md:pt-36 md:pb-28">
        <div className="container px-4 md:px-6">
          <motion.div
            className="max-w-2xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Success Icon */}
            <motion.div
              className="mb-8 inline-flex"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            >
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-14 h-14 text-green-500" />
                </div>
                <motion.div
                  className="absolute -top-2 -right-2"
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.5, type: "spring" }}
                >
                  <PartyPopper className="w-8 h-8 text-amber-500" />
                </motion.div>
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1
              className="text-3xl md:text-5xl font-bold text-foreground mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Thank You For Your Purchase!
            </motion.h1>

            <motion.p
              className="text-lg md:text-xl text-muted-foreground mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Your Spanish Relax - 5,000 Words eBook is ready for download!
            </motion.p>

            {/* Download Card */}
            <motion.div
              className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-3xl border-2 border-green-500/30 shadow-xl p-8 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-4">
                📚 Download Your eBook
              </h2>
              <p className="text-muted-foreground mb-6">
                Click the button below to access your Spanish Relax - 5,000 Words PDF
              </p>
              <Button 
                onClick={handleDownload}
                size="lg" 
                className="bg-green-500 hover:bg-green-600 text-white font-bold text-lg px-8 py-6 h-auto"
              >
                <Download className="w-6 h-6 mr-2" />
                Download Now
              </Button>
            </motion.div>

            {/* Contact Info Card */}
            <motion.div
              className="bg-card rounded-3xl border border-border shadow-card p-8 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <h2 className="text-xl font-semibold text-foreground mb-6">
                Need Help? Contact Us
              </h2>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={handleWhatsApp}
                  variant="outline" 
                  size="lg"
                  className="bg-green-500/10 border-green-500/30 hover:bg-green-500/20 text-green-600"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  WhatsApp: +1 251 272 4704
                </Button>
                <Button 
                  onClick={handleEmail}
                  variant="outline" 
                  size="lg"
                  className="bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20 text-purple-600"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  hola@ilinguerelax.com
                </Button>
              </div>
            </motion.div>

            {/* Thank You Message */}
            <motion.div
              className="flex items-center justify-center gap-2 text-muted-foreground mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <Heart className="w-5 h-5 text-red-500 fill-red-500" />
              <span>Thank you for choosing Spanish Relax!</span>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Link to="/">
                <Button variant="outline" size="lg">
                  Back to Home
                </Button>
              </Link>
              <Link to="/products">
                <Button variant="hero" size="lg">
                  Explore More Products
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default PaymentSuccess;
