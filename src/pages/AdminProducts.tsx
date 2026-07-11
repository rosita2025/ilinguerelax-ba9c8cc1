import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Eye, EyeOff, Pencil, Package, Search, ExternalLink, ArrowUpDown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminNav from "@/components/admin/AdminNav";
import { useAdminKey } from "@/components/admin/AdminGate";


interface Product {
  id: string;
  sku: string;
  name: string;
  learner_language: string;
  target_language: string;
  price_usd: number;
  price_pen: number | null;
  drive_url: string | null;
  is_upsell: boolean;
  active: boolean;
  sort_order: number;
  cover_image_url: string | null;
  hotmart_url: string | null;
  store_enabled: boolean;
  store_excluded_countries: string[] | null;
  hotmart_excluded_countries: string[] | null;
}

const FLAGS: Record<string, string> = {
  es: "🇪🇸", en: "🇬🇧", fr: "🇫🇷", pt: "🇵🇹", ko: "🇰🇷",
  de: "🇩🇪", it: "🇮🇹", ja: "🇯🇵", nl: "🇳🇱",
};

const AdminProducts = () => {
  const { adminKey } = useAdminKey();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-products", {
        body: { action: "list", adminKey },
      });
      if (error) throw error;
      setProducts(data?.products ?? []);
    } catch {
      toast({ title: "Error al cargar productos", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); /* eslint-disable-next-line */ }, [adminKey]);

  const toggle = async (sku: string, active: boolean) => {
    try {
      const { error } = await supabase.functions.invoke("manage-products", {
        body: { action: "toggle", sku, active: !active, adminKey },
      });
      if (error) throw error;
      toast({ title: !active ? "Publicado" : "Ocultado" });
      load();
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const remove = async (sku: string, name: string) => {
    if (!confirm(`¿Eliminar "${name}" (${sku}) definitivamente? Esta acción no se puede deshacer.`)) return;
    try {
      const { error } = await supabase.functions.invoke("manage-products", {
        body: { action: "delete", sku, adminKey },
      });
      if (error) throw error;
      toast({ title: "Producto eliminado" });
      load();
    } catch (e: any) {
      toast({ title: "Error al eliminar", description: e?.message, variant: "destructive" });
    }
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) set.add(`${p.learner_language}-${p.target_language}`);
    return Array.from(set);
  }, [products]);

  const filtered = products.filter((p) => {
    if (catFilter !== "all" && `${p.learner_language}-${p.target_language}` !== catFilter) return false;
    if (search && !`${p.name} ${p.sku}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <>
      <AdminNav />
      <main className="min-h-dvh bg-background p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <header className="mb-6 flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <Package className="w-7 h-7 text-primary" /> Productos digitales
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Gestiona tu catálogo digital como en Shopify. Los cambios se aplican al checkout y a los correos de entrega automáticamente.
              </p>
            </div>
            <Button asChild>
              <Link to="/admin/productos/nuevo"><Plus className="w-4 h-4 mr-1" /> Nuevo producto</Link>
            </Button>
          </header>

          <div className="flex gap-2 mb-4 flex-wrap items-center">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por nombre o SKU…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Button variant={catFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setCatFilter("all")}>
              Todas ({products.length})
            </Button>
            {categories.map((c) => {
              const [ln, tg] = c.split("-");
              const count = products.filter((p) => `${p.learner_language}-${p.target_language}` === c).length;
              return (
                <Button key={c} variant={catFilter === c ? "default" : "outline"} size="sm" onClick={() => setCatFilter(c)}>
                  {FLAGS[ln] ?? ln} → {FLAGS[tg] ?? tg} ({count})
                </Button>
              );
            })}
            <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
              {loading ? "…" : "↻"}
            </Button>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3">Producto</th>
                  <th className="text-left px-4 py-3">Categoría</th>
                  <th className="text-right px-4 py-3">Precio</th>
                  
                  <th className="text-center px-4 py-3">Drive</th>
                  <th className="text-center px-4 py-3">Tipo</th>
                  <th className="text-center px-4 py-3">Estado</th>
                  <th className="text-right px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">No hay productos.</td></tr>
                )}
                {filtered.map((p) => (
                  <tr key={p.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{p.sku}</div>
                    </td>
                    <td className="px-4 py-3 text-lg">
                      {FLAGS[p.learner_language] ?? p.learner_language} → {FLAGS[p.target_language] ?? p.target_language}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-semibold">${Number(p.price_usd).toFixed(2)}</div>
                      {p.price_pen != null && <div className="text-xs text-muted-foreground">S/ {Number(p.price_pen).toFixed(2)}</div>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {p.drive_url ? (
                        <a href={p.drive_url} target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-1">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      ) : <span className="text-xs text-red-500">Sin enlace</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {p.is_upsell ? <span className="text-xs bg-fuchsia-100 text-fuchsia-800 px-2 py-0.5 rounded-full">Upsell</span> : <span className="text-xs text-muted-foreground">Principal</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {p.active ? (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Activo</span>
                      ) : (
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">Borrador</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <Button size="sm" variant="ghost" asChild title="Ver página pública">
                          <a href={`/products/${p.sku}`} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4" /></a>
                        </Button>
                        <Button size="sm" variant="ghost" asChild title="Ver checkout interno">
                          <a href={`/checkouts/${p.sku}`} target="_blank" rel="noreferrer">🛒</a>
                        </Button>
                        {p.hotmart_url && (
                          <Button size="sm" variant="ghost" asChild title="Abrir Hotmart">
                            <a href={p.hotmart_url} target="_blank" rel="noreferrer" className="text-[#EF4E23]">H</a>
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" asChild title="Editar">
                          <Link to={`/admin/productos/${p.sku}`}><Pencil className="w-4 h-4" /></Link>
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => toggle(p.sku, p.active)} title={p.active ? "Ocultar" : "Publicar"}>
                          {p.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => remove(p.sku, p.name)} title="Eliminar" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3" /> El orden se ajusta desde el formulario de cada producto (campo "Orden").
          </p>
        </div>
      </main>
    </>
  );
};

export default AdminProducts;
