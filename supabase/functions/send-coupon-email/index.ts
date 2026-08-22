import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { resend } from "../_shared/brevo.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { assertInternalCall } from "../_shared/internalAuth.ts";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CouponEmailRequest {
  email: string;
  couponCode: string;
  discount: string;
  lang?: "es" | "en";
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const __blocked = await assertInternalCall(req);
  if (__blocked) return __blocked;

  try {
    const { email, couponCode, discount, lang = "es" }: CouponEmailRequest = await req.json();

    // Strip HTML-significant characters: these values are interpolated into
    // subject lines and HTML bodies (prevents HTML injection into inboxes).
    const safeDiscount = String(discount ?? "").replace(/[<>&"'`]/g, "").slice(0, 20);
    const safeCouponCode = String(couponCode ?? "").replace(/[^A-Za-z0-9-]/g, "").slice(0, 40);

    // Validate email
    if (!email || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Email inválido" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const isSpanish = lang === "es";

    const subject = isSpanish
      ? `🎁 ¡Tu cupón de ${discount} de descuento en iLingue Relax!`
      : `🎁 Your ${discount} discount coupon from iLingue Relax!`;

    const htmlContent = isSpanish
      ? `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">🎁 ¡Regalo Especial para Ti!</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <p style="font-size: 18px; color: #333333; margin-bottom: 20px;">
                ¡Hola! 👋
              </p>
              
              <p style="font-size: 16px; color: #555555; line-height: 1.6; margin-bottom: 25px;">
                Gracias por tu interés en <strong>iLingue Relax</strong>. Como regalo especial, te enviamos un cupón exclusivo de <strong style="color: #e53e3e;">${discount} de descuento</strong> en todos nuestros productos digitales.
              </p>
              
              <!-- Coupon Box -->
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 3px dashed #d97706; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                <p style="font-size: 14px; color: #92400e; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">Tu código exclusivo:</p>
                <p style="font-size: 36px; font-weight: 800; color: #92400e; margin: 0; letter-spacing: 4px;">${couponCode}</p>
              </div>
              
              <p style="font-size: 16px; color: #555555; line-height: 1.6; margin-bottom: 25px;">
                Usa este código al momento de realizar tu compra en nuestra tienda para obtener el descuento.
              </p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 35px 0;">
                <a href="https://ilinguerelax.com/products" style="display: inline-block; background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%); color: #ffffff; text-decoration: none; padding: 18px 40px; border-radius: 50px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(30, 58, 95, 0.3);">
                  🛒 Ver Productos
                </a>
              </div>
              
              <!-- Products -->
              <div style="background-color: #f8fafc; border-radius: 12px; padding: 25px; margin-top: 30px;">
                <h3 style="color: #1e3a5f; margin: 0 0 15px 0; font-size: 18px;">📚 Nuestros Productos Digitales:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #555555; line-height: 1.8;">
                  <li><strong>8,000 Palabras en Inglés</strong> - Vocabulario completo con pronunciación</li>
                  <li><strong>5,000 Palabras en Inglés</strong> - Edición esencial</li>
                  <li><strong>Spanish Relax - 5,000 Palabras</strong> - Aprende español</li>
                </ul>
              </div>
              
              <p style="font-size: 14px; color: #888888; margin-top: 30px; text-align: center;">
                ⏰ Este cupón es por tiempo limitado. ¡No lo dejes pasar!
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #1e3a5f; padding: 25px; text-align: center;">
              <p style="color: #94a3b8; margin: 0; font-size: 14px;">
                © ${new Date().getFullYear()} iLingue Relax. Todos los derechos reservados.
              </p>
              <p style="color: #64748b; margin: 10px 0 0 0; font-size: 12px;">
                hola@ilinguerelax.com
              </p>
            </div>
          </div>
        </body>
        </html>
      `
      : `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">🎁 Special Gift for You!</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <p style="font-size: 18px; color: #333333; margin-bottom: 20px;">
                Hello! 👋
              </p>
              
              <p style="font-size: 16px; color: #555555; line-height: 1.6; margin-bottom: 25px;">
                Thank you for your interest in <strong>iLingue Relax</strong>. As a special gift, we're sending you an exclusive <strong style="color: #e53e3e;">${discount} discount</strong> coupon for all our digital products.
              </p>
              
              <!-- Coupon Box -->
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 3px dashed #d97706; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                <p style="font-size: 14px; color: #92400e; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">Your exclusive code:</p>
                <p style="font-size: 36px; font-weight: 800; color: #92400e; margin: 0; letter-spacing: 4px;">${couponCode}</p>
              </div>
              
              <p style="font-size: 16px; color: #555555; line-height: 1.6; margin-bottom: 25px;">
                Use this code at checkout to get your discount.
              </p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 35px 0;">
                <a href="https://ilinguerelax.com/products" style="display: inline-block; background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%); color: #ffffff; text-decoration: none; padding: 18px 40px; border-radius: 50px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(30, 58, 95, 0.3);">
                  🛒 View Products
                </a>
              </div>
              
              <!-- Products -->
              <div style="background-color: #f8fafc; border-radius: 12px; padding: 25px; margin-top: 30px;">
                <h3 style="color: #1e3a5f; margin: 0 0 15px 0; font-size: 18px;">📚 Our Digital Products:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #555555; line-height: 1.8;">
                  <li><strong>8,000 English Words</strong> - Complete vocabulary with pronunciation</li>
                  <li><strong>5,000 English Words</strong> - Essential edition</li>
                  <li><strong>Spanish Relax - 5,000 Words</strong> - Learn Spanish</li>
                </ul>
              </div>
              
              <p style="font-size: 14px; color: #888888; margin-top: 30px; text-align: center;">
                ⏰ This coupon is for a limited time. Don't miss it!
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #1e3a5f; padding: 25px; text-align: center;">
              <p style="color: #94a3b8; margin: 0; font-size: 14px;">
                © ${new Date().getFullYear()} iLingue Relax. All rights reserved.
              </p>
              <p style="color: #64748b; margin: 10px 0 0 0; font-size: 12px;">
                hola@ilinguerelax.com
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

    // Save contact (ignore duplicates via unique index on lower(email)+source)
    try {
      await supabaseAdmin.from("email_contacts").insert({
        email: email.toLowerCase(),
        source: "coupon_popup",
        language: lang,
        metadata: { coupon_code: couponCode, discount },
      });
    } catch (e) {
      console.log("Contact already saved or insert skipped:", e);
    }

    // Send coupon email to customer
    const emailResponse = await resend.emails.send({
      from: "iLingue Relax <hola@ilinguerelax.com>",
      to: [email],
      subject: subject,
      html: htmlContent,
    });

    console.log("Coupon email sent successfully:", emailResponse);

    // Also notify business
    await resend.emails.send({
      from: "iLingue Relax <hola@ilinguerelax.com>",
      to: ["hola@ilinguerelax.com"],
      subject: `📬 Nuevo suscriptor de cupón: ${email}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Nuevo cliente suscrito al cupón ${couponCode}</h2>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Cupón:</strong> ${couponCode}</p>
          <p><strong>Descuento:</strong> ${discount}</p>
          <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}</p>
        </div>
      `,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-coupon-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);