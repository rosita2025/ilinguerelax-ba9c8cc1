import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Eye, EyeOff, Pencil, Package, Search, ExternalLink, ArrowUpDown, Trash2, LayoutGrid, List, ShoppingCart } from "lucide-react";
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
  description?: string | null;
  learner_language: string;
  target_language: string;
  price_usd: number;
  price_usd_latam?: number | null;
  price_usd_tienda?: number | null;
  price_pen: number | null;
  local_prices?: Record<string, number> | null;

  drive_url: string | null;
  is_upsell: boolean;
  active: boolean;
  sort_order: number;
  cover_image_url: string | null;
  hotmart_url: string | null;
  store_enabled: boolean;
  store_excluded_countries: string[] | null;
  hotmart_excluded_countries: string[] | null;
  is_physical: boolean;
}

const FLAGS: Record<string, string> = {
  es: "🇪🇸", en: "🇬🇧", fr: "🇫🇷", pt: "🇵🇹", ko: "🇰🇷",
  de: "🇩🇪", it: "🇮🇹", ja: "🇯🇵", nl: "🇳🇱",
};

function effectivePen(p: Pick<Product, "price_pen" | "local_prices">): number | null {
  const manual = p.local_prices?.["PEN"];
  if (typeof manual === "number" && manual > 0) return manual;
  return p.price_pen != null && Number(p.price_pen) > 0 ? Number(p.price_pen) : null;
}

/**
 * Los 3 tiers USD que realmente usa el sitio (ver `useCountryTierRouting`):
 *  - LATAM        → price_usd_latam
 *  - Anglo / EU   → price_usd
 *  - Asia / Resto → price_usd_tienda
 * Cuando un tier no tiene precio propio, hereda el precio Anglo/EU.
 */
function tierPrices(p: Pick<Product, "price_usd" | "price_usd_latam" | "price_usd_tienda">) {
  const base = Number(p.price_usd) || 0;
  const latam = p.price_usd_latam != null && Number(p.price_usd_latam) > 0 ? Number(p.price_usd_latam) : base;
  const rest = p.price_usd_tienda != null && Number(p.price_usd_tienda) > 0 ? Number(p.price_usd_tienda) : base;
  return { latam, global: base, rest };
}


const AdminProducts = () => {
  const { adminKey } = useAdminKey();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [formatFilter, setFormatFilter] = useState<"all" | "digital" | "physical">("all");
  const [view, setView] = useState<"grid" | "table">(() => (localStorage.getItem("adminProductsView") as "grid" | "table") || "grid");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => { localStorage.setItem("adminProductsView", view); }, [view]);


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

  // Sanity: warn si un producto activo no tiene entrada en CHECKOUT_CATALOG
  // (para que /checkouts/:slug funcione con slug corto). ProductDynamic también
  // acepta el sku completo como slug, pero conviene registrar el alias.
  useEffect(() => {
    if (!products.length) return;
    (async () => {
      try {
        const mod = await import("@/config/checkoutCatalog");
        const knownSkus = new Set(
          Object.values(mod.CHECKOUT_CATALOG)
            .map((c) => c.adminSku)
            .filter(Boolean) as string[],
        );
        const missing = products
          .filter((p) => p.active && !knownSkus.has(p.sku))
          .map((p) => p.sku);
        if (missing.length) {
          console.warn("[CHECKOUT_CATALOG] Productos activos sin alias corto en catalogo:", missing);
        }
      } catch { /* ignore */ }
    })();
  }, [products]);

  const toggle = async (sku: string, active: boolean) => {
    try {
      const { error } = await supabase.functions.invoke("manage-products", {
        body: { action: "toggle", sku, active: !active, adminKey },
      });
      if (error) throw error;
      toast({ title: !active ? "Publicado (Activo)" : "Ocultado (Borrador)" });
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

  const duplicate = async (sourceSku: string) => {
    const source = products.find(p => p.sku === sourceSku);
    if (!source) return;
    
    const newName = `${source.name} (Copia)`;
    const newSku = `${source.sku}-copy-${Math.random().toString(36).substring(2, 6)}`;
    
    if (!confirm(`¿Crear una copia del producto "${source.name}"?\nSe heredarán precios, exclusiones y configuración, pero deberás configurar el nuevo SKU y Drive URL.`)) return;
    
    setLoading(true);
    try {
      // Fetch full product details including local_prices
      const { data: fullSource } = await supabase.functions.invoke("manage-products", {
        body: { action: "list", adminKey },
      });
      const sourceDetails = fullSource?.products?.find((p: any) => p.sku === sourceSku);
      
      if (!sourceDetails) throw new Error("No se pudo obtener el detalle del producto original");

      const { data, error } = await supabase.functions.invoke("manage-products", {
        body: { 
          action: "upsert", 
          adminKey,
          product: {
            ...sourceDetails,
            sku: newSku,
            name: newName,
            active: false, // Borrador
            drive_url: null, // Forzar nuevo link
            access_key: null,
            sort_order: (products.reduce((max, p) => Math.max(max, p.sort_order), 0)) + 1
          }
        },
      });
      
      if (error) throw error;
      toast({ title: "Producto duplicado", description: "Editando la nueva copia..." });
      window.location.href = `/admin/productos/${newSku}`;
    } catch (e: any) {
      toast({ title: "Error al duplicar", description: e?.message, variant: "destructive" });
      setLoading(false);
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
    if (formatFilter === "digital" && p.is_physical) return false;
    if (formatFilter === "physical" && !p.is_physical) return false;
    return true;
  });

  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, catFilter, formatFilter]);

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
            
            <div className="flex gap-1 border-l pl-2 border-border mr-1">
              <Button 
                variant={formatFilter === "digital" ? "default" : "outline"} 
                size="sm" 
                onClick={() => setFormatFilter(prev => prev === "digital" ? "all" : "digital")}
                className="h-8 px-2 text-[10px]"
              >
                Digital
              </Button>
              <Button 
                variant={formatFilter === "physical" ? "default" : "outline"} 
                size="sm" 
                onClick={() => setFormatFilter(prev => prev === "physical" ? "all" : "physical")}
                className="h-8 px-2 text-[10px]"
              >
                Físico
              </Button>
            </div>
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
            <div className="ml-auto inline-flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setView("grid")}
                className={`px-3 py-1.5 text-xs inline-flex items-center gap-1 ${view === "grid" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                title="Vista de tarjetas"
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Tarjetas
              </button>
              <button
                onClick={() => setView("table")}
                className={`px-3 py-1.5 text-xs inline-flex items-center gap-1 border-l border-border ${view === "table" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                title="Vista de tabla"
              >
                <List className="w-3.5 h-3.5" /> Tabla
              </button>
            </div>
          </div>

          {view === "grid" ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginated.length === 0 && (
                  <div className="col-span-full text-center py-10 text-muted-foreground bg-card border border-border rounded-xl">
                    No hay productos.
                  </div>
                )}
                {paginated.map((p) => (
                <div key={p.id} className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
                  <Link to={`/admin/productos/${p.sku}`} className="relative aspect-[4/3] bg-muted overflow-hidden block">
                    {p.cover_image_url ? (
                      <img
                        src={p.cover_image_url}
                        alt={p.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Package className="w-10 h-10 opacity-40" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {p.active ? (
                        <span className="text-[10px] bg-green-500/90 text-white px-2 py-0.5 rounded-full font-semibold">Activo</span>
                      ) : (
                        <span className="text-[10px] bg-gray-600/90 text-white px-2 py-0.5 rounded-full font-semibold">Borrador</span>
                      )}
                      {p.is_upsell && (
                        <span className="text-[10px] bg-fuchsia-500/90 text-white px-2 py-0.5 rounded-full font-semibold">Upsell</span>
                      )}
                      {p.is_physical && (
                        <span className="text-[10px] bg-orange-500/90 text-white px-2 py-0.5 rounded-full font-semibold">Físico</span>
                      )}
                    </div>
                    <div className="absolute top-2 right-2 text-lg bg-background/80 backdrop-blur px-1.5 py-0.5 rounded">
                      {FLAGS[p.learner_language] ?? p.learner_language} → {FLAGS[p.target_language] ?? p.target_language}
                    </div>
                  </Link>

                  <div className="p-3 flex flex-col flex-1">
                    <div className="font-semibold text-sm line-clamp-2 mb-1">{p.name}</div>
                    <div className="text-[10px] text-muted-foreground font-mono truncate mb-2">{p.sku}</div>
                    {p.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{p.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-1.5 mb-3 text-[10px]">
                      <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">LATAM ${tierPrices(p).latam.toFixed(2)}</span>
                      <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">ANGLO/EU ${tierPrices(p).global.toFixed(2)}</span>
                      <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">ASIA/RESTO ${tierPrices(p).rest.toFixed(2)}</span>

                      {!p.drive_url && (
                        <span className="ml-auto text-[10px] text-red-500">Sin Drive</span>
                      )}
                    </div>

                    <div className="mt-auto flex flex-wrap gap-1">
                      <Button size="sm" variant="outline" className="h-8 text-[10px] flex-1 px-1" asChild>
                        <a href={`/products/${p.sku}`} target="_blank" rel="noreferrer">
                          <ExternalLink className="w-3 h-3 mr-1" /> Ver
                        </a>
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 text-[10px] flex-1 px-1" asChild>
                        <a href={`/checkouts/${p.sku}`} target="_blank" rel="noreferrer">
                          <ShoppingCart className="w-3 h-3 mr-1" /> Pay
                        </a>
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 text-[10px] flex-1 px-1" onClick={() => duplicate(p.sku)}>
                        <Plus className="w-3 h-3 mr-1" /> Clon
                      </Button>
                      <Button size="sm" variant="default" className="h-8 text-[10px] flex-1 px-1" asChild>
                        <Link to={`/admin/productos/${p.sku}`}>
                          <Pencil className="w-3 h-3 mr-1" /> Edit
                        </Link>
                      </Button>
                    </div>
                    <div className="flex gap-1 mt-1">
                      <Button size="sm" variant="ghost" className="h-7 text-[10px] flex-1" onClick={() => toggle(p.sku, p.active)}>
                        {p.active ? <><EyeOff className="w-3 h-3 mr-1" /> Ocultar</> : <><Eye className="w-3 h-3 mr-1" /> Publicar</>}
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-[10px] text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => remove(p.sku, p.name)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              </div>
              <PaginationControls 
                total={filtered.length} 
                current={currentPage} 
                onChange={setCurrentPage} 
                itemsPerPage={itemsPerPage} 
              />
            </div>
          ) : (
            <div className="space-y-4">
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
                {paginated.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">No hay productos.</td></tr>
                )}
                {paginated.map((p) => (
                  <tr key={p.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{p.sku}</div>
                    </td>
                    <td className="px-4 py-3 text-lg">
                      {FLAGS[p.learner_language] ?? p.learner_language} → {FLAGS[p.target_language] ?? p.target_language}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-semibold">LATAM ${tierPrices(p).latam.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">ANGLO/EU ${tierPrices(p).global.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">ASIA/RESTO ${tierPrices(p).rest.toFixed(2)}</div>

                    </td>
                    <td className="px-4 py-3 text-center">
                      {p.drive_url ? (
                        <a href={p.drive_url} target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-1">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      ) : <span className="text-xs text-red-500">Sin enlace</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col gap-1 items-center">
                        {p.is_physical ? (
                          <span className="text-[10px] bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">Físico</span>
                        ) : (
                          <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Digital</span>
                        )}
                        {p.is_upsell && <span className="text-[10px] bg-fuchsia-100 text-fuchsia-800 px-2 py-0.5 rounded-full">Upsell</span>}
                      </div>
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
                        <Button size="sm" variant="ghost" onClick={() => duplicate(p.sku)} title="Clonar">
                          <Plus className="w-4 h-4" />
                        </Button>
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
          <PaginationControls 
            total={filtered.length} 
            current={currentPage} 
            onChange={setCurrentPage} 
            itemsPerPage={itemsPerPage} 
          />
        </div>
        )}


          <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3" /> El orden se ajusta desde el formulario de cada producto (campo "Orden").
          </p>
        </div>
      </main>
    </>
  );
};

const PaginationControls = ({ total, current, onChange, itemsPerPage }: { total: number; current: number; onChange: (p: number) => void; itemsPerPage: number }) => {
  if (total <= itemsPerPage) return null;
  const maxPage = Math.ceil(total / itemsPerPage);
  
  return (
    <div className="flex items-center justify-between px-2 py-4 border-t border-border mt-2">
      <span className="text-xs text-muted-foreground">
        Mostrando {Math.min(total, (current - 1) * itemsPerPage + 1)} - {Math.min(total, current * itemsPerPage)} de {total}
      </span>
      <div className="flex gap-2">
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => onChange(Math.max(1, current - 1))}
          disabled={current === 1}
          className="h-8 px-2"
        >
          Anterior
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => onChange(Math.min(maxPage, current + 1))}
          disabled={current >= maxPage}
          className="h-8 px-2"
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
};

export default AdminProducts;
