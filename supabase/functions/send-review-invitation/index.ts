import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReviewInvitationRequest {
  customerEmail: string;
  customerName?: string;
  productType?: string;
  productName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { customerEmail, customerName, productType, productName }: ReviewInvitationRequest = await req.json();

    if (!customerEmail) {
      return new Response(JSON.stringify({ error: "customerEmail is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const name = customerName || "Estudiante";
    const product = productType || "english";
    const displayName = productName || "Inglés Relax";
    const reviewUrl = `https://ilinguerelax.com/dejar-resena?product=${encodeURIComponent(product)}`;

    const emailResponse = await resend.emails.send({
      from: "iLingue Relax <hola@ilinguerelax.com>",
      to: [customerEmail],
      subject: `⭐ ${name}, ¿qué te pareció ${displayName}?`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 16px 16px 0 0; padding: 40px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">⭐⭐⭐⭐⭐</div>
              <h1 style="color: white; margin: 0; font-size: 24px;">¿Qué te pareció tu libro?</h1>
            </div>
            
            <div style="background: white; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <p style="font-size: 18px; color: #1f2937; margin-bottom: 24px;">
                ¡Hola ${name}! 👋
              </p>
              
              <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-bottom: 24px;">
                Esperamos que estés disfrutando <strong>${displayName}</strong>. Tu opinión es muy importante para nosotros y ayuda a otros estudiantes a decidirse.
              </p>
              
              <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-bottom: 24px;">
                ¿Podrías dedicarnos 1 minuto para compartir tu experiencia? 🙏
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${reviewUrl}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 18px; font-weight: bold; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4);">
                  ⭐ Dejar Mi Reseña
                </a>
              </div>
              
              <div style="background: #ecfdf5; border-radius: 12px; padding: 24px; margin: 32px 0;">
                <p style="color: #065f46; margin: 0; font-size: 14px; line-height: 1.6;">
                  💚 <strong>Tu reseña puede incluir fotos</strong> de tu libro o de cómo lo usas. ¡Nos encanta ver tu progreso!
                </p>
              </div>
              
              <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-top: 32px;">
                ¡Muchas gracias!<br>
                <strong style="color: #f59e0b;">El equipo de iLingue Relax</strong>
              </p>
            </div>
            
            <div style="text-align: center; padding: 24px; color: #9ca3af; font-size: 12px;">
              <p style="margin: 0;">© 2025 iLingue Relax. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Review invitation email sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, email: emailResponse }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error sending review invitation:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
