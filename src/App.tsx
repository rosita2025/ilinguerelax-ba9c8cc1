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
import Product5000Book from "./pages/Product5000Book";
import Product8000Book from "./pages/Product8000Book";
import ProductSpanish5000 from "./pages/ProductSpanish5000";
import ProductSpanish1000Verbs from "./pages/ProductSpanish1000Verbs";
import ProductSpanish500Questions from "./pages/ProductSpanish500Questions";
import Product1000Verbos from "./pages/Product1000Verbos";
import Product500Preguntas from "./pages/Product500Preguntas";
import ProductGerman5000 from "./pages/ProductGerman5000";
import ProductPortuguese5000 from "./pages/ProductPortuguese5000";
import ProductItalian5000 from "./pages/ProductItalian5000";
import ProductFrench5000 from "./pages/ProductFrench5000";
import ProductDutch5000 from "./pages/ProductDutch5000";
import Product1000Free from "./pages/Product1000Free";
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
import AdminReviews from "./pages/AdminReviews";
import DejarResena from "./pages/DejarResena";

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
                <Route path="/products/5-000-palabras-libro-fisico" element={<Product5000Book />} />
                <Route path="/products/8-000-palabras-libro-fisico" element={<Product8000Book />} />
                <Route path="/products/5-000-spanish-words-with-english-pronunciation" element={<ProductSpanish5000 />} />
                <Route path="/products/1-000-verbs-in-spanish-past-present-future-with-english-pronunciation" element={<ProductSpanish1000Verbs />} />
                <Route path="/products/500-questions-in-spanish-with-english-pronunciation" element={<ProductSpanish500Questions />} />
                <Route path="/products/1-000-verbos-esenciales-en-ingles-presente-pasado-futuro-con-pronunciacion" element={<Product1000Verbos />} />
                <Route path="/products/500-preguntas-en-ingles-con-pronunciacion-para-hispanohablantes" element={<Product500Preguntas />} />
                <Route path="/products/5-000-palabras-en-aleman-con-pronunciacion-para-hispanohablantes" element={<ProductGerman5000 />} />
                <Route path="/products/5-000-palabras-en-portugues-con-pronunciacion-para-hispanohablantes" element={<ProductPortuguese5000 />} />
                <Route path="/products/5-000-palabras-en-italiano-con-pronunciacion-para-hispanohablantes" element={<ProductItalian5000 />} />
                <Route path="/products/5-000-palabras-en-frances-con-pronunciacion-para-hispanohablantes" element={<ProductFrench5000 />} />
                <Route path="/products/5-000-palabras-en-neerlandes-con-pronunciacion-para-hispanohablantes" element={<ProductDutch5000 />} />
                <Route path="/products/1-000-palabras-en-ingles-con-pronunciacion-gratis" element={<Product1000Free />} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="/hotmart-success" element={<HotmartSuccess />} />
                <Route path="/hotmart-pending" element={<HotmartPending />} />
                <Route path="/hotmart-credit-pending" element={<HotmartCreditPending />} />
                <Route path="/sobre-nosotros" element={<AboutPage />} />
                <Route path="/contacto" element={<ContactPage />} />
                <Route path="/faq" element={<FAQPage />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/dejar-resena" element={<DejarResena />} />
                <Route path="/admin/reviews" element={<AdminReviews />} />
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
