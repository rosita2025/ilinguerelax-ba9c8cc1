import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCheckoutPruebaStore } from "@/stores/checkoutStore";
import { toast } from "@/hooks/use-toast";

export function AddProductForm() {
  const { addItem, clear } = useCheckoutPruebaStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("1");
  const [image, setImage] = useState("");

  const submit = () => {
    const priceNum = parseFloat(price);
    const qtyNum = parseInt(qty, 10);
    if (!name.trim() || !priceNum || priceNum <= 0 || !qtyNum || qtyNum <= 0) {
      toast({ title: "Datos inválidos", description: "Nombre, precio y cantidad son requeridos", variant: "destructive" });
      return;
    }
    addItem({
      id: `custom-${Date.now()}`,
      name: name.trim(),
      price: priceNum,
      quantity: qtyNum,
      image: image.trim() || "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=200&h=200&fit=crop",
    });
    setName(""); setPrice(""); setQty("1"); setImage("");
    setOpen(false);
    toast({ title: "Producto añadido", description: `${name} · $${priceNum}` });
  };

  return (
    <div className="mt-3 space-y-2">
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => setOpen(!open)}
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> Añadir producto
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            if (confirm("¿Vaciar carrito?")) clear();
          }}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-3.5 h-3.5 mr-1" /> Vaciar
        </Button>
      </div>

      {open && (
        <div className="border rounded-lg p-3 space-y-2 bg-background">
          <Input placeholder="Nombre del producto" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Precio USD" type="number" step="0.01" min="0.5" value={price} onChange={(e) => setPrice(e.target.value)} />
            <Input placeholder="Cantidad" type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} />
          </div>
          <Input placeholder="URL de imagen (opcional)" value={image} onChange={(e) => setImage(e.target.value)} />
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={submit} className="flex-1">Añadir al carrito</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          </div>
        </div>
      )}
    </div>
  );
}
