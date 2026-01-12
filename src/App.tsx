import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Index from "./pages/Index";
import Products from "./pages/Products";
import Product5000 from "./pages/Product5000";
import Product8000 from "./pages/Product8000";
import Product8000Book from "./pages/Product8000Book";
import ProductSpanish5000 from "./pages/ProductSpanish5000";
import PaymentSuccess from "./pages/PaymentSuccess";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import FAQPage from "./pages/FAQPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/productos" element={<Products />} />
          <Route path="/products/5-000-palabras-en-ingles-con-pronunciacion-espanol-y-fonetica-uk-usa" element={<Product5000 />} />
          <Route path="/products/8-000-palabras-en-ingles-con-pronunciacion-espanol-y-fonetica-uk-usa" element={<Product8000 />} />
          <Route path="/products/8-000-palabras-libro-fisico" element={<Product8000Book />} />
          <Route path="/products/spanish-5000-words" element={<ProductSpanish5000 />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/sobre-nosotros" element={<AboutPage />} />
          <Route path="/contacto" element={<ContactPage />} />
          <Route path="/faq" element={<FAQPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
