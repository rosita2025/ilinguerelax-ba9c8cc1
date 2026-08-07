import { useRef, useState } from "react";
import { Upload, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Props {
  value: string | string[];
  onChange: (value: string | string[]) => void;
  sku?: string;
  multiple?: boolean;
  maxImages?: number;
}

// Convert any image to WebP via canvas (max 1600px wide, quality 0.85).
// Returns null if the browser can't decode/encode (e.g. HEIC, corrupt, or WebP unsupported).
async function toWebP(file: File, maxW = 1600, quality = 0.85): Promise<Blob | null> {
  try {
    const dataUrl = await new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = () => rej(new Error("No se pudo leer el archivo"));
      r.readAsDataURL(file);
    });
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error("Formato no soportado por el navegador (¿HEIC?)"));
      i.src = dataUrl;
    });

    // Calculate dimensions maintaining aspect ratio
    let w = img.width;
    let h = img.height;
    if (w > maxW) {
      const scale = maxW / w;
      w = maxW;
      h = Math.round(h * scale);
    }

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Use smooth scaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, w, h);

    return await new Promise<Blob | null>((res) =>
      canvas.toBlob((b) => res(b), "image/webp", quality)
    );
  } catch (err) {
    console.error("[toWebP] error:", err);
    return null;
  }
}

export default function ProductImageUploader({ value, onChange, sku }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFile = async (file: File) => {
    if (file.size > 15 * 1024 * 1024) {
      toast({ title: "Imagen demasiado grande", description: "Máximo 15 MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      // Try WebP conversion; if it fails (HEIC, unsupported), upload the original file as-is so el admin nunca se queda bloqueado.
      const webp = await toWebP(file);
      const useOriginal = !webp;
      const blob: Blob = webp ?? file;
      const extFromType = (blob.type.split("/")[1] || "").split(";")[0];
      const extFromName = (file.name.split(".").pop() || "").toLowerCase();
      const ext = (useOriginal ? (extFromName || extFromType || "jpg") : "webp").replace(/[^a-z0-9]/gi, "") || "jpg";
      const slugRaw = (sku || "producto").replace(/[^a-z0-9-]/gi, "-").toLowerCase().replace(/-+/g, "-").replace(/^-|-$/g, "");
      const slug = slugRaw || "producto";
      const path = `${slug}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
      const { error } = await supabase.storage
        .from("product-images")
        .upload(path, blob, { contentType: blob.type || `image/${ext}`, upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      onChange(data.publicUrl);
      toast({
        title: useOriginal ? "Imagen subida (original)" : "Imagen subida",
        description: `${(blob.size / 1024).toFixed(0)} KB${useOriginal ? "" : " WebP"}`,
      });
    } catch (e) {
      const msg = (e as Error)?.message || "Error desconocido";
      toast({ title: "Error al subir", description: msg, variant: "destructive" });
      console.error("[ProductImageUploader] upload failed:", e);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) handleFile(f);
        }}
        className="border-2 border-dashed border-border rounded-lg p-4 flex items-center gap-4"
      >
        {value ? (
          <div className="relative shrink-0">
            <img src={value} alt="portada" className="w-24 h-24 object-cover rounded-md border" />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
              title="Quitar"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="w-24 h-24 bg-muted rounded-md flex items-center justify-center text-muted-foreground text-xs shrink-0">
            Sin imagen
          </div>
        )}
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-2">
            Arrastra una imagen o haz clic. Se convierte a <strong>WebP</strong> (máx 1600px) automáticamente.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
            {uploading ? "Subiendo…" : "Elegir imagen"}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="…o pega una URL https://"
        className="w-full h-9 text-xs border border-input rounded-md px-3 bg-background"
      />
    </div>
  );
}
