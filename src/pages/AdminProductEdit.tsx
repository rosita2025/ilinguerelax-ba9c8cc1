import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Save, Plus, Trash2, Loader2, Lock as LockIcon, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
import { adminInvoke } from "@/lib/adminInvoke";
import { REGIONS, REGION_KEYS } from "@/lib/countryRegions";
import { COUNTRY_INFO } from "@/lib/countryInfo";
import { publishCatalogUpdate } from "@/lib/catalogSync";
import ProductImageUploader from "@/components/admin/ProductImageUploader";
import ProductUpdateNoticePanel from "@/components/admin/ProductUpdateNoticePanel";
import ProductLaunchPanel from "@/components/admin/ProductLaunchPanel";

interface Product {
  sku: string;
  name: string;
  description: string | null;
  learner_language: string;
  target_language: string;
  price_usd: number;
  price_usd_latam: number | null;
  price_usd_tienda: number | null;
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
  bonuses: Bonus[] | null;
  hotmart_url: string | null;
  hotmart_urls_by_country: Record<string, string>;
  hotmart_prices_by_country: Record<string, { amount: number; currency: string }>;
  store_enabled: boolean;
  excluded_countries: string[];
  store_excluded_countries: string[];
  hotmart_excluded_countries: string[];
  sku_aliases: string[];
  local_prices: Record<string, number>;
  is_physical: boolean;
}
interface Bonus { name: string; drive_url: string; access_key: string; }
const MAX_BONUSES = 4;
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
  price_usd: 0, price_usd_latam: null, price_usd_tienda: null, price_pen: null, drive_url: "", access_key: "", cover_image_url: "",
  is_upsell: false, active: false, sort_order: 0,
  bonus_name: "", bonus_drive_url: "", bonus_access_key: "",
  bonuses: [],
  hotmart_url: "",
  hotmart_urls_by_country: {},
  hotmart_prices_by_country: {},
  store_enabled: true,
  excluded_countries: [],
  store_excluded_countries: [],
  hotmart_excluded_countries: [],
  sku_aliases: [],
  local_prices: {},
  is_physical: false,
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
  // Snapshot del drive_url original al cargar → usado para exigir confirmación
  // cuando el admin lo cambia (evita pegar el link de otro producto por error).
  const [originalDriveUrl, setOriginalDriveUrl] = useState<string>("");

  const [hasDraft, setHasDraft] = useState(false);
  const draftKey = `product-draft-${sku || "nuevo"}`;

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

        // Check for local draft
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
          setHasDraft(true);
        }

        if (!isNew) {
          const found = list.find((p) => p.sku === sku);
          if (found) {
            setProduct(found);
            setOriginalDriveUrl((found.drive_url ?? "").trim());
          }
          const ups: UpsellRow[] = (data?.upsells ?? [])
            .filter((u: { product_sku: string }) => u.product_sku === sku)
            .map((u: UpsellRow) => ({ upsell_sku: u.upsell_sku, discount_pct: u.discount_pct, sort_order: u.sort_order }));
          setUpsells(ups);
        } else {
          const maxOrder = list.reduce((m, p) => Math.max(m, p.sort_order ?? 0), 0);
          setProduct((p) => ({
            ...p,
            store_enabled: true,
            active: false, // Inicia como borrador por defecto
            store_excluded_countries: [],
            hotmart_excluded_countries: [],
            sort_order: maxOrder + 1,
          }));
        }
      } catch {
        toast({ title: "Error al cargar", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
  }, [sku, adminKey, draftKey]);

  // Auto-save draft
  useEffect(() => {
    if (loading || saving || hasDraft) return;
    const timer = setTimeout(() => {
      localStorage.setItem(draftKey, JSON.stringify({ product, upsells, timestamp: Date.now() }));
    }, 2000);
    return () => clearTimeout(timer);
  }, [product, upsells, draftKey, loading, saving, hasDraft]);

  const restoreDraft = () => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const { product: p, upsells: u } = JSON.parse(saved);
        setProduct(p);
        setUpsells(u);
        setHasDraft(false);
        toast({ title: "Borrador restaurado" });
      }
    } catch {
      toast({ title: "Error al restaurar", variant: "destructive" });
    }
  };

  const discardDraft = () => {
    localStorage.removeItem(draftKey);
    setHasDraft(false);
    toast({ title: "Borrador descartado" });
  };

  // Auto-sugerir precio PEN desde USD (solo si está vacío) al crear
  useEffect(() => {
    if (!isNew) return;
    if (product.price_usd > 0 && (product.price_pen == null || product.price_pen === 0)) {
      const suggested = Math.round(product.price_usd * 3.75 * 10) / 10; // ~S/ 3.75 por USD
      setProduct((p) => ({ ...p, price_pen: suggested }));
    }
    // eslint-disable-next-line
  }, [product.price_usd]);

  const availableUpsells = useMemo(
    () => allProducts.filter((p) => p.sku !== product.sku && !upsells.find((u) => u.upsell_sku === p.sku)),
    [allProducts, product.sku, upsells]
  );

  // ⚠️ Duplicate SKU guard: bloquea crear/renombrar a un SKU ya existente para
  // evitar romper el envío digital por SKU (el matcher resuelve por SKU exacto).
  const duplicateSku = useMemo(() => {
    const trimmed = product.sku.trim().toLowerCase();
    if (!trimmed) return null;
    // Al editar, el SKU actual (parámetro de URL) es el propio → no cuenta.
    const conflict = allProducts.find(
      (p) => p.sku.toLowerCase() === trimmed && (isNew || p.sku !== sku),
    );
    return conflict ?? null;
  }, [product.sku, allProducts, isNew, sku]);

  const [skuManuallyEdited, setSkuManuallyEdited] = useState(false);

  const update = <K extends keyof Product>(k: K, v: Product[K]) => {
    setProduct((p) => {
      const next = { ...p, [k]: v };
      
      if (k === "sku") {
        setSkuManuallyEdited(true);
      }

      // Auto-generate SKU from name if creating a new product and SKU wasn't manually touched
      if (isNew && k === "name" && typeof v === "string" && !skuManuallyEdited) {
        const baseSku = v.toLowerCase()
          .trim()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
          .replace(/[^a-z0-9\s-]/g, " ") // replace special chars with space
          .trim()
          .replace(/\s+/g, "-") // spaces to hyphens
          .replace(/-+/g, "-"); // collapse multiple hyphens
        
        // Add unique suffix to avoid collisions during draft creation
        const uniqueSuffix = Math.random().toString(36).substring(2, 6);
        next.sku = baseSku ? `${baseSku}-${uniqueSuffix}` : "";
      }
      return next;
    });
  };

  // Países sin ningún canal disponible: ni Tienda (activa y no excluye) ni Hotmart (con enlace y no excluye)
  const orphanCountries = useMemo(() => {
    const storeOn = product.store_enabled;
    const hotmartOn = !!product.hotmart_url?.trim();
    if (!storeOn && !hotmartOn) return Object.keys(COUNTRY_INFO);
    const storeExc = new Set(product.store_excluded_countries ?? []);
    const hotExc = new Set(product.hotmart_excluded_countries ?? []);
    return Object.keys(COUNTRY_INFO).filter((c) => {
      const storeCovers = storeOn && !storeExc.has(c);
      const hotCovers = hotmartOn && !hotExc.has(c);
      return !storeCovers && !hotCovers;
    });
  }, [product.store_enabled, product.hotmart_url, product.store_excluded_countries, product.hotmart_excluded_countries]);

  // Detecta si las exclusiones coinciden con la "política estándar"
  const policyStatus = useMemo(() => {
    const LATAM = REGIONS.latam.codes;
    const HOTMART_BLOCKED = ["CU", "VE", "NI"];
    const expectedStore = new Set(LATAM.filter((c) => c !== "PE" && !HOTMART_BLOCKED.includes(c)));
    const expectedHot = new Set([
      ...Object.keys(COUNTRY_INFO).filter((c) => !LATAM.includes(c)),
      ...HOTMART_BLOCKED,
    ]);
    const store = new Set(product.store_excluded_countries ?? []);
    const hot = new Set(product.hotmart_excluded_countries ?? []);
    const eq = (a: Set<string>, b: Set<string>) => a.size === b.size && [...a].every((x) => b.has(x));
    if (eq(store, expectedStore) && eq(hot, expectedHot)) return "standard" as const;
    if (store.size === 0 && hot.size === 0) return "worldwide" as const;
    return "custom" as const;
  }, [product.store_excluded_countries, product.hotmart_excluded_countries]);

  const save = async (opts: { force?: boolean; confirmDrive?: boolean } = {}) => {
    if (!product.sku.trim()) return toast({ title: "SKU requerido", variant: "destructive" });
    if (!product.name.trim()) return toast({ title: "Nombre requerido", variant: "destructive" });
    if (duplicateSku) {
      return toast({
        title: "⚠️ SKU duplicado",
        description: `Ya existe el producto "${duplicateSku.name}" con el SKU "${duplicateSku.sku}". Cambia el SKU para evitar romper el envío digital.`,
        variant: "destructive",
      });
    }
    if (!opts.force && orphanCountries.length > 0) {
      const list = orphanCountries.map((c) => `${COUNTRY_INFO[c]?.flag ?? ""} ${c}`).join(", ");
      const ok = window.confirm(
        `⚠️ ${orphanCountries.length} país(es) no verán NINGÚN botón de compra:\n\n${list}\n\n¿Guardar de todas formas?`,
      );
      if (!ok) return;
    }
    // ⚠️ Guard drive_url: security confirmation prompt.
    const newDrive = (product.drive_url ?? "").trim();
    const driveChanged = !isNew && originalDriveUrl && newDrive !== originalDriveUrl && newDrive !== "";
    let confirmDriveChange = !!opts.confirmDrive;

    if (driveChanged && !confirmDriveChange) {
      const looksLikeDrive = /^https?:\/\/(drive|docs)\.google\.com\//i.test(newDrive);
      if (newDrive && !looksLikeDrive) {
        return toast({
          title: "⚠️ Enlace inválido",
          description: "drive_url debe ser un enlace de drive.google.com o docs.google.com.",
          variant: "destructive",
        });
      }
      const otherWithSame = allProducts.find(
        (p) => p.sku !== product.sku && (p.drive_url ?? "").trim() === newDrive && newDrive !== "",
      );
      if (otherWithSame) {
        return toast({
          title: "⚠️ Drive URL duplicado",
          description: `Ese enlace ya pertenece a "${otherWithSame.name}" (${otherWithSame.sku}). Un link no puede estar en dos productos.`,
          variant: "destructive",
        });
      }
      const aliasList = (product.sku_aliases ?? []).join(", ") || "(sin alias)";
      const typed = window.prompt(
        `⚠️ Confirmación de Seguridad: Cambio de Enlace de Entrega\n\n` +
          `SKU: ${product.sku}\n` +
          `Alias: ${aliasList}\n\n` +
          `Anterior:\n${originalDriveUrl || "(vacío)"}\n\n` +
          `Nuevo:\n${newDrive || "(vacío)"}\n\n` +
          `Escribe el SKU "${product.sku}" para confirmar el cambio:`,
      );
      if (typed?.trim() !== product.sku) {
        return toast({
          title: "Confirmación cancelada",
          description: "El SKU no coincide. Cambio de drive_url descartado.",
          variant: "destructive",
        });
      }
      confirmDriveChange = true;
    }
    setSaving(true);
    try {
      const { data, error } = await adminInvoke<{ success?: boolean; sku?: string; error?: string }>("manage-products", {
        body: {
          action: "upsert",
          adminKey,
          confirmDriveChange,
          product: { 
            ...product, 
            upsells,
            // Ensure boolean fields are correctly passed
            is_physical: !!product.is_physical,
            active: !!product.active,
            store_enabled: !!product.store_enabled
          },
        },
      });
      if (error) {
        // Detailed error reporting for the user
        const errorMsg = error.message || "Error al guardar el producto";
        console.error("[AdminProductEdit] Save failed:", error);
        throw new Error(errorMsg);
      }
      if (data?.error) throw new Error(data.error);

      // Revalidate: read the fresh updated_at from the DB so we broadcast a real version stamp.
      let version = Date.now();
      try {
        const { data: fresh } = await supabase
          .from("digital_products")
          .select("updated_at")
          .eq("sku", product.sku)
          .maybeSingle();
        if (fresh?.updated_at) version = new Date(fresh.updated_at).getTime();
      } catch { /* ignore */ }
      publishCatalogUpdate(product.sku, version);
      localStorage.removeItem(draftKey);
      toast({ title: "✅ Guardado correctamente" });
      navigate("/admin/productos");
    } catch (e: any) {
      // Si la función nos devolvió un 409 (Conflict) con datos estructurados para drive_url
      const detail = e.data || e;
      if (detail?.error === "drive_url_change_requires_confirmation" || detail?.requiresConfirmation) {
        setSaving(false);
        return save({ force: false, confirmDrive: false }); // Re-try will trigger the window.prompt logic above
      }

      const errorMsg = detail?.error || detail?.message || e.message || "Error al guardar el producto";
      const errorDetail = detail?.detail || "";
      
      toast({ 
        title: "Error al guardar", 
        description: errorDetail ? `${errorMsg}: ${errorDetail}` : errorMsg,
        variant: "destructive" 
      });
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
      <TooltipProvider>
      <main className="min-h-dvh bg-background p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" asChild><Link to="/admin/productos"><ArrowLeft className="w-4 h-4 mr-1" /> Volver</Link></Button>
            <Button onClick={() => save()} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
              Guardar
            </Button>
          </div>

          <h1 className="text-2xl font-bold">{isNew ? "Nuevo producto" : `Editar: ${product.name}`}</h1>
          {isNew && (
            <div className="p-3 rounded-lg border border-primary/40 bg-primary/5 text-xs space-y-1">
              <div>🌍 <b>Por defecto: Tienda mundial</b> (todos los países, sin Hotmart). Ideal para productos en español dirigidos a angloparlantes u otros idiomas.</div>
              <div>⚡ Si tienes enlace de Hotmart (típico para productos que enseñan inglés/coreano/etc. a hispanos), pégalo abajo y toca <b>«Aplicar política estándar»</b> para enrutar LATAM → Hotmart.</div>
            </div>
          )}

          {hasDraft && (
            <div className="flex items-center justify-between p-3 rounded-lg border border-amber-500/40 bg-amber-500/10 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold">⚠️ Tienes un borrador sin guardar de esta sesión.</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={restoreDraft}>Restaurar</Button>
                <Button size="sm" variant="ghost" className="h-7 text-[10px]" onClick={discardDraft}>Descartar</Button>
              </div>
            </div>
          )}

          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">1. Información básica</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="product-type" className="text-xs font-medium">Digital</Label>
                  <Switch
                    id="product-type"
                    checked={product.is_physical}
                    onCheckedChange={(v) => update("is_physical", v)}
                    className="data-[state=checked]:bg-orange-500"
                  />
                  <Label htmlFor="product-type" className="text-xs font-medium">Físico</Label>
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2">
                  SKU (identificador único · también es la URL pública /products/{product.sku || "…"})
                  {!isNew && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p>No tocar. Este SKU ya está vinculado a pagos de Stripe, Mercado Pago, PayPal, Yape/Plin, transferencias, Binance Pay y dLocal Go. Cambiarlo rompería pagos y entregas existentes.</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </Label>
                <div className="relative">
                  <Input
                    value={product.sku}
                    onChange={(e) => update("sku", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                    placeholder="ej: coreano-100-mapas"
                    readOnly={!isNew}
                    disabled={!isNew}
                    className={!isNew ? "font-mono bg-muted cursor-not-allowed" : "font-mono pr-20"}
                  />
                  {isNew && product.name && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2 text-[10px] text-muted-foreground"
                      onClick={() => {
                        setSkuManuallyEdited(false);
                        // Trigger re-generation by calling update with the same name
                        update("name", product.name);
                      }}
                    >
                      Regenerar
                    </Button>
                  )}
                </div>
                {isNew && (
                  <p className="text-xs text-muted-foreground mt-1">Solo minúsculas, números y guiones. Este SKU será permanente: no se podrá cambiar después.</p>
                )}


                {duplicateSku && (
                  <div className="mt-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
                    <div className="font-semibold text-destructive">⚠️ SKU duplicado</div>
                    <div className="text-destructive/90 mt-1">
                      Ya existe el producto <strong>"{duplicateSku.name}"</strong> con el SKU <code className="font-mono">{duplicateSku.sku}</code>.
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Guardar con un SKU repetido rompe el envío digital automático (el sistema resuelve por SKU exacto y mezclaría materiales). Cambia el SKU antes de guardar.
                    </div>
                  </div>
                )}
              </div>
              <div>
                <Label>Orden</Label>
                <Input type="number" value={product.sort_order} onChange={(e) => update("sort_order", Number(e.target.value))} />
              </div>
            </div>
            <div>
                <Label className="flex items-center gap-2">
                  Alias cortos del checkout
                  {!isNew && (
                    <>
                      <LockIcon className="w-3.5 h-3.5 text-muted-foreground" />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p>No tocar. Estos alias ya usan Stripe, Mercado Pago, PayPal, Yape/Plin, transferencias, Binance Pay y dLocal Go. Cambiarlos rompería pagos y entregas ya emitidos.</p>
                        </TooltipContent>
                      </Tooltip>
                    </>
                  )}
                </Label>
              <div className="flex gap-2">
                <Input
                  value={(product.sku_aliases ?? []).join(", ")}
                  readOnly={!isNew}
                  disabled={!isNew}
                  className={!isNew ? "bg-muted cursor-not-allowed font-mono" : undefined}
                  onChange={(e) =>
                    update(
                      "sku_aliases",
                      e.target.value
                        .split(/[,\s]+/)
                        .map((s) => s.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"))
                        .filter(Boolean),
                    )
                  }
                  placeholder="ej: 1000-palabras-italiano, upsell-1000-italiano"
                />
                {isNew && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const norm = (s: string) =>
                      s
                        .toLowerCase()
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .replace(/[^a-z0-9\s-]/g, "")
                        .trim()
                        .replace(/\s+/g, "-");
                    const base = norm(product.name || product.sku || "");
                    // Extract meaningful tokens (drop common stopwords/units)
                    const stop = new Set(["de","del","la","el","los","las","con","para","aprender","esenciales","esencial","en","y","a","por","un","una","the","of","to","and","for"]);
                    const tokens = base.split("-").filter((t) => t && !stop.has(t));
                    // Prefer: <number?> + last significant word (usually the language)
                    const numTok = tokens.find((t) => /^\d[\d.]*$/.test(t.replace(/\./g, "")));
                    const lang = [...tokens].reverse().find((t) => !/^\d/.test(t)) || tokens[tokens.length - 1] || "";
                    const short = [numTok, lang].filter(Boolean).join("-") || base.split("-").slice(0, 3).join("-");
                    const generated = [short, `upsell-${short}`].filter((a) => a && a !== product.sku);
                    const existing = new Set((product.sku_aliases ?? []).map((a) => a.toLowerCase()));
                    for (const g of generated) existing.add(g);
                    update("sku_aliases", Array.from(existing));
                    toast({ title: "Aliases generados", description: generated.join(", ") });
                  }}
                >
                  Auto
                </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {isNew ? (
                  <>IDs cortos que usa el carrito/checkout y que deben resolverse a este SKU al enviar el material digital (Stripe, PayPal, MP, Yape/Plin). Pulsa <strong>Auto</strong> para generarlos. Después de guardar quedarán bloqueados.</>
                ) : (
                  <>🔒 Bloqueado: estos alias ya los usan Stripe, PayPal, Mercado Pago, dLocal y Yape/Plin en pagos y entregas emitidas. Cambiarlos rompería los envíos. El <b>nombre</b> del producto sí se puede cambiar sin riesgo.</>
                )}
              </p>
            </div>

            {/* Mapa de aliases + destinos: auditoría en un solo vistazo */}
            <div className="rounded-md border bg-muted/30 p-3">
              <div className="text-sm font-semibold mb-2">🔍 Mapeo de aliases y destino de envío</div>
              {(() => {
                const others = allProducts.filter((p) => p.sku !== product.sku);
                const aliasIndex = new Map<string, string>(); // alias → sku
                for (const p of others) for (const a of p.sku_aliases ?? []) aliasIndex.set(a.toLowerCase(), p.sku);
                const skuIndex = new Map(allProducts.map((p) => [p.sku, p]));
                const rows: { alias: string; target: string; drive: string | null; conflict?: string; kind: "self" | "upsell" }[] = [];
                // Aliases del producto actual → apuntan a sí mismo
                for (const a of product.sku_aliases ?? []) {
                  const conflict = aliasIndex.get(a.toLowerCase());
                  rows.push({ alias: a, target: product.sku || "(sin SKU)", drive: product.drive_url, conflict, kind: "self" });
                }
                // Upsells configurados → destino = SKU real del upsell
                for (const u of upsells) {
                  const dest = skuIndex.get(u.upsell_sku);
                  rows.push({
                    alias: `upsell → ${u.upsell_sku}`,
                    target: u.upsell_sku,
                    drive: dest?.drive_url ?? null,
                    conflict: dest ? undefined : "SKU no existe",
                    kind: "upsell",
                  });
                }
                if (!rows.length) {
                  return <div className="text-xs text-muted-foreground">Aún no hay aliases ni upsells. Añade aliases arriba o upsells más abajo.</div>;
                }
                return (
                  <div className="space-y-1.5">
                    {rows.map((r, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs font-mono">
                        <span className={r.kind === "upsell" ? "text-blue-600" : "text-emerald-600"}>
                          {r.kind === "upsell" ? "🎁" : "→"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div>
                            <span className="font-semibold">{r.alias}</span>
                            <span className="text-muted-foreground"> → </span>
                            <span>{r.target}</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {r.drive ? (r.drive.includes("drive.google") ? `✅ Drive: ${r.drive.slice(0, 60)}…` : `⚠️ No es Drive: ${r.drive.slice(0, 60)}…`) : "❌ Sin Drive URL"}
                          </div>
                          {r.conflict && (
                            <div className="text-[10px] text-destructive font-semibold">
                              ⚠️ {r.conflict.startsWith("SKU") ? r.conflict : `Alias duplicado: ya usado por "${r.conflict}"`}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
              <p className="text-[10px] text-muted-foreground mt-2">
                Muestra a qué SKU real se resuelve cada alias del checkout y qué Drive se enviará. Los upsells enlazan al Drive del producto destino (no duplican material).
              </p>
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
              <Label>Portada del producto</Label>
              <ProductImageUploader
                value={product.cover_image_url ?? ""}
                onChange={(url) => update("cover_image_url", url)}
                sku={product.sku}
              />
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
            <h2 className="font-semibold">3. Precios por región</h2>


            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label>Precio USD — Global</Label>
                <Input
                  type="number" step="0.01"
                  value={product.price_usd}
                  onChange={(e) => update("price_usd", Number(e.target.value))}
                  placeholder="15.00"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  🇺🇸🇨🇦🇪🇺🇬🇧🇦🇺🇯🇵 USA, Canadá, Europa, UK, Asia
                </p>
              </div>
              <div>
                <Label>Precio USD — Latinoamérica</Label>
                <Input
                  type="number" step="0.01"
                  value={product.price_usd_latam ?? ""}
                  onChange={(e) => update("price_usd_latam", e.target.value === "" ? null : Number(e.target.value))}
                  placeholder="10.00"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  🌎 MX, AR, CL, CO… Si lo dejas vacío, se usa el precio Global.
                </p>
              </div>
              <div>
                <Label>Precio PEN (Perú)</Label>
                <Input
                  type="number" step="0.01"
                  value={product.price_pen ?? ""}
                  onChange={(e) => update("price_pen", e.target.value === "" ? null : Number(e.target.value))}
                  placeholder="S/ 25.00"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  🇵🇪 Perú. Sugerido: S/ {Math.round((product.price_usd_latam ?? product.price_usd ?? 0) * 3.75 * 10) / 10}
                </p>
              </div>
              <div>
                <Label>Precio USD — Tienda online</Label>
                <Input
                  type="number" step="0.01"
                  value={product.price_usd_tienda ?? ""}
                  onChange={(e) => update("price_usd_tienda", e.target.value === "" ? null : Number(e.target.value))}
                  placeholder="7.00"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  🇻🇪🇨🇺🇳🇮 Venezuela, Cuba, Nicaragua (donde Hotmart no vende). Si vacío, se usa el precio LATAM.
                </p>
              </div>
            </div>
            <div className="border-t pt-4 mt-2 space-y-3">
              <div>
                <h3 className="font-semibold text-sm">💱 Precios exactos por moneda (LATAM)</h3>
                <p className="text-[11px] text-muted-foreground">
                  Fija el monto <b>exacto</b> que verá el cliente en su moneda (igual que Hotmart). Dejar vacío = usar conversión automática desde USD. El cobro real sigue en USD por Stripe/PayPal/MercadoPago.
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { code: "MXN", flag: "🇲🇽", label: "México" },
                  { code: "COP", flag: "🇨🇴", label: "Colombia" },
                  { code: "ARS", flag: "🇦🇷", label: "Argentina" },
                  { code: "CLP", flag: "🇨🇱", label: "Chile" },
                  { code: "BRL", flag: "🇧🇷", label: "Brasil" },
                  { code: "UYU", flag: "🇺🇾", label: "Uruguay" },
                  { code: "PYG", flag: "🇵🇾", label: "Paraguay" },
                  { code: "BOB", flag: "🇧🇴", label: "Bolivia" },
                  { code: "CRC", flag: "🇨🇷", label: "Costa Rica" },
                  { code: "DOP", flag: "🇩🇴", label: "Rep. Dominicana" },
                  { code: "GTQ", flag: "🇬🇹", label: "Guatemala" },
                  { code: "HNL", flag: "🇭🇳", label: "Honduras" },
                  { code: "NIO", flag: "🇳🇮", label: "Nicaragua" },
                  { code: "VES", flag: "🇻🇪", label: "Venezuela" },
                ].map(({ code, flag, label }) => (
                  <div key={code}>
                    <Label className="text-xs">{flag} {code} <span className="text-muted-foreground font-normal">· {label}</span></Label>
                    <Input
                      type="number" step="0.01" inputMode="decimal"
                      value={product.local_prices?.[code] ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        const next = { ...(product.local_prices || {}) };
                        if (v === "" || Number(v) <= 0) delete next[code];
                        else next[code] = Number(v);
                        update("local_prices", next);
                      }}
                      placeholder="auto"
                    />
                  </div>
                ))}
              </div>
            </div>
          </Card>



          <Card className="p-6 space-y-4">
            <h2 className="font-semibold">🛒 Canales de venta por país</h2>
            <p className="text-xs text-muted-foreground">
              Activa uno o los dos canales. Se muestran <b>en cualquier país</b> según lo que actives, salvo los países excluidos abajo.
            </p>

            {/* Tienda iLingue Relax */}
            <div className="flex items-start justify-between gap-3 p-3 border rounded-lg">
              <div className="flex-1">
                <div className="font-medium text-sm">Tienda iLingue Relax (checkout propio)</div>
                <div className="text-xs text-muted-foreground">Stripe, PayPal, Yape/Plin (Perú), Mercado Pago.</div>
              </div>
              <Switch
                checked={product.store_enabled}
                onCheckedChange={(v) => update("store_enabled", v)}
              />
            </div>

            {/* Hotmart */}
            <div className="p-3 border rounded-lg space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="font-medium text-sm">Hotmart</div>
                  <div className="text-xs text-muted-foreground">Se activa solo si pegas el enlace de compra.</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${product.hotmart_url ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                  {product.hotmart_url ? "Activo" : "Inactivo"}
                </span>
              </div>
              <Input
                value={product.hotmart_url ?? ""}
                onChange={(e) => update("hotmart_url", e.target.value)}
                placeholder="https://pay.hotmart.com/… (fallback si no hay link por país)"
              />

              {/* Enlaces Hotmart por país + precio local (para método "Hotmart 1 clic" en el checkout) */}
              <div className="mt-3 pt-3 border-t space-y-2">
                <div className="text-xs font-semibold">🌎 Enlaces Hotmart por país (1 clic desde el checkout)</div>
                <p className="text-[11px] text-muted-foreground">
                  Cada país puede tener un enlace de Hotmart distinto y un precio local exacto (ej. México MXN 180, Colombia COP 34.000). Se muestra como "Hotmart (1 clic)" dentro del checkout de la tienda.
                </p>
                {Object.entries(product.hotmart_urls_by_country ?? {}).map(([cc, url]) => {
                  const price = product.hotmart_prices_by_country?.[cc];
                  return (
                    <div key={cc} className="grid grid-cols-[70px_1fr_100px_80px_36px] gap-1.5 items-center">
                      <span className="text-xs font-mono font-semibold">
                        {COUNTRY_INFO[cc]?.flag ?? ""} {cc}
                      </span>
                      <Input
                        value={url}
                        onChange={(e) => {
                          const next = { ...(product.hotmart_urls_by_country ?? {}) };
                          next[cc] = e.target.value;
                          update("hotmart_urls_by_country", next);
                        }}
                        placeholder="https://pay.hotmart.com/…"
                        className="h-8 text-xs"
                      />
                      <Input
                        type="number"
                        step="0.01"
                        value={price?.amount ?? ""}
                        onChange={(e) => {
                          const next = { ...(product.hotmart_prices_by_country ?? {}) };
                          const amt = e.target.value === "" ? 0 : Number(e.target.value);
                          next[cc] = { amount: amt, currency: price?.currency ?? "USD" };
                          update("hotmart_prices_by_country", next);
                        }}
                        placeholder="180"
                        className="h-8 text-xs"
                      />
                      <Input
                        value={price?.currency ?? ""}
                        onChange={(e) => {
                          const next = { ...(product.hotmart_prices_by_country ?? {}) };
                          next[cc] = { amount: price?.amount ?? 0, currency: e.target.value.toUpperCase().slice(0, 3) };
                          update("hotmart_prices_by_country", next);
                        }}
                        placeholder="MXN"
                        className="h-8 text-xs uppercase"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          const u = { ...(product.hotmart_urls_by_country ?? {}) };
                          const pp = { ...(product.hotmart_prices_by_country ?? {}) };
                          delete u[cc]; delete pp[cc];
                          update("hotmart_urls_by_country", u);
                          update("hotmart_prices_by_country", pp);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  );
                })}
                <div className="flex items-center gap-2 pt-1">
                  <select
                    className="h-8 text-xs border border-input rounded-md px-2 bg-background flex-1"
                    onChange={(e) => {
                      const cc = e.target.value;
                      if (!cc || (product.hotmart_urls_by_country ?? {})[cc]) return;
                      const next = { ...(product.hotmart_urls_by_country ?? {}), [cc]: "" };
                      update("hotmart_urls_by_country", next);
                      e.target.value = "";
                    }}
                    defaultValue=""
                  >
                    <option value="">+ Añadir país…</option>
                    {Object.entries(COUNTRY_INFO)
                      .filter(([cc]) => !(product.hotmart_urls_by_country ?? {})[cc])
                      .map(([cc, info]) => (
                        <option key={cc} value={cc}>{info.flag} {cc} · {info.name}</option>
                      ))}
                  </select>
                </div>
              </div>
            </div>


            {/* Presets rápidos: 2 políticas comunes */}
            <div className="grid md:grid-cols-2 gap-3">
              <div className="p-3 border-2 border-primary/40 rounded-lg bg-primary/5 space-y-2">
                <div className="text-sm font-semibold">⚡ Política estándar</div>
                <p className="text-xs text-muted-foreground">
                  Para productos que enseñan <b>inglés/coreano/etc. a hispanos</b>.<br />
                  <b>Hotmart</b>: solo LATAM (excepto 🇨🇺🇻🇪🇳🇮).<br />
                  <b>Tienda</b>: mundo + 🇵🇪, oculta en el resto de LATAM.
                </p>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    const LATAM = REGIONS.latam.codes;
                    const HOTMART_BLOCKED = ["CU", "VE", "NI"];
                    const storeExcl = LATAM.filter((c) => c !== "PE" && !HOTMART_BLOCKED.includes(c));
                    const allCodes = Object.keys(COUNTRY_INFO);
                    const hotExcl = Array.from(new Set([
                      ...allCodes.filter((c) => !LATAM.includes(c)),
                      ...HOTMART_BLOCKED,
                    ]));
                    update("store_excluded_countries", storeExcl);
                    update("hotmart_excluded_countries", hotExcl);
                    update("store_enabled", true);
                  }}
                >
                  Aplicar estándar
                </Button>
              </div>

              <div className="p-3 border-2 border-emerald-400/60 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 space-y-2">
                <div className="text-sm font-semibold">🌍 Tienda mundial (sin Hotmart)</div>
                <p className="text-xs text-muted-foreground">
                  Para productos que enseñan <b>español a angloparlantes</b> u otros idiomas — o cuando <b>no tienes enlace de Hotmart</b>.<br />
                  Se muestra la Tienda iLingue Relax en <b>todos los países</b>.
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    update("store_excluded_countries", []);
                    update("hotmart_excluded_countries", []);
                    update("store_enabled", true);
                    update("hotmart_url", "");
                  }}
                >
                  Aplicar tienda mundial
                </Button>
              </div>
            </div>


            {/* Resumen visual de política activa y canales habilitados */}
            {(() => {
              const storeOn = product.store_enabled;
              const hotOn = !!product.hotmart_url?.trim();
              const badge =
                policyStatus === "standard"
                  ? { label: "⚡ Política estándar", cls: "bg-primary/15 text-primary border-primary/40" }
                  : policyStatus === "worldwide"
                  ? { label: "🌍 Tienda mundial (sin exclusiones)", cls: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/40" }
                  : { label: "🛠️ Configuración personalizada", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40" };
              return (
                <div className="p-3 border rounded-lg bg-muted/30 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">Política activa</span>
                    <span className={`text-xs px-2 py-1 rounded-full border ${badge.cls}`}>{badge.label}</span>
                  </div>
                  {policyStatus === "standard" && (
                    <div className="text-xs text-muted-foreground">
                      Hotmart <b>solo LATAM</b> (excepto 🇨🇺 🇻🇪 🇳🇮) · Tienda <b>mundial excepto LATAM</b> (con 🇵🇪 incluido).
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-2 pt-1">
                    {/* Tienda */}
                    <div className={`p-2 rounded border text-xs ${storeOn ? "border-green-500/40 bg-green-500/10" : "border-border bg-muted/40 opacity-60"}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">🛒 Tienda iLingue Relax</span>
                        <span className={storeOn ? "text-green-700 dark:text-green-400" : "text-muted-foreground"}>
                          {storeOn ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                      {storeOn && (
                        <div className="mt-1 text-muted-foreground truncate">
                          Enlace: <a href={`/checkouts/${product.sku}`} target="_blank" rel="noreferrer" className="text-primary underline">/checkouts/{product.sku}</a>
                        </div>
                      )}
                    </div>

                    {/* Hotmart */}
                    <div className={`p-2 rounded border text-xs ${hotOn ? "border-[#EF4E23]/40 bg-[#EF4E23]/10" : "border-border bg-muted/40 opacity-60"}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">🔥 Hotmart</span>
                        <span className={hotOn ? "text-[#EF4E23]" : "text-muted-foreground"}>
                          {hotOn ? "Activo" : "Sin enlace"}
                        </span>
                      </div>
                      {hotOn && (
                        <div className="mt-1 text-muted-foreground truncate">
                          Enlace: <a href={product.hotmart_url!} target="_blank" rel="noreferrer" className="text-primary underline">{product.hotmart_url}</a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Resumen de cobertura */}
            {orphanCountries.length > 0 ? (
              <div className="text-xs p-3 rounded border border-destructive/40 bg-destructive/10 text-destructive space-y-1">
                <div className="font-semibold">⚠️ {orphanCountries.length} país(es) sin ningún botón de compra:</div>
                <div className="flex flex-wrap gap-1">
                  {orphanCountries.slice(0, 40).map((c) => (
                    <span key={c} className="px-1.5 py-0.5 bg-background/60 rounded">
                      {COUNTRY_INFO[c]?.flag} {c}
                    </span>
                  ))}
                  {orphanCountries.length > 40 && <span>+{orphanCountries.length - 40} más</span>}
                </div>
                <div className="text-[11px] opacity-80">Toca «Aplicar política estándar» arriba para cubrirlos automáticamente.</div>
              </div>
            ) : (
              <div className="text-xs p-2 rounded border border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400">
                ✅ Todos los países del catálogo tienen al menos un canal de compra disponible.
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              Tienda excluida en <b>{(product.store_excluded_countries ?? []).length}</b> país(es) · Hotmart excluido en <b>{(product.hotmart_excluded_countries ?? []).length}</b> país(es).
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

            <div className="pt-4 border-t border-border space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-medium text-sm">🎁 Bonos adicionales (opcional)</h3>
                  <p className="text-xs text-muted-foreground">
                    Hasta {MAX_BONUSES} bonos. Se envían junto con el producto principal en el mismo correo.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={(product.bonuses?.length ?? 0) >= MAX_BONUSES}
                  onClick={() => {
                    const list = [...(product.bonuses ?? [])];
                    if (list.length >= MAX_BONUSES) return;
                    list.push({ name: "", drive_url: "", access_key: "" });
                    update("bonuses", list);
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" /> Añadir bono
                </Button>
              </div>

              {(product.bonuses ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground italic">Sin bonos configurados.</p>
              )}

              {(product.bonuses ?? []).map((b, i) => (
                <div key={i} className="bg-muted/40 p-3 rounded-lg space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Bono #{i + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const list = [...(product.bonuses ?? [])];
                        list.splice(i, 1);
                        update("bonuses", list);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div>
                    <Label>Nombre del bono</Label>
                    <Input
                      value={b.name}
                      onChange={(e) => {
                        const list = [...(product.bonuses ?? [])];
                        list[i] = { ...list[i], name: e.target.value };
                        update("bonuses", list);
                      }}
                      placeholder="Ej: Guía completa del Hangul"
                    />
                  </div>
                  <div>
                    <Label>Enlace Google Drive</Label>
                    <Input
                      value={b.drive_url}
                      onChange={(e) => {
                        const list = [...(product.bonuses ?? [])];
                        list[i] = { ...list[i], drive_url: e.target.value };
                        update("bonuses", list);
                      }}
                      placeholder="https://drive.google.com/file/d/…"
                    />
                  </div>
                  <div>
                    <Label>Clave de acceso (opcional)</Label>
                    <Input
                      value={b.access_key}
                      onChange={(e) => {
                        const list = [...(product.bonuses ?? [])];
                        list[i] = { ...list[i], access_key: e.target.value };
                        update("bonuses", list);
                      }}
                      placeholder="Solo si el PDF la requiere"
                    />
                  </div>
                </div>
              ))}
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
                <div className="font-medium">{product.active ? "Publicado (Activo)" : "Borrador (Oculto)"}</div>
                <p className="text-xs text-muted-foreground">{product.active ? "Visible en el checkout y catálogo público." : "Guardado como borrador, no visible para clientes."}</p>
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

          {!isNew && <ProductLaunchPanel sku={sku!} adminKey={adminKey} />}

          {!isNew && <ProductUpdateNoticePanel sku={sku!} adminKey={adminKey} />}

          {!isNew && <ChangeHistoryPanel sku={sku!} adminKey={adminKey} />}


          <div className="flex justify-end">
            <Button onClick={() => save()} disabled={saving} size="lg">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
              Guardar producto
            </Button>
          </div>
        </div>
      </main>
      </TooltipProvider>
    </>
  );
};


export default AdminProductEdit;

// -----------------------------------------------------------------------------
// Change history panel: lists last 50 edits to this product so the admin can
// see exactly what was modified, by field, and when.
// -----------------------------------------------------------------------------
function ChangeHistoryPanel({ sku, adminKey }: { sku: string; adminKey: string }) {
  const [rows, setRows] = useState<Array<{ id: number; action: string; changed_fields: Record<string, { from: unknown; to: unknown }>; created_at: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke("manage-products", {
        body: { action: "history", adminKey, sku },
      });
      setRows(data?.changes ?? []);
    } finally { setLoading(false); }
  };

  useEffect(() => { if (open && rows.length === 0) load(); /* eslint-disable-next-line */ }, [open]);

  const fmt = (v: unknown): string => {
    if (v == null) return "—";
    if (typeof v === "string") return v.length > 80 ? v.slice(0, 80) + "…" : v;
    if (typeof v === "object") return JSON.stringify(v).slice(0, 120);
    return String(v);
  };

  return (
    <Card className="p-6 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">📜 Historial de cambios</h2>
          <p className="text-xs text-muted-foreground">Últimas ediciones del producto (útil para rastrear qué versión recibió cada cliente).</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { setOpen((o) => !o); if (!open) load(); }}>
          {open ? "Ocultar" : "Ver historial"}
        </Button>
      </div>
      {open && (
        <div className="space-y-2 text-xs">
          {loading && <div className="text-muted-foreground">Cargando…</div>}
          {!loading && rows.length === 0 && <div className="text-muted-foreground">Sin cambios registrados aún.</div>}
          {rows.map((r) => (
            <div key={r.id} className="border rounded p-2 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="font-mono">{new Date(r.created_at).toLocaleString()}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase ${r.action === "updated" ? "bg-amber-100 text-amber-800" : r.action === "created" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>{r.action}</span>
              </div>
              {Object.entries(r.changed_fields || {}).map(([field, diff]) => (
                <div key={field} className="pl-2">
                  <span className="font-mono text-primary">{field}</span>:{" "}
                  <span className="text-red-700 line-through">{fmt(diff?.from)}</span>{" → "}
                  <span className="text-emerald-700">{fmt(diff?.to)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

