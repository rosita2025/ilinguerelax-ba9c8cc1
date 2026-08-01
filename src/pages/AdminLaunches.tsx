import { useEffect, useMemo, useState } from "react";
import { Rocket, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminNav from "@/components/admin/AdminNav";
import { useAdminKey } from "@/components/admin/AdminGate";
import ProductLaunchPanel from "@/components/admin/ProductLaunchPanel";

interface ProductLite {
  sku: string;
  name: string;
  active: boolean;
  cover_image_url: string | null;
}

/**
 * Página general de lanzamientos: elige cualquier producto (nuevo o antiguo) y
 * anúncialo a las 6 audiencias propias — compradores de la tienda, compradores
 * Hotmart, reseñas, lista de espera, carritos abandonados y newsletter.
 * Cada persona recibe un solo correo (sin duplicados).
 */
export default function AdminLaunches() {
  const { adminKey } = useAdminKey();
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [sku, setSku] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("manage-products", {
          body: { action: "list", adminKey },
        });
        if (error) throw new Error(error.message);
        const rows = ((data as { products?: ProductLite[] })?.products ?? []).map((p) => ({
          sku: p.sku, name: p.name, active: p.active, cover_image_url: p.cover_image_url ?? null,
        }));
        setProducts(rows);
        if (rows.length && !sku) setSku(rows[0].sku);
      } catch (e) {
        toast({ title: "No se pudieron cargar los productos", description: e instanceof Error ? e.message : "Error", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminKey]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return products;
    return products.filter((p) => `${p.name} ${p.sku}`.toLowerCase().includes(term));
  }, [products, q]);

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Rocket className="w-5 h-5" /> Lanzamientos · Anuncio a todas las audiencias
          </h1>
          <p className="text-sm text-muted-foreground">
            Avisa de un producto (nuevo o antiguo) a clientes nuevos y clientes viejos: compradores de la tienda,
            compradores Hotmart, reseñas, lista de espera, carritos abandonados y newsletter. Cada correo recibe
            el anuncio una sola vez.
          </p>
        </div>

        <Card className="p-4 space-y-3">
          <Label className="text-xs">Elige el producto a anunciar</Label>
          <Input placeholder="Buscar por nombre o SKU…" value={q} onChange={(e) => setQ(e.target.value)} />
          {loading ? (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Cargando productos…
            </div>
          ) : (
            <div className="max-h-72 overflow-auto rounded border divide-y">
              {filtered.map((p) => (
                <button
                  key={p.sku}
                  type="button"
                  onClick={() => setSku(p.sku)}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 ${sku === p.sku ? "bg-muted font-medium" : ""}`}
                >
                  {p.cover_image_url && (
                    <img src={p.cover_image_url} alt="" className="w-8 h-8 object-cover rounded shrink-0" />
                  )}
                  <span className="flex-1 min-w-0 truncate">{p.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{p.active ? "activo" : "inactivo"}</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="px-3 py-4 text-sm text-muted-foreground">Sin resultados.</div>
              )}
            </div>
          )}
          {sku && <div className="text-xs text-muted-foreground break-all">Seleccionado: {sku}</div>}
        </Card>

        {sku && <ProductLaunchPanel key={sku} sku={sku} adminKey={adminKey} />}
      </div>
    </div>
  );
}
