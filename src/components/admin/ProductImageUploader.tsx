import { useRef, useState } from "react";
import { Upload, Loader2, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminInvoke } from "@/lib/adminInvoke";
import { useToast } from "@/hooks/use-toast";

// Encode a Blob as base64 for the admin-upload edge function.
async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

interface Props {
  value: string | string[];
  onChange: (value: string | string[]) => void;
  metadata?: Record<string, any>;
  onMetadataChange?: (metadata: Record<string, any>) => void;
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

export default function ProductImageUploader({ 
  value, 
  onChange, 
  metadata = {}, 
  onMetadataChange,
  sku, 
  multiple = false, 
  maxImages = 5 
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const values = Array.isArray(value) ? value : value ? [value] : [];

  const handleFile = async (file: File) => {
    if (multiple && values.length >= maxImages) {
      toast({ title: "Límite de imágenes", description: `Máximo ${maxImages} imágenes permitidas`, variant: "destructive" });
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast({ title: "Imagen demasiado grande", description: "Máximo 15 MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const webp = await toWebP(file);
      const useOriginal = !webp;
      const blob: Blob = webp ?? file;
      const extFromType = (blob.type.split("/")[1] || "").split(";")[0];
      const extFromName = (file.name.split(".").pop() || "").toLowerCase();
      const ext = (useOriginal ? (extFromName || extFromType || "jpg") : "webp").replace(/[^a-z0-9]/gi, "") || "jpg";
      const slugRaw = (sku || "producto").replace(/[^a-z0-9-]/gi, "-").toLowerCase().replace(/-+/g, "-").replace(/^-|-$/g, "");
      const slug = slugRaw || "producto";
      const path = `${slug}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
      // Upload through the admin-gated edge function (service role). The
      // product-images bucket no longer allows direct public writes.
      const dataBase64 = await blobToBase64(blob);
      const { data, error } = await adminInvoke<{ publicUrl: string }>(
        "admin-upload-product-image",
        {
          body: {
            path,
            contentType: blob.type || `image/${ext}`,
            dataBase64,
          },
        },
      );
      if (error) throw new Error(error.message || "Error al subir");
      if (!data?.publicUrl) throw new Error("Respuesta inválida del servidor");

      if (multiple) {
        onChange([...values, data.publicUrl]);
      } else {
        onChange(data.publicUrl);
      }

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

  const removeImage = (urlToRemove: string) => {
    if (multiple) {
      onChange(values.filter(url => url !== urlToRemove));
      if (onMetadataChange && metadata[urlToRemove]) {
        const newMeta = { ...metadata };
        delete newMeta[urlToRemove];
        onMetadataChange(newMeta);
      }
    } else {
      onChange("");
    }
  };

  const updateAlt = (url: string, alt: string) => {
    if (!onMetadataChange) return;
    onMetadataChange({
      ...metadata,
      [url]: { ...(metadata[url] || {}), alt }
    });
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) handleFile(f);
        }}
        className="border-2 border-dashed border-border rounded-lg p-4 flex flex-col gap-4"
      >
        <div className="flex flex-wrap gap-4">
          {values.map((url, idx) => (
            <div key={idx} className="relative shrink-0 group/img">
              <div className="relative">
                <img src={url} alt={`Imagen ${idx + 1}`} className="w-32 h-32 object-cover rounded-md border" />
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-sm hover:scale-110 transition-transform z-10"
                  title="Quitar"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="mt-1">
                <input 
                  type="text"
                  placeholder="SEO Alt Text..."
                  value={metadata[url]?.alt || ""}
                  onChange={(e) => updateAlt(url, e.target.value)}
                  className="w-32 text-[10px] px-2 py-1 border rounded bg-background focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
            </div>
          ))}
          {!multiple && values.length === 0 && (
            <div className="w-32 h-32 bg-muted rounded-md flex items-center justify-center text-muted-foreground text-xs shrink-0">
              Sin portada
            </div>
          )}
          {multiple && values.length < maxImages && values.length > 0 && (
             <div 
              onClick={() => inputRef.current?.click()}
              className="w-32 h-32 border-2 border-dashed border-muted-foreground/30 rounded-md flex items-center justify-center text-muted-foreground cursor-pointer hover:bg-muted transition-colors"
             >
               <Plus className="w-6 h-6" />
             </div>
          )}
          {values.length === 0 && multiple && (
             <div className="w-32 h-32 bg-muted rounded-md flex items-center justify-center text-muted-foreground text-xs shrink-0">
               Sin imágenes
             </div>
          )}
        </div>

        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-3">
            {multiple ? `Añade hasta ${maxImages} imágenes.` : "Arrastra una imagen o haz clic."} Se convierte a <strong>WebP</strong> automáticamente.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={uploading || (multiple && values.length >= maxImages)}
            >
              {uploading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
              {uploading ? "Subiendo…" : multiple ? "Añadir imagen" : "Elegir portada"}
            </Button>
          </div>
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
      {!multiple && (
        <input
          type="text"
          value={Array.isArray(value) ? value[0] || "" : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="…o pega una URL https://"
          className="w-full h-9 text-xs border border-input rounded-md px-3 bg-background"
        />
      )}
    </div>
  );
}
