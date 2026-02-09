import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { useCartSync } from "@/hooks/useCartSync";
import { I18nProvider } from "@/i18n/I18nContext";
import Index from "./pages/Index";
import Products from "./pages/Products";
import Product5000 from "./pages/Product5000";
import Product8000 from "./pages/Product8000";
import Product8000Book from "./pages/Product8000Book";
import ProductSpanish5000 from "./pages/ProductSpanish5000";
import Product1000Verbos from "./pages/Product1000Verbos";
import Product500Preguntas from "./pages/Product500Preguntas";
import PaymentSuccess from "./pages/PaymentSuccess";
import HotmartSuccess from "./pages/HotmartSuccess";
import HotmartPending from "./pages/HotmartPending";
import HotmartCreditPending from "./pages/HotmartCreditPending";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import FAQPage from "./pages/FAQPage";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Cart sync wrapper component
const CartSyncWrapper = ({ children }: { children: React.ReactNode }) => {
  useCartSync();
  return <>{children}</>;
};

const App = () => (
  <HelmetProvider>
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <CartSyncWrapper>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/5-000-palabras-en-ingles-con-pronunciacion-espanol-y-fonetica-uk-usa" element={<Product5000 />} />
                <Route path="/products/8-000-palabras-en-ingles-con-pronunciacion-espanol-y-fonetica-uk-usa" element={<Product8000 />} />
                <Route path="/products/8-000-palabras-libro-fisico" element={<Product8000Book />} />
                <Route path="/products/5-000-spanish-words-with-english-pronunciation" element={<ProductSpanish5000 />} />
                <Route path="/products/1-000-verbos-esenciales-en-ingles-presente-pasado-futuro-con-pronunciacion" element={<Product1000Verbos />} />
                <Route path="/products/500-preguntas-en-ingles-con-pronunciacion-para-hispanohablantes" element={<Product500Preguntas />} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="/hotmart-success" element={<HotmartSuccess />} />
                <Route path="/hotmart-pending" element={<HotmartPending />} />
                <Route path="/hotmart-credit-pending" element={<HotmartCreditPending />} />
                <Route path="/sobre-nosotros" element={<AboutPage />} />
                <Route path="/contacto" element={<ContactPage />} />
                <Route path="/faq" element={<FAQPage />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </CartSyncWrapper>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </I18nProvider>
  </HelmetProvider>
);

export default App;
