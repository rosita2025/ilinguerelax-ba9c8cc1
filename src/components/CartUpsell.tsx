import { useState } from "react";
import { BookOpen, Plus, Loader2, Check, Tag, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartItem } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";

const UPSELL_COUPON = "upselldescuentos";

const PHYSICAL_KEYWORDS = ["LIBRO FISICO", "libro fisico", "Libro Físico"];
const SPANISH_5000_KEYWORDS = ["Spanish Relax - 5,000", "Spanish Relax - 5000", "5,000 Words with English"];

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
    compareAtPrice: "27.99",
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
    compareAtPrice: "27.99",
    image: "https://cdn.shopify.com/s/files/1/0647/4409/5805/files/Master_conversational_Spanish_with_500_carefully_selected_questions._Each_question_includes_English_pronunciation_so_you_understand_exactly_how_to_sound_like_a_native_speaker._Perfect_for_students_of_all_levels_who_want_to_improve_their_listenin.png?v=1776739067",
    variantId: "gid://shopify/ProductVariant/43118884028477",
    productId: "gid://shopify/Product/7842578792509",
    handle: "spanish-relax-500-questions-in-spanish-with-english-pronunciation-1",
    hotmartUrl: "",
  },
];

const spanishPhysicalPreorderUpsell = {
  title: "Spanish Relax 8,000 Words — Physical Book (PRE-ORDER)",
  description: "Lock in the lowest price ever — ships June 2026",
  price: "15.00",
  compareAtPrice: "35.00",
  image: "/images/product-spanish-8000-book.webp",
  variantId: "gid://shopify/ProductVariant/43137345749053",
  productId: "gid://shopify/Product/7849025568829",
  handle: "spanish-relax-8-000-words-physical-book-pre-order",
  hotmartUrl: "",
};

interface CartUpsellProps {
  items: CartItem[];
}

export const CartUpsell = ({ items }: CartUpsellProps) => {
  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const applyDiscount = useCartStore((s) => s.applyDiscount);
  const removeDiscount = useCartStore((s) => s.removeDiscount);
  const discountCodes = useCartStore((s) => s.discountCodes);
  const isLoading = useCartStore((s) => s.isLoading);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const hasCouponApplied = discountCodes.some(
    (dc) => dc.code.toLowerCase() === UPSELL_COUPON.toLowerCase() && dc.applicable
  );

  const hasPhysicalBook = items.some((item) =>
    PHYSICAL_KEYWORDS.some((kw) => item.product.node.title.includes(kw))
  );

  const hasSpanish5000 = items.some((item) =>
    SPANISH_5000_KEYWORDS.some((kw) => item.product.node.title.includes(kw))
  );

  // Spanish-language UI when Spanish 5000 is in cart
  const isSpanishContext = hasSpanish5000 && !hasPhysicalBook;
  const activeUpsells = isSpanishContext ? spanishUpsellProducts : upsellProducts;

  if (!hasPhysicalBook && !hasSpanish5000) return null;

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
      <p className="text-xs font-semibold text-primary flex items-center gap-1">
        <BookOpen className="w-3 h-3" />
        {isSpanishContext
          ? "Complete your Spanish learning kit — Add & save"
          : "Compra 1 y llévate el 2do con 30% OFF"}
      </p>
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

      {isSpanishContext && !items.some((item) => item.variantId === spanishPhysicalPreorderUpsell.variantId) && (
        <>
          <div className="border-t border-dashed border-border my-3" />
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-accent flex items-center gap-1">
              <Truck className="w-3 h-3" />
              Add the physical book — Free shipping on orders over $50
            </p>
            <p className="text-[10px] text-muted-foreground leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
              Pre-order from <strong className="text-primary">$15</strong> · goes up to <strong>$35</strong> in June 2026
            </p>
            <div
              key={spanishPhysicalPreorderUpsell.variantId}
              className={`flex items-center gap-3 p-2 border-2 border-accent/40 bg-accent/5 rounded-lg cursor-pointer transition-colors ${
                processingId === spanishPhysicalPreorderUpsell.variantId ? "opacity-60 pointer-events-none" : ""
              }`}
              onClick={() => {
                if (processingId === spanishPhysicalPreorderUpsell.variantId) return;
                handleToggle(spanishPhysicalPreorderUpsell);
              }}
            >
              <img
                src={spanishPhysicalPreorderUpsell.image}
                alt={spanishPhysicalPreorderUpsell.title}
                className="w-10 h-10 rounded object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{spanishPhysicalPreorderUpsell.title}</p>
                <p className="text-[10px] text-muted-foreground">{spanishPhysicalPreorderUpsell.description}</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] line-through text-destructive font-medium">${spanishPhysicalPreorderUpsell.compareAtPrice}</span>
                  <span className="text-xs font-bold text-primary">${spanishPhysicalPreorderUpsell.price}</span>
                  <span className="text-[9px] bg-accent/20 text-accent font-bold px-1 rounded">PRE-ORDER</span>
                </div>
              </div>
              <div className="h-7 w-7 flex-shrink-0 rounded-full border-2 border-accent/50 flex items-center justify-center transition-colors">
                {processingId === spanishPhysicalPreorderUpsell.variantId ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5 text-accent" />
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
