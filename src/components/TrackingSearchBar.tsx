import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

export const TrackingSearchBar = () => {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber || !email) return;
    setLoading(true);
    navigate(`/mi-pedido?order=${encodeURIComponent(orderNumber.trim())}&email=${encodeURIComponent(email.trim())}`);
  };

  return (
    <div className="w-full max-w-xl mx-auto p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Search className="w-5 h-5 text-accent" />
        Rastrea tu pedido físico
      </h3>
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 space-y-2">
          <Input
            placeholder="Número de pedido (ILR-...)"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-11"
            required
          />
        </div>
        <div className="flex-1 space-y-2">
          <Input
            type="email"
            placeholder="Tu correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-11"
            required
          />
        </div>
        <Button 
          type="submit" 
          disabled={loading}
          className="h-11 px-6 bg-accent hover:bg-accent/90 text-accent-foreground font-bold shadow-lg transition-all"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Rastrear"}
        </Button>
      </form>
      <p className="mt-3 text-[10px] text-white/40 text-center uppercase tracking-widest">
        Preparación: 5-7 días · Envío: 5-7 días
      </p>
    </div>
  );
};
