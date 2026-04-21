import { useState } from "react";
import { BookOpen, Plus, Loader2, Check, Tag } from "lucide-react";
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
    image: "/images/product-1000-verbos.webp",
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
    image: "/images/product-500-preguntas.webp",
    variantId: "gid://shopify/ProductVariant/43118884028477",
    productId: "gid://shopify/Product/7842578792509",
    handle: "spanish-relax-500-questions-in-spanish-with-english-pronunciation-1",
    hotmartUrl: "",
  },
];

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
            images: { edges: [] },
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
        {activeUpsells.map((product) => {
          const isProcessing = processingId === product.variantId;
          const isInCart = items.some((item) => item.variantId === product.variantId);

          return (
            <div
              key={product.variantId}
              className={`flex items-center gap-3 p-2 border rounded-lg cursor-pointer transition-colors ${
                isInCart ? "border-primary/50 bg-primary/5" : "border-border"
              }`}
              onClick={() => !isLoading && !isProcessing && handleToggle(product)}
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
    </div>
  );
};
