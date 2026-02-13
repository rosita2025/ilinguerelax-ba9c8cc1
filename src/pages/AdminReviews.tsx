import { useState, useEffect } from "react";
import { Star, CheckCircle, X, Trash2, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AdminReview {
  id: string;
  product_type: string;
  customer_name: string;
  customer_email: string | null;
  rating: number;
  review_text: string;
  photo_urls: string[];
  status: string;
  created_at: string;
}

const AdminReviews = () => {
  const [adminKey, setAdminKey] = useState("");
  const [isAuth, setIsAuth] = useState(false);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const { toast } = useToast();

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-reviews", {
        body: { action: "list", adminKey },
      });
      if (error) throw error;
      setReviews(data.reviews || []);
      setIsAuth(true);
    } catch {
      toast({ title: "Clave incorrecta o error de conexión", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: "approve" | "reject" | "delete", reviewId: string) => {
    try {
      const { error } = await supabase.functions.invoke("manage-reviews", {
        body: { action, reviewId, adminKey },
      });
      if (error) throw error;
      toast({ title: action === "approve" ? "✅ Aprobada" : action === "reject" ? "❌ Rechazada" : "🗑️ Eliminada" });
      fetchReviews();
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const filtered = reviews.filter(r => filter === "all" ? true : r.status === filter);

  if (!isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="bg-card border border-border rounded-xl p-8 max-w-sm w-full space-y-4">
          <div className="text-center">
            <Lock className="w-10 h-10 text-primary mx-auto mb-3" />
            <h1 className="text-xl font-bold text-foreground">Admin Reseñas</h1>
            <p className="text-sm text-muted-foreground mt-1">Ingresa la clave de administración</p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); fetchReviews(); }} className="space-y-3">
            <Input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Clave admin"
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Entrar"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-6">Moderación de Reseñas</h1>

        {/* Filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(["pending", "approved", "rejected", "all"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === "pending" ? `⏳ Pendientes (${reviews.filter(r => r.status === "pending").length})` :
               f === "approved" ? `✅ Aprobadas (${reviews.filter(r => r.status === "approved").length})` :
               f === "rejected" ? `❌ Rechazadas (${reviews.filter(r => r.status === "rejected").length})` :
               `📋 Todas (${reviews.length})`}
            </Button>
          ))}
        </div>

        {/* Reviews list */}
        <div className="space-y-4">
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No hay reseñas en esta categoría</p>
          )}
          {filtered.map((review) => (
            <div key={review.id} className="bg-card border border-border rounded-xl p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{review.customer_name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      review.status === "pending" ? "bg-amber-100 text-amber-800" :
                      review.status === "approved" ? "bg-green-100 text-green-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                      {review.status}
                    </span>
                    <span className="text-xs text-muted-foreground">{review.product_type}</span>
                  </div>
                  {review.customer_email && (
                    <p className="text-xs text-muted-foreground">{review.customer_email}</p>
                  )}
                </div>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                  ))}
                </div>
              </div>

              <p className="text-sm text-foreground">"{review.review_text}"</p>

              {/* Photos */}
              {review.photo_urls?.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {review.photo_urls.map((url, i) => (
                    <img key={i} src={url} alt="" className="w-20 h-20 rounded-lg object-cover border border-border" />
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {new Date(review.created_at).toLocaleDateString("es-ES")}
                </span>
                <div className="flex gap-2">
                  {review.status !== "approved" && (
                    <Button size="sm" onClick={() => handleAction("approve", review.id)}>
                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> Aprobar
                    </Button>
                  )}
                  {review.status !== "rejected" && (
                    <Button size="sm" variant="outline" onClick={() => handleAction("reject", review.id)}>
                      <X className="w-3.5 h-3.5 mr-1" /> Rechazar
                    </Button>
                  )}
                  <Button size="sm" variant="destructive" onClick={() => handleAction("delete", review.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminReviews;
