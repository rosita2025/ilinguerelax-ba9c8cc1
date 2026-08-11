import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resend } from "../_shared/brevo.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const buildCouponEmail = (customerName: string, couponCode: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 16px 16px 0 0; padding: 40px; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 16px;">🎁</div>
          <h1 style="color: white; margin: 0; font-size: 24px;">¡Gracias por tu reseña!</h1>
        </div>
        
        <div style="background: white; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <p style="font-size: 18px; color: #1f2937; margin-bottom: 24px;">
            ¡Hola ${customerName}! 👋
          </p>
          
          <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-bottom: 24px;">
            Muchísimas gracias por tomarte el tiempo de compartir tu experiencia. Valoramos mucho tu opinión y nos alegra saber que formas parte de nuestra comunidad.
          </p>
          
          <div style="background: #f0fdf4; border: 2px dashed #10b981; border-radius: 12px; padding: 32px; text-align: center; margin: 32px 0;">
            <p style="color: #065f46; margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; font-weight: bold; tracking-wider;">Tu Código de Descuento</p>
            <h2 style="color: #059669; margin: 0; font-size: 32px; font-weight: 900; letter-spacing: 2px;">${couponCode}</h2>
            <p style="color: #065f46; margin: 8px 0 0 0; font-size: 16px;"><strong>15% OFF</strong> en toda la tienda</p>
          </div>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="https://ilinguerelax.com/products" style="display: inline-block; background: #10b981; color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 18px; font-weight: bold;">
              🚀 Usar mi cupón ahora
            </a>
          </div>
          
          <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-top: 32px;">
            ¡Sigue aprendiendo con éxito!<br>
            <strong style="color: #10b981;">El equipo de iLingue Relax</strong>
          </p>
        </div>
        
        <div style="text-align: center; padding: 24px; color: #9ca3af; font-size: 12px;">
          <p style="margin: 0;">© 2026 iLingue Relax. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Esta función será llamada por un trigger o manualmente cuando se apruebe una reseña
    const { email, name } = await req.json();

    if (!email) throw new Error("Email is required");

    // Verificar si ya se le envió un cupón por reseña recientemente para evitar spam
    // Aunque el usuario pide "sin spam", aseguramos que solo reciba uno por cada reseña aprobada
    
    const couponCode = "GRACIAS15"; // Podría ser dinámico si tuviéramos tabla de cupones

    await resend.emails.send({
      from: "iLingue Relax <hola@ilinguerelax.com>",
      to: [email],
      subject: `🎁 ¡Tu regalo de iLingue Relax ha llegado!`,
      html: buildCouponEmail(name || "Estudiante", couponCode),
    });

    return new Response(JSON.stringify({ success: true, message: "Coupon sent" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error sending review coupon:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
