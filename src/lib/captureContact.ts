import { supabase } from "@/integrations/supabase/client";

export type CaptureContactInput = {
  email: string;
  name?: string;
  source?: string;
  productType?: string;
  language?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Guarda el contacto del comprador en `email_contacts`.
 * La tabla está protegida por RLS (sin acceso público), así que el guardado
 * pasa por una edge function con service-role en vez de escribir desde el
 * navegador (que siempre fallaba con "row-level security policy").
 */
export function captureEmailContact(input: CaptureContactInput): void {
  const email = (input.email || "").trim().toLowerCase();
  if (!email.includes("@")) return;

  void supabase.functions
    .invoke("capture-email-contact", {
      body: {
        email,
        name: (input.name || "").trim(),
        source: input.source || "checkout-prueba-1",
        product_type: input.productType,
        language: input.language,
        metadata: input.metadata ?? {},
      },
    })
    .catch((err) => console.warn("[capture-email-contact] failed", err));
}
