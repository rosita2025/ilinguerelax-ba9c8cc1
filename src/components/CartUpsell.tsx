import { BookOpen, ArrowRight } from "lucide-react";
import { CartItem } from "@/lib/shopify";

const PHYSICAL_KEYWORDS = ["LIBRO FISICO", "libro fisico", "Libro Físico"];

const upsellProducts = [
  {
    title: "1,000 Verbos Esenciales",
    description: "Presente, Pasado y Futuro",
    price: "$10.00",
    image: "/images/product-1000-verbos.webp",
    link: "/products/1-000-verbos-esenciales-en-ingles-presente-pasado-futuro-con-pronunciacion",
  },
  {
    title: "500 Preguntas en Inglés",
    description: "Habla sin miedo",
    price: "$10.00",
    image: "/images/product-500-preguntas.webp",
    link: "/products/500-preguntas-en-ingles-con-pronunciacion-para-hispanohablantes",
  },
];

interface CartUpsellProps {
  items: CartItem[];
}

export const CartUpsell = ({ items }: CartUpsellProps) => {
  const hasPhysicalBook = items.some((item) =>
    PHYSICAL_KEYWORDS.some((kw) => item.product.node.title.includes(kw))
  );

  if (!hasPhysicalBook) return null;

  return (
    <div className="space-y-2 py-3">
      <p className="text-xs font-semibold text-primary flex items-center gap-1">
        <BookOpen className="w-3 h-3" /> Complementa tu compra
      </p>
      <div className="space-y-2">
        {upsellProducts.map((product) => (
          <a
            key={product.link}
            href={product.link}
            className="flex items-center gap-3 p-2 border border-border rounded-lg hover:border-primary/50 hover:bg-muted/50 transition-all group"
          >
            <img
              src={product.image}
              alt={product.title}
              className="w-10 h-10 rounded object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{product.title}</p>
              <p className="text-[10px] text-muted-foreground">{product.description}</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="text-xs font-bold text-primary">{product.price}</span>
              <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};
