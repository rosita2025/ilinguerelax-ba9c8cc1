import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Save, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminNav from "@/components/admin/AdminNav";
import { useAdminKey } from "@/components/admin/AdminGate";

interface Product {
  sku: string;
  name: string;
  description: string | null;
  learner_language: string;
  target_language: string;
  price_usd: number;
  price_pen: number | null;
  drive_url: string | null;
  access_key: string | null;
  cover_image_url: string | null;
  is_upsell: boolean;
  active: boolean;
  sort_order: number;
  bonus_name: string | null;
  bonus_drive_url: string | null;
  bonus_access_key: string | null;
}
interface UpsellRow { upsell_sku: string; discount_pct: number; sort_order: number; }

const LANGS = [
  { code: "es", label: "Español 🇪🇸" },
  { code: "en", label: "Inglés 🇬🇧" },
  { code: "fr", label: "Francés 🇫🇷" },
  { code: "pt", label: "Portugués 🇵🇹" },
  { code: "ko", label: "Coreano 🇰🇷" },
  { code: "de", label: "Alemán 🇩🇪" },
  { code: "it", label: "Italiano 🇮🇹" },
  { code: "ja", label: "Japonés 🇯🇵" },
  { code: "nl", label: "Neerlandés 🇳🇱" },
];

const EMPTY: Product = {
  sku: "", name: "", description: "", learner_language: "es", target_language: "en",
  price_usd: 0, price_pen: null, drive_url: "", access_key: "", cover_image_url: "",
  is_upsell: false, active: true, sort_order: 0,
};

const AdminProductEdit = () => {
  const { sku } = useParams();
  const isNew = !sku || sku === "nuevo";
  const navigate = useNavigate();
  const { adminKey } = useAdminKey();
  const { toast } = useToast();

  const [product, setProduct] = useState<Product>(EMPTY);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [upsells, setUpsells] = useState<UpsellRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("manage-products", {
          body: { action: "list", adminKey },
        });
        if (error) throw error;
        const list: Product[] = data?.products ?? [];
        setAllProducts(list);
        if (!isNew) {
          const found = list.find((p) => p.sku === sku);
          if (found) setProduct(found);
          const ups: UpsellRow[] = (data?.upsells ?? [])
            .filter((u: { product_sku: string }) => u.product_sku === sku)
            .map((u: UpsellRow) => ({ upsell_sku: u.upsell_sku, discount_pct: u.discount_pct, sort_order: u.sort_order }));
          setUpsells(ups);
        }
      } catch {
        toast({ title: "Error al cargar", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line
  }, [sku, adminKey]);

  const availableUpsells = useMemo(
    () => allProducts.filter((p) => p.sku !== product.sku && !upsells.find((u) => u.upsell_sku === p.sku)),
    [allProducts, product.sku, upsells]
  );

  const update = <K extends keyof Product>(k: K, v: Product[K]) => setProduct((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!product.sku.trim()) return toast({ title: "SKU requerido", variant: "destructive" });
    if (!product.name.trim()) return toast({ title: "Nombre requerido", variant: "destructive" });
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-products", {
        body: {
          action: "upsert",
          adminKey,
          product: { ...product, upsells },
        },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      toast({ title: "✅ Guardado" });
      navigate("/admin/productos");
    } catch (e) {
      toast({ title: (e as Error).message || "Error al guardar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <><AdminNav /><div className="min-h-dvh flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div></>
  );

  return (
    <>
      <AdminNav />
      <main className="min-h-dvh bg-background p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" asChild><Link to="/admin/productos"><ArrowLeft className="w-4 h-4 mr-1" /> Volver</Link></Button>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
              Guardar
            </Button>
          </div>

          <h1 className="text-2xl font-bold">{isNew ? "Nuevo producto" : `Editar: ${product.name}`}</h1>

          <Card className="p-6 space-y-4">
            <h2 className="font-semibold">1. Información básica</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>SKU (identificador único)</Label>
                <Input value={product.sku} onChange={(e) => update("sku", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} disabled={!isNew} placeholder="ej: patrones-especiales" />
                <p className="text-xs text-muted-foreground mt-1">Solo minúsculas, números y guiones. No se puede cambiar después.</p>
              </div>
              <div>
                <Label>Orden</Label>
                <Input type="number" value={product.sort_order} onChange={(e) => update("sort_order", Number(e.target.value))} />
              </div>
            </div>
            <div>
              <Label>Nombre</Label>
              <Input value={product.name} onChange={(e) => update("name", e.target.value)} />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea rows={3} value={product.description ?? ""} onChange={(e) => update("description", e.target.value)} />
            </div>
            <div>
              <Label>URL de portada (imagen)</Label>
              <Input value={product.cover_image_url ?? ""} onChange={(e) => update("cover_image_url", e.target.value)} placeholder="https://…" />
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="font-semibold">2. Categoría (par de idiomas)</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Idioma nativo del cliente</Label>
                <select className="w-full h-10 border border-input rounded-md px-3 bg-background" value={product.learner_language} onChange={(e) => update("learner_language", e.target.value)}>
                  {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
                </select>
              </div>
              <div>
                <Label>Idioma que va a estudiar</Label>
                <select className="w-full h-10 border border-input rounded-md px-3 bg-background" value={product.target_language} onChange={(e) => update("target_language", e.target.value)}>
                  {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
                </select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Ej: cliente <strong>francés</strong> que estudia <strong>inglés</strong> = FR → EN. El sistema filtra automáticamente qué productos y upsells mostrar según el par.
            </p>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="font-semibold">3. Precios</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Precio USD</Label>
                <Input type="number" step="0.01" value={product.price_usd} onChange={(e) => update("price_usd", Number(e.target.value))} />
              </div>
              <div>
                <Label>Precio PEN (Perú, opcional)</Label>
                <Input type="number" step="0.01" value={product.price_pen ?? ""} onChange={(e) => update("price_pen", e.target.value === "" ? null : Number(e.target.value))} placeholder="S/ 29.90" />
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="font-semibold">4. Entrega digital</h2>
            <div>
              <Label>Enlace de Google Drive (PDF)</Label>
              <Input value={product.drive_url ?? ""} onChange={(e) => update("drive_url", e.target.value)} placeholder="https://drive.google.com/file/d/…" />
              <p className="text-xs text-muted-foreground mt-1">Este enlace se envía automáticamente al cliente cuando su pago se verifica.</p>
            </div>
            <div>
              <Label>Clave de acceso (opcional)</Label>
              <Input value={product.access_key ?? ""} onChange={(e) => update("access_key", e.target.value)} placeholder="Solo si el PDF la requiere" />
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="font-semibold">5. Upsells específicos</h2>
            <p className="text-xs text-muted-foreground">Productos que se sugerirán cuando alguien compre <strong>este</strong> producto.</p>

            {upsells.length === 0 && <p className="text-sm text-muted-foreground italic">Sin upsells configurados.</p>}
            {upsells.map((u, i) => {
              const target = allProducts.find((p) => p.sku === u.upsell_sku);
              return (
                <div key={i} className="flex items-center gap-2 bg-muted/40 p-3 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{target?.name ?? u.upsell_sku}</div>
                    <div className="text-xs text-muted-foreground font-mono">{u.upsell_sku}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Input type="number" min={0} max={90} value={u.discount_pct} onChange={(e) => {
                      const v = Number(e.target.value);
                      setUpsells((arr) => arr.map((x, idx) => idx === i ? { ...x, discount_pct: v } : x));
                    }} className="w-20" />
                    <span className="text-xs">% dscto</span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setUpsells((arr) => arr.filter((_, idx) => idx !== i))}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}

            {availableUpsells.length > 0 && (
              <div className="pt-2 border-t border-border">
                <Label className="text-xs">Agregar upsell</Label>
                <select
                  className="w-full h-10 border border-input rounded-md px-3 bg-background mt-1"
                  value=""
                  onChange={(e) => {
                    if (!e.target.value) return;
                    setUpsells((arr) => [...arr, { upsell_sku: e.target.value, discount_pct: 30, sort_order: arr.length }]);
                  }}
                >
                  <option value="">— Elige un producto —</option>
                  {availableUpsells.map((p) => (
                    <option key={p.sku} value={p.sku}>{p.name} ({p.learner_language}→{p.target_language})</option>
                  ))}
                </select>
              </div>
            )}
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="font-semibold">6. Publicación</h2>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Activo</div>
                <p className="text-xs text-muted-foreground">Visible en el checkout y correos.</p>
              </div>
              <Switch checked={product.active} onCheckedChange={(v) => update("active", v)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Marcar como upsell</div>
                <p className="text-xs text-muted-foreground">Solo aparecerá como sugerencia, no como producto principal.</p>
              </div>
              <Switch checked={product.is_upsell} onCheckedChange={(v) => update("is_upsell", v)} />
            </div>
          </Card>

          <div className="flex justify-end">
            <Button onClick={save} disabled={saving} size="lg">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
              Guardar producto
            </Button>
          </div>
        </div>
      </main>
    </>
  );
};

export default AdminProductEdit;
