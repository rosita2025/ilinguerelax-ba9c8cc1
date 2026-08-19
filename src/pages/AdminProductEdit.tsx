import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Save, Plus, Trash2, Loader2, Lock as LockIcon, Info, Sparkles, Star, Eye } from "lucide-react";
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
import GoogleDrivePreview from "@/components/admin/GoogleDrivePreview";
import { normalizeDriveUrl } from "@/lib/googleDrive";
import { exchangeRates, currencyConfig, formatCurrencyAmount, type Currency } from "@/i18n";
import { cn } from "@/lib/utils";




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
  compare_at_price_usd: number | null;
  compare_at_price_usd_latam: number | null;
  compare_at_price_usd_tienda: number | null;
  compare_at_price_pen: number | null;
  drive_url: string | null;
  access_key: string | null;
  cover_image_url: string | null;
  gallery_images: string[] | null;
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
  local_usd_prices: Record<string, number>;
  local_compare_at_prices: Record<string, number>;
  is_physical: boolean;
  gallery_metadata: Record<string, any>;
  rating?: number | null;
  review_count?: number | null;
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
  price_usd: 0, price_usd_latam: null, price_usd_tienda: null, price_pen: null,
  compare_at_price_usd: null, compare_at_price_usd_latam: null, compare_at_price_usd_tienda: null, compare_at_price_pen: null,
  drive_url: "", access_key: "", cover_image_url: "",
  gallery_images: [],
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
  local_usd_prices: {},
  local_compare_at_prices: {},
  is_physical: false,
  gallery_metadata: {},
  rating: 4.8,
  review_count: 120,
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
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
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

  // Auto-sugerir precios regionales y SEO cuando cambia el precio base (solo en productos nuevos)
  useEffect(() => {
    if (!isNew || product.price_usd <= 0) return;

    setProduct((p) => {
      // 1. Sugerir PEN si está vacío
      const suggestedPen = p.price_pen == null || p.price_pen === 0
        ? Math.round(p.price_usd * 3.75 * 10) / 10
        : p.price_pen;

      // 2. Generar sugerencias para local_prices (moneda local)
      const nextLocalPrices = { ...(p.local_prices || {}) };
      
      // Lista de monedas clave para auto-poblar (LATAM + Principales)
      const autoPopulate = ["EUR", "MXN", "COP", "ARS", "CLP", "BRL", "PEN"];
      
      autoPopulate.forEach(code => {
        if (!nextLocalPrices[code]) {
          const rate = exchangeRates[code as Currency];
          if (rate) {
            const raw = p.price_usd * rate;
            // Rounding logic similar to the manual suggestion button
            let rounded = raw;
            if (code === "COP") rounded = Math.round(raw / 100) * 100;
            else if (["CLP", "BRL", "PEN"].includes(code)) rounded = Math.round(raw * 10) / 10;
            else rounded = Math.round(raw);
            
            nextLocalPrices[code] = rounded;
          }
        }
      });

      // 3. SEO Metadata defaults based on name
      const nextMeta = { ...(p.gallery_metadata || {}) };
      if (!nextMeta.gallery_title && p.name) {
        nextMeta.gallery_title = `Vista previa: ${p.name}`;
      }
      if (!nextMeta.keywords && p.name) {
        const lang = LANGS.find(l => l.code === p.target_language)?.label.split(" ")[0] || "";
        nextMeta.keywords = `${p.name.toLowerCase()}, aprender ${lang.toLowerCase()}, curso digital, iLingue Relax`;
      }

      return { 
        ...p, 
        price_pen: suggestedPen, 
        local_prices: nextLocalPrices,
        gallery_metadata: nextMeta
      };
    });
    // eslint-disable-next-line
  }, [product.price_usd, isNew]);

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
      let val = v;

      // Normalize Google Drive URLs automatically
      if (typeof val === "string" && (k === "drive_url" || k === "bonus_drive_url")) {
        val = normalizeDriveUrl(val) as Product[K];
      }

      const next = { ...p, [k]: val };
      
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
          product: (() => {
            const { bonus_titles, id, created_at, updated_at, ...cleanProduct } = product as any;
            
            // Normalize and round local and regional USD prices before saving
            const normalizedLocalPrices: Record<string, number> = {};
            const normalizedLocalUsdPrices: Record<string, number> = {};
            const normalizedLocalCompareAtPrices: Record<string, number> = {};
            
            if (product.local_prices) {
              Object.entries(product.local_prices).forEach(([code, amount]) => {
                const numAmount = Number(amount);
                if (!isNaN(numAmount) && numAmount > 0) {
                  const config = currencyConfig[code as Currency];
                  const decimals = config?.decimals ?? 2;
                  normalizedLocalPrices[code] = Math.round(numAmount * Math.pow(10, decimals)) / Math.pow(10, decimals);
                }
              });
            }

            if (product.local_usd_prices) {
              Object.entries(product.local_usd_prices).forEach(([code, amount]) => {
                const numAmount = Number(amount);
                if (!isNaN(numAmount) && numAmount > 0) {
                  normalizedLocalUsdPrices[code] = Math.round(Number(amount) * 100) / 100;
                }
              });
            }

            if (product.local_compare_at_prices) {
              Object.entries(product.local_compare_at_prices).forEach(([code, amount]) => {
                const numAmount = Number(amount);
                if (!isNaN(numAmount) && numAmount > 0) {
                  const config = currencyConfig[code as Currency];
                  const decimals = config?.decimals ?? 2;
                  normalizedLocalCompareAtPrices[code] = Math.round(numAmount * Math.pow(10, decimals)) / Math.pow(10, decimals);
                }
              });
            }

            return {
              ...cleanProduct,
              local_prices: normalizedLocalPrices,
              local_usd_prices: normalizedLocalUsdPrices,
              local_compare_at_prices: normalizedLocalCompareAtPrices,
              gallery_images: Array.isArray(product.gallery_images) ? product.gallery_images : [],
              gallery_metadata: product.gallery_metadata || {},
              upsells,
              is_physical: !!product.is_physical,
              active: !!product.active,
              store_enabled: !!product.store_enabled,
              rating: product.rating,
              review_count: product.review_count
            };
          })(),
        },
      });
      if (error) {
        // Detailed error reporting for the user
        const errorMsg = error.message || "Error al guardar el producto";
        const errorDetail = (error as any).detail ? `: ${(error as any).detail}` : "";
        console.error("[AdminProductEdit] Save failed:", error);
        throw new Error(`${errorMsg}${errorDetail}`);
      }
      if (data?.error) {
        console.error("[AdminProductEdit] Function returned error:", data.error);
        throw new Error(data.error);
      }

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
      
      // Disparar evento global de actualización para invalidar cachés y refrescar UI pública
      window.dispatchEvent(new Event('pricing_updated'));
      
      toast({ title: "✅ Guardado correctamente", description: "La tienda se ha actualizado en tiempo real." });
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


  const generateAIContent = async () => {
    if (!product.name) {
      toast({ title: "Nombre requerido", description: "Ingresa un nombre para generar contenido con IA", variant: "destructive" });
      return;
    }

    setIsGeneratingAI(true);
    try {
      const prompt = `Actúa como un experto en marketing educativo y SEO para la marca "iLingue Relax". 
      Genera contenido para un producto digital llamado "${product.name}".
      El producto está diseñado para personas que quieren aprender ${product.target_language} siendo su idioma nativo el ${product.learner_language}.
      
      INSTRUCCIONES:
      1. Genera una DESCRIPCIÓN persuasiva (máximo 4 párrafos).
      2. Genera una lista de 5 KEYWORDS separadas por comas.
      3. Genera un ALT TEXT descriptivo y optimizado para SEO para la imagen principal del producto.
      4. Si el producto tiene imágenes de galería, sugiere ALT TEXTs específicos para cada una de las 3-5 imágenes basándote en lo que suelen mostrar estos materiales (previa del contenido, mapas mentales, tablas fonéticas, etc.).
      5. Genera un TÍTULO SEO corto y atractivo para la galería de imágenes (ej: "Vista previa del interior", "Lo que aprenderás").
      6. Genera una DESCRIPCIÓN SEO corta (máximo 2 párrafos) específica para la galería de imágenes.
      
      Formato de respuesta (devuelve SOLO este JSON):
      {
        "description": "...",
        "keywords": "...",
        "alt_text": "...",
        "gallery_alts": ["alt 1", "alt 2", "alt 3", "alt 4", "alt 5"],
        "gallery_title": "...",
        "gallery_description": "..."
      }`;

      const { data, error } = await adminInvoke<any>("ai-gateway", {
        body: { 
          action: "chat",
          adminKey,
          model: "google/gemini-2.0-flash",
          messages: [{ role: "user", content: prompt }]
        }
      });

      if (error) throw error;
      
      const content = data?.choices?.[0]?.message?.content;
      if (content) {
        try {
          // Clean potential markdown blocks if AI wraps JSON
          const jsonStr = content.replace(/```json\n?/, "").replace(/\n?```/, "").trim();
          const parsed = JSON.parse(jsonStr);
          if (parsed.description) update("description", parsed.description);
          
          const newMeta = { ...product.gallery_metadata };
          
          // Apply main alt text if available and cover image exists
          if (parsed.alt_text && product.cover_image_url) {
            newMeta[product.cover_image_url] = { ...newMeta[product.cover_image_url], alt: parsed.alt_text };
          }
          
          // Apply AI gallery alt texts to existing gallery images if available
          if (parsed.gallery_alts && Array.isArray(parsed.gallery_alts) && product.gallery_images?.length) {
            product.gallery_images.forEach((url, i) => {
              if (parsed.gallery_alts[i]) {
                newMeta[url] = { ...newMeta[url], alt: parsed.gallery_alts[i] };
              }
            });
          }

          if (parsed.gallery_title) {
            newMeta.gallery_title = parsed.gallery_title;
          }
          if (parsed.gallery_description) {
            newMeta.gallery_description = parsed.gallery_description;
          }
          if (parsed.keywords) {
            newMeta.keywords = parsed.keywords;
          }
          
          update("gallery_metadata", newMeta);

          toast({ 
            title: "Contenido generado con IA",
            description: `SEO Alt Text y descripción listos.`
          });
        } catch (e) {
          // Si no devolvió JSON, intentamos usarlo como descripción directamente
          update("description", content);
          toast({ title: "Contenido generado con IA" });
        }
      }
    } catch (e: any) {
      console.error("[AI Generation] failed:", e);
      toast({ 
        title: "Error con la IA", 
        description: e.message || "No se pudo generar el contenido", 
        variant: "destructive" 
      });
    } finally {
      setIsGeneratingAI(false);
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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Descripción del producto</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={generateAIContent}
                  disabled={isGeneratingAI}
                  className="gap-2 text-primary border-primary/20 hover:bg-primary/5"
                >
                  {isGeneratingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {isGeneratingAI ? "Generando..." : "Escribir con IA"}
                </Button>
              </div>
              <Textarea 
                value={product.description || ""} 
                onChange={(e) => update("description", e.target.value)}
                placeholder="Describe los beneficios y qué aprenderá el estudiante…"
                className="min-h-[200px]"
              />
            </div>
            <div>
              <Label>Portada del producto</Label>
              <ProductImageUploader
                value={product.cover_image_url ?? ""}
                onChange={(url) => update("cover_image_url", url as string)}
                metadata={product.gallery_metadata || {}}
                onMetadataChange={(meta) => update("gallery_metadata", meta)}
                sku={product.sku}
              />
            </div>
            <div>
              <Label>Galería de imágenes (3-5 imágenes recomendadas)</Label>
              <ProductImageUploader
                value={product.gallery_images ?? []}
                onChange={(urls) => update("gallery_images", urls as string[])}
                metadata={product.gallery_metadata || {}}
                onMetadataChange={(meta) => update("gallery_metadata", meta)}
                sku={product.sku}
                multiple
                maxImages={5}
              />
              
              <div className="mt-4 space-y-4 border-t pt-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Título SEO de Galería</Label>
                    <Input 
                      value={product.gallery_metadata?.gallery_title || ""} 
                      onChange={(e) => update("gallery_metadata", { ...product.gallery_metadata, gallery_title: e.target.value })}
                      placeholder="Ej: Vista previa del contenido"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Keywords SEO (separadas por coma)</Label>
                    <Input 
                      value={product.gallery_metadata?.keywords || ""} 
                      onChange={(e) => update("gallery_metadata", { ...product.gallery_metadata, keywords: e.target.value })}
                      placeholder="Ej: aprender ingles, vocabulario tecnico"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Descripción SEO de Galería</Label>
                  <Textarea 
                    value={product.gallery_metadata?.gallery_description || ""} 
                    onChange={(e) => update("gallery_metadata", { ...product.gallery_metadata, gallery_description: e.target.value })}
                    placeholder="Describe lo que se ve en las imágenes de la galería..."
                    className="min-h-[80px] text-xs"
                  />
                </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border mt-4">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Producto Físico</Label>
                  <p className="text-xs text-muted-foreground">
                    Activa esto si el producto es un libro físico que requiere envío.
                  </p>
                </div>
                <Switch 
                  checked={product.is_physical} 
                  onCheckedChange={(v) => update("is_physical", v)} 
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
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="font-semibold text-lg flex items-center gap-2">💰 Configuración de Precios Regionales</h2>
              <div className="flex flex-wrap items-center gap-6">
                <div className="text-right">
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">BASE USD - LATAM</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-primary">$</span>
                    <Input
                      type="number" step="0.01"
                      className="w-24 h-8 text-sm font-bold border-primary/30"
                      value={product.price_usd_latam ?? ""}
                      onChange={(e) => {
                        const val = e.target.value === "" ? null : Number(e.target.value);
                        update("price_usd_latam", val);
                      }}
                      placeholder="45.00"
                    />
                  </div>
                </div>

                <div className="text-right">
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">BASE USD - ANGLOSPHERE / EU</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-primary">$</span>
                    <Input
                        type="number" step="0.01"
                        className="w-24 h-8 text-sm font-bold border-primary/30"
                        value={product.price_usd}
                        onChange={(e) => {
                          const val = e.target.value === "" ? 0 : Number(e.target.value);
                          update("price_usd", val);
                        }}
                        placeholder="72.99"
                      />
                    </div>
                  </div>

                  <div className="text-right">
                    <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">BASE ANTES - GLOBAL</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-muted-foreground">$</span>
                      <Input
                        type="number" step="0.01"
                        className="w-24 h-8 text-sm font-bold border-muted-foreground/30"
                        value={product.compare_at_price_usd ?? ""}
                        onChange={(e) => {
                          const val = e.target.value === "" ? null : Number(e.target.value);
                          update("compare_at_price_usd", val);
                        }}
                        placeholder="97.00"
                      />
                    </div>
                  </div>

                  <div className="text-right">
                    <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">BASE USD - ASIA Y RESTO DEL MUNDO</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-primary">$</span>
                      <Input
                        type="number" step="0.01"
                        className="w-24 h-8 text-sm font-bold border-primary/30"
                        value={product.price_usd_tienda ?? ""}
                        onChange={(e) => {
                          const val = e.target.value === "" ? null : Number(e.target.value);
                          update("price_usd_tienda", val);
                        }}
                        placeholder="68.00"
                      />
                    </div>
                  </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 space-y-1">
                <p className="font-bold">Estructura de 3 Tiers:</p>
                <ul className="list-disc ml-4 space-y-0.5">
                  <li><b>LATAM:</b> Basado en BASE USD - LATAM ($ {product.price_usd_latam || product.price_usd}).</li>
                  <li><b>ANGLO / EU:</b> Basado en BASE USD - ANGLOSPHERE / EU ($ {product.price_usd}).</li>
                  <li><b>ASIA / RESTO:</b> Basado en BASE USD - ASIA Y RESTO DEL MUNDO ($ {product.price_usd_tienda || product.price_usd}).</li>

                  <li>Los precios tachados se controlan ahora de forma manual por moneda en las tarjetas de abajo para mayor precisión.</li>
                </ul>
              </div>
            </div>


            <div className="grid md:grid-cols-2 gap-4 bg-muted/20 p-3 rounded-lg border border-dashed">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 text-amber-500" />
                  <Label className="text-xs font-semibold">Calificación (Rating)</Label>
                </div>
                <Input
                  type="number" step="0.1" min="0" max="5"
                  className="h-8 text-xs"
                  value={product.rating ?? ""}
                  onChange={(e) => update("rating", e.target.value === "" ? null : Number(e.target.value))}
                  placeholder="4.8"
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5 text-primary" />
                  <Label className="text-xs font-semibold">Reseñas</Label>
                </div>
                <Input
                  type="number"
                  className="h-8 text-xs"
                  value={product.review_count ?? ""}
                  onChange={(e) => update("review_count", e.target.value === "" ? null : Number(e.target.value))}
                  placeholder="120"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-[11px] text-muted-foreground bg-primary/5 p-2 rounded border border-primary/10">
                  💡 Fija el monto <b>exacto</b> por moneda. El sistema detecta el país por IP y usa este valor manual. Si se deja vacío, se usa la conversión automática desde el <b>Precio Base Oferta USD</b> (Ref: Tasa actual). El <b>Precio Normal</b> se usa para mostrar el monto tachado (antes).
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  // LATAM
                  { code: "MXN", flag: "🇲🇽", label: "México", region: "LATAM" },
                  { code: "COP", flag: "🇨🇴", label: "Colombia", region: "LATAM" },
                  { code: "ARS", flag: "🇦🇷", label: "Argentina", region: "LATAM" },
                  { code: "CLP", flag: "🇨🇱", label: "Chile", region: "LATAM" },
                  { code: "BRL", flag: "🇧🇷", label: "Brasil", region: "LATAM" },
                  { code: "PEN", flag: "🇵🇪", label: "Perú", region: "LATAM" },
                  { code: "UYU", flag: "🇺🇾", label: "Uruguay", region: "LATAM" },
                  { code: "PYG", flag: "🇵🇾", label: "Paraguay", region: "LATAM" },
                  { code: "BOB", flag: "🇧🇴", label: "Bolivia", region: "LATAM" },
                  { code: "CRC", flag: "🇨🇷", label: "Costa Rica", region: "LATAM" },
                  { code: "DOP", flag: "🇩🇴", label: "Rep. Dominicana", region: "LATAM" },
                  { code: "GTQ", flag: "🇬🇹", label: "Guatemala", region: "LATAM" },
                  { code: "HNL", flag: "🇭🇳", label: "Honduras", region: "LATAM" },
                  { code: "NIO", flag: "🇳🇮", label: "Nicaragua", region: "LATAM" },
                  { code: "VES", flag: "🇻🇪", label: "Venezuela", region: "LATAM" },
                  // Global / Anglosphere / Europe
                  { code: "US", flag: "🇺🇸", label: "Estados Unidos", region: "Anglosphere/Europe" },
                  { code: "EUR", flag: "🇪🇺", label: "Europa", region: "Anglosphere/Europe" },
                  { code: "GBP", flag: "🇬🇧", label: "Reino Unido", region: "Anglosphere/Europe" },
                  { code: "CAD", flag: "🇨🇦", label: "Canadá", region: "Anglosphere/Europe" },
                  { code: "AUD", flag: "🇦🇺", label: "Australia", region: "Anglosphere/Europe" },
                  { code: "NZD", flag: "🇳🇿", label: "Nueva Zelanda", region: "Anglosphere/Europe" },
                  // Asia
                  { code: "JPY", flag: "🇯🇵", label: "Japón", region: "Asia" },
                  { code: "KRW", flag: "🇰🇷", label: "Corea del Sur", region: "Asia" },
                  { code: "CNY", flag: "🇨🇳", label: "China", region: "Asia" },
                  { code: "INR", flag: "🇮🇳", label: "India", region: "Asia" },
                  // Africa
                  { code: "ZAR", flag: "🇿🇦", label: "Sudáfrica", region: "Africa" },
                  { code: "NGN", flag: "🇳🇬", label: "Nigeria", region: "Africa" },
                  { code: "EGP", flag: "🇪🇬", label: "Egipto", region: "Africa" },
                  { code: "KES", flag: "🇰🇪", label: "Kenia", region: "Africa" },
                  { code: "MAD", flag: "🇲🇦", label: "Marruecos", region: "Africa" },
                ].map(({ code, flag, label, region }) => {
                  const isLatam = REGIONS.latam.codes.includes(code) || region === "LATAM";
                  const isAnglosphereOrEurope = REGIONS.english_speaking.codes.includes(code) || REGIONS.europe.codes.includes(code) || region === "Anglosphere/Europe";
                  
                  const baseUsdRef = isLatam 
                    ? (product.price_usd_latam ?? product.price_usd)
                    : isAnglosphereOrEurope 
                      ? product.price_usd 
                      : (product.price_usd_tienda ?? product.price_usd);
                  
                  const isAsiaOrRest = !isLatam && !isAnglosphereOrEurope;
                  const regionLabel = isLatam ? "LATAM" : isAnglosphereOrEurope ? "ANGLO / EU" : "ASIA / RESTO";
                  
                  const regionalUsdOverride = product.local_usd_prices?.[code];
                  const currentUsdValue = regionalUsdOverride != null ? Number(regionalUsdOverride) : Number(baseUsdRef);
                  
                  const regionPrice = (() => {
                    if (currentUsdValue <= 0) return null;
                    
                    const rate = exchangeRates[code as Currency];
                    if (!rate) return null;

                    const raw = currentUsdValue * rate;
                    // Rounding logic for specific currencies
                    if (code === "COP" || code === "TZS" || code === "UGX") return Math.round(raw / 100) * 100;
                    if (code === "CLP" || code === "PYG" || code === "NGN" || code === "KRW") return Math.round(raw / 10) * 10;
                    if (code === "MXN" || code === "ARS" || code === "UYU" || code === "JPY" || code === "INR") return Math.round(raw);
                    
                    return Math.round(raw * 100) / 100;
                  })();


                  return (
                    <div key={code}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex flex-col">
                          <Label className="text-xs">{flag} {code}</Label>
                          <span className="text-[9px] text-muted-foreground leading-tight">{regionLabel} · {label}</span>
                        </div>
                        {regionPrice && !product.local_prices?.[code] && (
                          <button 
                            type="button"
                            onClick={() => {
                              const next = { ...(product.local_prices || {}), [code]: regionPrice };
                              update("local_prices", next);
                            }}
                            className="text-[9px] text-primary hover:underline bg-primary/5 px-1 rounded border border-primary/20"
                          >
                            Sug: {regionPrice}
                          </button>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <div className="relative">
                          <Label className="text-[8px] absolute -top-2 left-1 bg-background px-0.5 text-primary font-bold z-10">Precio Oferta Local (Monto Exacto)</Label>
                          <Input
                            type="text" 
                            inputMode="decimal"
                            className={cn(
                              "h-9 text-xs pr-8",
                              product.local_prices?.[code] ? "border-primary bg-primary/5 font-semibold" : "border-dashed opacity-70"
                            )}
                            value={product.local_prices?.[code] ?? ""}
                            onChange={(e) => {
                              const rawValue = e.target.value.replace(/,/g, ".");
                              const next = { ...(product.local_prices || {}) };
                              
                              if (rawValue === "" || isNaN(Number(rawValue)) || Number(rawValue) < 0) {
                                delete next[code];
                              } else {
                                const amount = Number(rawValue);
                                const config = currencyConfig[code as Currency];
                                const decimals = config?.decimals ?? 2;
                                next[code] = Math.round(amount * Math.pow(10, decimals)) / Math.pow(10, decimals);
                              }
                              update("local_prices", next);
                            }}
                            placeholder={regionPrice ? `ej: ${regionPrice}` : "auto"}
                          />
                          {product.local_prices?.[code] && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-[10px]">Precio fijo manual (Muestra: {formatCurrencyAmount(product.local_prices[code], code as Currency)})</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          )}
                        </div>

                        <div className="relative">
                          <Label className="text-[8px] absolute -top-2 left-1 bg-background px-0.5 text-muted-foreground font-bold z-10 uppercase">Antes (Tachado)</Label>
                          <Input
                            type="text" 
                            inputMode="decimal"
                            className={cn(
                              "h-7 text-[10px] pr-2 border-dashed",
                              product.local_compare_at_prices?.[code] ? "border-muted-foreground/50 bg-muted/20 line-through" : "opacity-50"
                            )}
                            value={product.local_compare_at_prices?.[code] ?? ""}
                            onChange={(e) => {
                              const rawValue = e.target.value.replace(/,/g, ".");
                              const next = { ...(product.local_compare_at_prices || {}) };
                              
                              if (rawValue === "" || isNaN(Number(rawValue)) || Number(rawValue) < 0) {
                                delete next[code];
                              } else {
                                const amount = Number(rawValue);
                                const config = currencyConfig[code as Currency];
                                const decimals = config?.decimals ?? 2;
                                next[code] = Math.round(amount * Math.pow(10, decimals)) / Math.pow(10, decimals);
                              }
                              update("local_compare_at_prices", next);
                            }}
                            placeholder="---"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-0.5 mt-1 px-0.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <p className="text-[9px] text-muted-foreground font-medium">
                              {product.local_prices?.[code] ? "✓ Manual" : "Auto"}
                            </p>
                            {product.local_compare_at_prices?.[code] && (
                              <span className="text-[8px] bg-amber-100 text-amber-700 px-1 rounded font-bold">OFERTA</span>
                            )}
                          </div>
                          <p className="text-[9px] text-muted-foreground/70 italic">
                            Ref: USD {currentUsdValue.toFixed(2)}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[8px] uppercase font-bold text-muted-foreground/60 shrink-0">USD REF:</span>
                          <Input
                            type="text"
                            inputMode="decimal"
                            className={cn(
                              "h-5 text-[9px] px-1 py-0 w-16",
                              product.local_usd_prices?.[code] ? "border-primary/40 bg-primary/5" : "border-muted/50"
                            )}
                            value={product.local_usd_prices?.[code] ?? ""}
                            onChange={(e) => {
                              const rawValue = e.target.value.replace(/,/g, ".");
                              const next = { ...(product.local_usd_prices || {}) };
                              if (rawValue === "" || isNaN(Number(rawValue)) || Number(rawValue) < 0) {
                                delete next[code];
                              } else {
                                next[code] = Math.round(Number(rawValue) * 100) / 100;
                              }
                              update("local_usd_prices", next);
                            }}
                            placeholder={baseUsdRef.toFixed(2)}
                          />
                        </div>
                        {exchangeRates[code as Currency] && (
                          <p className="text-[8px] text-muted-foreground/50 border-t border-muted-foreground/10 pt-0.5">
                            Tasa: 1 USD = {exchangeRates[code as Currency]} {code}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border mt-4">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Producto Físico</Label>
                  <p className="text-xs text-muted-foreground">
                    Activa esto si el producto es un libro físico que requiere envío.
                  </p>
                </div>
                <Switch 
                  checked={product.is_physical} 
                  onCheckedChange={(v) => update("is_physical", v)} 
                />
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
            <div className="flex items-center gap-2 mb-2">
              <LockIcon className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">4. Entrega digital {product.is_physical && "(Opcional)"}</h2>
            </div>
            {product.is_physical && (
              <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-400">
                <Info className="w-4 h-4 inline mr-2" />
                Este es un producto físico. Los campos de Drive y Access Key son opcionales y solo se usarán si también ofreces una versión digital descargable con la compra.
              </div>
            )}
            <div>
              <Label>Enlace de Google Drive (PDF)</Label>
              <Input value={product.drive_url ?? ""} onChange={(e) => update("drive_url", e.target.value)} placeholder="https://drive.google.com/file/d/…" />
              <GoogleDrivePreview url={product.drive_url} />
              <p className="text-xs text-muted-foreground mt-1">Este enlace <b>nunca se muestra directamente</b> al cliente. El sistema lo protege automáticamente usando tokens de acceso seguro (/mi-descarga?t=TOKEN) tras verificar el pago.</p>

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
                    Hasta {MAX_BONUSES} bonos. Se entregan automáticamente vía tokens seguros junto con el producto principal.
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
                        list[i] = { ...list[i], drive_url: normalizeDriveUrl(e.target.value) };
                        update("bonuses", list);
                      }}
                      placeholder="https://drive.google.com/file/d/…"
                    />
                    <GoogleDrivePreview url={b.drive_url} />

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

