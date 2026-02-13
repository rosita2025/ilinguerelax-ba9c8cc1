import { useState } from "react";
import { Star, Camera, X, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ReviewFormProps {
  productType: string;
  onSubmitted?: () => void;
}

export const ReviewForm = ({ productType, onSubmitted }: ReviewFormProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 3) {
      toast({ title: "Máximo 3 fotos", variant: "destructive" });
      return;
    }
    const validFiles = files.filter(f => f.size <= 5 * 1024 * 1024);
    if (validFiles.length !== files.length) {
      toast({ title: "Cada foto debe ser menor a 5MB", variant: "destructive" });
    }
    setPhotos(prev => [...prev, ...validFiles]);
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviews(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) {
      toast({ title: "Completa tu nombre y reseña", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload photos
      const photoUrls: string[] = [];
      for (const photo of photos) {
        const ext = photo.name.split('.').pop();
        const fileName = `${productType}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('review-photos')
          .upload(fileName, photo);
        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('review-photos')
            .getPublicUrl(fileName);
          photoUrls.push(urlData.publicUrl);
        }
      }

      // Insert review
      const { error } = await supabase.from('reviews').insert({
        product_type: productType,
        customer_name: name.trim().slice(0, 100),
        customer_email: email.trim().slice(0, 255) || null,
        rating,
        review_text: text.trim().slice(0, 1000),
        photo_urls: photoUrls,
        status: 'pending',
      });

      if (error) throw error;

      setIsSubmitted(true);
      onSubmitted?.();
      toast({ title: "¡Gracias! Tu reseña será revisada pronto." });
    } catch (err) {
      console.error('Error submitting review:', err);
      toast({ title: "Error al enviar. Intenta de nuevo.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center py-8 px-4 bg-card border border-border rounded-xl">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-foreground mb-2">¡Reseña enviada!</h3>
        <p className="text-sm text-muted-foreground">
          Tu reseña será revisada y publicada pronto. ¡Gracias por compartir tu experiencia!
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-4">
      <h3 className="text-lg font-bold text-foreground">✍️ Deja tu reseña</h3>

      {/* Star Rating */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Calificación</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="focus:outline-none"
            >
              <Star
                className={`w-8 h-8 transition-colors ${
                  star <= (hoverRating || rating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground/30"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Tu nombre *</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="María García"
          maxLength={100}
          required
        />
      </div>

      {/* Email (optional) */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Correo (opcional)</label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          maxLength={255}
        />
      </div>

      {/* Review text */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Tu experiencia *</label>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Cuéntanos tu experiencia con el producto..."
          maxLength={1000}
          rows={4}
          required
        />
        <p className="text-xs text-muted-foreground mt-1">{text.length}/1000</p>
      </div>

      {/* Photo upload */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Fotos (opcional, máx. 3)</label>
        <div className="flex flex-wrap gap-3">
          {previews.map((preview, i) => (
            <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
              <img src={preview} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {photos.length < 3 && (
            <label className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
              <Camera className="w-6 h-6 text-muted-foreground" />
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Enviando...</>
        ) : (
          "Enviar reseña"
        )}
      </Button>
    </form>
  );
};
