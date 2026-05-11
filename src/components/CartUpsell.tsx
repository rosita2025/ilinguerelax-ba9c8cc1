import { useState } from "react";
import { BookOpen, Plus, Loader2, Check, Tag, Truck, Download, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartItem } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { useBundleStore } from "@/stores/bundleStore";
import { useI18n } from "@/i18n/I18nContext";

const UPSELL_COUPON = "upselldescuentos";

const PHYSICAL_KEYWORDS = ["LIBRO FISICO", "libro fisico", "Libro Físico"];
const SPANISH_5000_KEYWORDS = ["Spanish Relax - 5,000", "Spanish Relax - 5000", "5,000 Words with English"];

// All Spanish bundle physical book variant IDs (used to detect "Spanish bundle" context).
const SPANISH_BUNDLE_PHYSICAL_VARIANTS = new Set<string>([
  "gid://shopify/ProductVariant/43138982281277", // 3000 Verbs book
  "gid://shopify/ProductVariant/43138982314045", // Grammar A1-C1 book
]);

const upsellProducts = [
  {
    title: "1,000 Verbos Esenciales Digital",
    description: "Presente, Pasado y Futuro",
    price: "10.00",
    compareAtPrice: "14.29",
    image: "/images/product-1000-verbos.webp",
    variantId: "gid://shopify/ProductVariant/43062338191421",
    productId: "gid://shopify/Product/7829744844861",
    handle: "ingles-relax-1-000-verbos-esenciales-en-ingles-presente-pasado-y-futuro-con-pronunciacion",
    hotmartUrl: "https://pay.hotmart.com/T102978081M?bid=1775682831595",
  },
  {
    title: "500 Preguntas Frecuentes Digital",
    description: "Habla sin miedo",
    price: "10.00",
    compareAtPrice: "14.29",
    image: "/images/product-500-preguntas.webp",
    variantId: "gid://shopify/ProductVariant/43062338224189",
    productId: "gid://shopify/Product/7829744877629",
    handle: "ingles-relax-500-preguntas-en-ingles-con-pronunciacion-para-hispanohablantes",
    hotmartUrl: "",
  },
];

const spanishUpsellProducts = [
  {
    title: "1,000 Verbs in Spanish",
    description: "Present, Past & Future with English Pronunciation",
    price: "12.00",
    compareAtPrice: "29.99",
    image: "https://cdn.shopify.com/s/files/1/0647/4409/5805/files/Master_1_000_Spanish_verbs_with_Spanish_Relax._This_comprehensive_resource_covers_past_present_and_future_tense_conjugations_organized_into_20_practical_topics._Perfect_for_students_of_all_levels_who_want_to_improve_their_fluency_and_confidenc.png?v=1776739288",
    variantId: "gid://shopify/ProductVariant/43118883995709",
    productId: "gid://shopify/Product/7842578759741",
    handle: "spanish-relax-1-000-verbs-in-spanish-with-english-pronunciation",
    hotmartUrl: "",
  },
  {
    title: "500 Questions in Spanish",
    description: "Speak with confidence — English Pronunciation",
    price: "12.00",
    compareAtPrice: "29.99",
    image: "https://cdn.shopify.com/s/files/1/0647/4409/5805/files/Master_conversational_Spanish_with_500_carefully_selected_questions._Each_question_includes_English_pronunciation_so_you_understand_exactly_how_to_sound_like_a_native_speaker._Perfect_for_students_of_all_levels_who_want_to_improve_their_listenin.png?v=1776739067",
    variantId: "gid://shopify/ProductVariant/43118884028477",
    productId: "gid://shopify/Product/7842578792509",
    handle: "spanish-relax-500-questions-in-spanish-with-english-pronunciation-1",
    hotmartUrl: "",
  },
];

const spanishPhysicalPreorderUpsells = [
  {
    title: "3,000 Spanish Verbs Mastery — Physical Book (PRE-ORDER)",
    description: "Past, Present & Future · ships June 2026",
    price: "17.00",
    compareAtPrice: "29.99",
    image: "/images/product-spanish-3000-verbs-book.webp",
    variantId: "gid://shopify/ProductVariant/43138982281277",
    productId: "gid://shopify/Product/7849457778749",
    handle: "spanish-relax-3-000-spanish-verbs-mastery-physical-book-pre-order",
    hotmartUrl: "",
  },
  {
    title: "Grammar Patterns A1–C1 — Physical Book (PRE-ORDER)",
    description: "The Lego sentence-building system · ships June 2026",
    price: "15.00",
    compareAtPrice: "29.99",
    image: "/images/product-grammar-patterns-a1c1.webp",
    variantId: "gid://shopify/ProductVariant/43138982314045",
    productId: "gid://shopify/Product/7849457811517",
    handle: "spanish-relax-grammar-patterns-a1-c1-mastery-physical-book-pre-order",
    hotmartUrl: "",
  },
];

interface CartUpsellProps {
  items: CartItem[];
}

export const CartUpsell = ({ items }: CartUpsellProps) => {
  const { formatPrice } = useI18n();
  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const applyDiscount = useCartStore((s) => s.applyDiscount);
  const removeDiscount = useCartStore((s) => s.removeDiscount);
  const discountCodes = useCartStore((s) => s.discountCodes);
  const isLoading = useCartStore((s) => s.isLoading);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const selectedBundle = useBundleStore((s) => s.selected);

  const hasCouponApplied = discountCodes.some(
    (dc) => dc.code.toLowerCase() === UPSELL_COUPON.toLowerCase() && dc.applicable
  );

  const hasPhysicalBook = items.some((item) =>
    PHYSICAL_KEYWORDS.some((kw) => item.product.node.title.includes(kw))
  );

  const hasSpanish5000 = items.some((item) =>
    SPANISH_5000_KEYWORDS.some((kw) => item.product.node.title.includes(kw))
  );

  // Detect Spanish bundle context: cart contains the digital 5000 (any of the 3 Spanish bundles).
  // We treat ALL Spanish-bundle scenarios as "Spanish context" so the UI stays consistent
  // even when the user picked Bundle 2 or 3 (which include physical pre-order books).
  const hasSpanishBundlePhysical = items.some((item) =>
    SPANISH_BUNDLE_PHYSICAL_VARIANTS.has(item.variantId)
  );
  const isSpanishContext = hasSpanish5000;
  const activeUpsells = isSpanishContext ? spanishUpsellProducts : upsellProducts;

  // Bundle 3 ("complete") = user already has digital + 3 physical books → no upsells at all.
  const isCompleteBundle = selectedBundle?.id === "complete";

  // Hide entire upsell block for non-Spanish flows that have no physical book either.
  if (!hasPhysicalBook && !hasSpanish5000 && !hasSpanishBundlePhysical) return null;

  // If user picked the "Complete Library" bundle, hide all upsells (they already have everything).
  if (isCompleteBundle) return null;

  const handleToggle = async (product: typeof upsellProducts[0]) => {
    const isInCart = items.some((item) => item.variantId === product.variantId);
    setProcessingId(product.variantId);

    if (isInCart) {
      // Remove from cart
      await removeItem(product.variantId);
      // If no upsell products remain in cart, remove the coupon
      const remainingUpsells = items.filter(
        (item) => item.variantId !== product.variantId && 
        activeUpsells.some((up) => up.variantId === item.variantId)
      );
      if (remainingUpsells.length === 0 && hasCouponApplied && !isSpanishContext) {
        await removeDiscount();
      }
    } else {
      // Add to cart
      await addItem({
        product: {
          node: {
            id: product.productId,
            title: product.title,
            description: product.description,
            handle: product.handle,
            priceRange: { minVariantPrice: { amount: product.price, currencyCode: "USD" } },
            images: {
              edges: [
                {
                  node: {
                    url: product.image,
                    altText: product.title,
                  },
                },
              ],
            },
            variants: {
              edges: [{
                node: {
                  id: product.variantId,
                  title: "Default Title",
                  price: { amount: product.price, currencyCode: "USD" },
                  availableForSale: true,
                  selectedOptions: [{ name: "Title", value: "Default Title" }],
                },
              }],
            },
            options: [{ name: "Title", values: ["Default Title"] }],
          },
        },
        variantId: product.variantId,
        variantTitle: "Default Title",
        price: { amount: product.price, currencyCode: "USD" },
        quantity: 1,
        selectedOptions: [{ name: "Title", value: "Default Title" }],
      });
      // Auto-apply upsell coupon (only for physical book flow)
      if (!hasCouponApplied && !isSpanishContext) {
        await applyDiscount(UPSELL_COUPON);
      }
    }
    setProcessingId(null);
  };

  return (
    <div className="space-y-2 py-3">
      {/* Only show digital upsell header if there is at least one digital upsell still available */}
      {activeUpsells.some((p) => !items.some((i) => i.variantId === p.variantId)) && (
        <p className="text-xs font-semibold text-primary flex items-center gap-1">
          <BookOpen className="w-3 h-3" />
          {isSpanishContext
            ? "Complete your Spanish learning kit — Digital PDF (instant download)"
            : "Compra 1 y llévate el 2do con 30% OFF"}
        </p>
      )}
      {hasCouponApplied && !isSpanishContext && (
        <div className="flex items-center gap-1 text-[10px] text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
          <Tag className="w-3 h-3" /> Cupón {UPSELL_COUPON} aplicado automáticamente
        </div>
      )}
      <div className="space-y-2">
        {activeUpsells
          .filter((product) => !items.some((item) => item.variantId === product.variantId))
          .map((product) => {
          const isProcessing = processingId === product.variantId;
          const isInCart = false;

          return (
            <div
              key={product.variantId}
              className={`flex items-center gap-3 p-2 border rounded-lg cursor-pointer transition-colors ${
                isInCart ? "border-primary/50 bg-primary/5" : "border-border"
              } ${isProcessing ? "opacity-60 pointer-events-none" : ""}`}
              onClick={() => {
                if (isProcessing) return;
                handleToggle(product);
              }}
            >
              <img
                src={product.image}
                alt={product.title}
                className="w-10 h-10 rounded object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                {isSpanishContext && (
                  <span className="inline-flex items-center gap-0.5 text-[9px] bg-primary/15 text-primary font-bold px-1.5 py-0.5 rounded uppercase mb-0.5">
                    <Download className="w-2.5 h-2.5" /> Digital PDF · Instant
                  </span>
                )}
                <p className="text-xs font-medium truncate">{product.title}</p>
                <p className="text-[10px] text-muted-foreground">{product.description}</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] line-through text-destructive font-medium">${product.compareAtPrice}</span>
                  <span className="text-xs font-bold text-primary">${product.price}</span>
                  <span className="text-[9px] bg-destructive/10 text-destructive font-bold px-1 rounded">
                    {isSpanishContext ? "-57%" : "-30%"}
                  </span>
                </div>
              </div>
              <div
                className={`h-7 w-7 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
                  isInCart
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-muted-foreground/30"
                }`}
              >
                {isProcessing ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : isInCart ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {(isSpanishContext || hasSpanishBundlePhysical) && (() => {
        const visiblePreorders = spanishPhysicalPreorderUpsells.filter(
          (p) => !items.some((item) => item.variantId === p.variantId)
        );
        if (visiblePreorders.length === 0) return null;
        const subtotal = items.reduce(
          (sum, item) => sum + parseFloat(item.price.amount) * item.quantity,
          0
        ) + parseFloat(visiblePreorders[0].price);
        const FREE_SHIP_THRESHOLD = 44;
        const remaining = FREE_SHIP_THRESHOLD - subtotal;
        return (
          <>
            <div className="border-t border-dashed border-border my-3" />
            <div className="space-y-1.5">
              {remaining <= 0 ? (
                <p className="text-xs font-bold text-green-600 flex items-center gap-1">
                  <Truck className="w-3 h-3" />
                  ✓ You qualify for FREE shipping with any physical book!
                </p>
              ) : (
                <p className="text-xs font-bold text-accent flex items-center gap-1">
                  <Truck className="w-3 h-3" />
                  Add ${remaining.toFixed(2)} more for FREE shipping (over $44)
                </p>
              )}
              <p className="text-[10px] text-muted-foreground leading-tight">
                Pre-order physical books · prices go up in <strong>June 2026</strong>
              </p>
              {visiblePreorders.map((preorder) => (
                <div
                  key={preorder.variantId}
                  className={`flex items-center gap-3 p-2 border-2 border-accent/40 bg-accent/5 rounded-lg cursor-pointer transition-colors ${
                    processingId === preorder.variantId ? "opacity-60 pointer-events-none" : ""
                  }`}
                  onClick={() => {
                    if (processingId === preorder.variantId) return;
                    handleToggle(preorder);
                  }}
                >
                  <img
                    src={preorder.image}
                    alt={preorder.title}
                    className="w-10 h-10 rounded object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="inline-flex items-center gap-0.5 text-[9px] bg-accent/20 text-accent font-bold px-1.5 py-0.5 rounded uppercase mb-0.5">
                      <Package className="w-2.5 h-2.5" /> Physical · Pre-Order
                    </span>
                    <p className="text-xs font-medium truncate">{preorder.title}</p>
                    <p className="text-[10px] text-muted-foreground">{preorder.description}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] line-through text-destructive font-medium">${preorder.compareAtPrice}</span>
                      <span className="text-xs font-bold text-primary">${preorder.price}</span>
                    </div>
                  </div>
                  <div className="h-7 w-7 flex-shrink-0 rounded-full border-2 border-accent/50 flex items-center justify-center transition-colors">
                    {processingId === preorder.variantId ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Plus className="h-3.5 w-3.5 text-accent" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        );
      })()}
    </div>
  );
};
