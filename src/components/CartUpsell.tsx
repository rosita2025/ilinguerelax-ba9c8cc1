import { useState } from "react";
import { BookOpen, Plus, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartItem } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";

const PHYSICAL_KEYWORDS = ["LIBRO FISICO", "libro fisico", "Libro Físico"];

const upsellProducts = [
  {
    title: "1,000 Verbos Esenciales Digital",
    description: "Presente, Pasado y Futuro",
    price: "10.00",
    image: "/images/product-1000-verbos.webp",
    variantId: "gid://shopify/ProductVariant/43062338191421",
    productId: "gid://shopify/Product/7829744844861",
    handle: "ingles-relax-1-000-verbos-esenciales-en-ingles-presente-pasado-y-futuro-con-pronunciacion",
  },
  {
    title: "500 Preguntas Frecuentes Digital",
    description: "Habla sin miedo",
    price: "10.00",
    image: "/images/product-500-preguntas.webp",
    variantId: "gid://shopify/ProductVariant/43062338224189",
    productId: "gid://shopify/Product/7829744877629",
    handle: "ingles-relax-500-preguntas-en-ingles-con-pronunciacion-para-hispanohablantes",
  },
];

interface CartUpsellProps {
  items: CartItem[];
}

export const CartUpsell = ({ items }: CartUpsellProps) => {
  const addItem = useCartStore((s) => s.addItem);
  const isLoading = useCartStore((s) => s.isLoading);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<string[]>([]);

  const hasPhysicalBook = items.some((item) =>
    PHYSICAL_KEYWORDS.some((kw) => item.product.node.title.includes(kw))
  );

  if (!hasPhysicalBook) return null;

  // Filter out products already in cart
  const available = upsellProducts.filter(
    (up) => !items.some((item) => item.variantId === up.variantId)
  );

  if (available.length === 0) return null;

  const handleAdd = async (product: typeof upsellProducts[0]) => {
    setAddingId(product.variantId);
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
    setAddedIds((prev) => [...prev, product.variantId]);
    setAddingId(null);
  };

  return (
    <div className="space-y-2 py-3">
      <p className="text-xs font-semibold text-primary flex items-center gap-1">
        <BookOpen className="w-3 h-3" /> Complementa tu compra
      </p>
      <div className="space-y-2">
        {available.map((product) => {
          const isAdding = addingId === product.variantId;
          const wasAdded = addedIds.includes(product.variantId);

          return (
            <div
              key={product.variantId}
              className="flex items-center gap-3 p-2 border border-border rounded-lg"
            >
              <img
                src={product.image}
                alt={product.title}
                className="w-10 h-10 rounded object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{product.title}</p>
                <p className="text-[10px] text-muted-foreground">{product.description}</p>
                <p className="text-xs font-bold text-primary">${product.price}</p>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 flex-shrink-0"
                onClick={() => handleAdd(product)}
                disabled={isLoading || isAdding || wasAdded}
              >
                {isAdding ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : wasAdded ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Plus className="h-3 w-3" />
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
