import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  email: string;
  storeName: string;
  productType?: "spanish" | "english" | "german" | "portuguese";
}

function getEmailContent(productType: string, email: string, storeName: string) {
  switch (productType) {
    case "german":
      return {
        subject: `🎉 ¡Gracias por suscribirte! Te avisaremos cuando Alemán Relax esté disponible`,
        productName: "Alemán Relax - 5,000 Palabras en Alemán",
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #dc2626; margin-bottom: 10px;">🎉 ¡Gracias por suscribirte!</h1>
            </div>
            <p>Hola,</p>
            <p>¡Gracias por tu interés en <strong>Alemán Relax - 5,000 Palabras en Alemán</strong> con pronunciación para hispanohablantes y fonética alemana!</p>
            <p>Te avisaremos cuando el libro digital esté disponible. ¡Muy pronto!</p>
            <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
              <p style="margin: 0; color: #991b1b;">🇩🇪 <strong>¿Qué incluye?</strong></p>
              <p style="margin: 10px 0 0 0;">5,000 palabras en alemán con pronunciación adaptada para hispanohablantes y fonética alemana (IPA). Libro digital PDF.</p>
            </div>
            <div style="background: linear-gradient(135deg, #dc2626, #ef4444); padding: 20px; border-radius: 12px; text-align: center; margin: 30px 0;">
              <p style="color: white; font-size: 18px; margin: 0;">📱 Mientras tanto, explora nuestros productos disponibles</p>
              <a href="https://ilinguerelax.com/products" style="display: inline-block; background: white; color: #dc2626; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 15px;">Ver Productos</a>
            </div>
            <p>¡Gracias por confiar en nosotros!</p>
            <p style="color: #666; font-size: 14px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
              — El equipo de iLingue Relax<br>
              <a href="https://ilinguerelax.com" style="color: #dc2626;">ilinguerelax.com</a><br>
              📧 hola@ilinguerelax.com
            </p>
            <p style="color: #999; font-size: 12px; margin-top: 20px;"><em>Email del suscriptor: ${email}</em></p>
          </body>
          </html>
        `,
      };

    case "portuguese":
      return {
        subject: `🎉 ¡Gracias por suscribirte! Te avisaremos cuando Portugués Relax esté disponible`,
        productName: "Portugués Relax - 5,000 Palabras en Portugués",
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #16a34a; margin-bottom: 10px;">🎉 ¡Gracias por suscribirte!</h1>
            </div>
            <p>Hola,</p>
            <p>¡Gracias por tu interés en <strong>Portugués Relax - 5,000 Palabras en Portugués</strong> con pronunciación adaptada para hispanohablantes y fonética en portugués real!</p>
            <p>Te avisaremos cuando el libro digital esté disponible. ¡Muy pronto!</p>
            <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
              <p style="margin: 0; color: #166534;">🇧🇷 <strong>¿Qué incluye?</strong></p>
              <p style="margin: 10px 0 0 0;">5,000 palabras en portugués con pronunciación adaptada para hispanohablantes y fonética en portugués real. Libro digital PDF.</p>
            </div>
            <div style="background: linear-gradient(135deg, #16a34a, #22c55e); padding: 20px; border-radius: 12px; text-align: center; margin: 30px 0;">
              <p style="color: white; font-size: 18px; margin: 0;">📱 Mientras tanto, explora nuestros productos disponibles</p>
              <a href="https://ilinguerelax.com/products" style="display: inline-block; background: white; color: #16a34a; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 15px;">Ver Productos</a>
            </div>
            <p>¡Gracias por confiar en nosotros!</p>
            <p style="color: #666; font-size: 14px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
              — El equipo de iLingue Relax<br>
              <a href="https://ilinguerelax.com" style="color: #16a34a;">ilinguerelax.com</a><br>
              📧 hola@ilinguerelax.com
            </p>
            <p style="color: #999; font-size: 12px; margin-top: 20px;"><em>Email del suscriptor: ${email}</em></p>
          </body>
          </html>
        `,
      };

    case "spanish":
      return {
        subject: `🎉 Thanks for subscribing! We'll notify you when available on ${storeName}`,
        productName: "Spanish Relax - 5,000 Words Physical Book",
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #8b5cf6; margin-bottom: 10px;">🎉 Thanks for Subscribing!</h1>
            </div>
            <p>Hello,</p>
            <p>Thank you for your interest in the <strong>Spanish Relax - 5,000 Words Physical Book</strong>!</p>
            <p>You've subscribed to receive notifications when it's available on <strong>${storeName}</strong>. We'll let you know soon!</p>
            <div style="background: #f5f3ff; border-left: 4px solid #8b5cf6; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
              <p style="margin: 0; color: #6d28d9;">📚 <strong>When will it be available?</strong></p>
              <p style="margin: 10px 0 0 0;">We're working to publish the physical book as soon as possible. You'll be among the first to know when it's ready.</p>
            </div>
            <div style="background: linear-gradient(135deg, #8b5cf6, #a78bfa); padding: 20px; border-radius: 12px; text-align: center; margin: 30px 0;">
              <p style="color: white; font-size: 18px; margin: 0;">📱 In the meantime, get the digital version</p>
              <a href="https://ilinguerelax.com/products/5-000-spanish-words-with-english-pronunciation" style="display: inline-block; background: white; color: #8b5cf6; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 15px;">View Digital Products</a>
            </div>
            <p>Thank you for trusting us!</p>
            <p style="color: #666; font-size: 14px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
              — The iLingue Relax Team<br>
              <a href="https://ilinguerelax.com" style="color: #8b5cf6;">ilinguerelax.com</a><br>
              📧 hola@ilinguerelax.com
            </p>
            <p style="color: #999; font-size: 12px; margin-top: 20px;"><em>Subscriber email: ${email}</em></p>
          </body>
          </html>
        `,
      };

    default: // "english" - Libro Físico 8,000 Palabras en Inglés
      return {
        subject: `🎉 ¡Gracias por suscribirte! Te avisaremos cuando el Libro Físico esté disponible`,
        productName: "Libro Físico 8,000 Palabras en Inglés",
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #f97316; margin-bottom: 10px;">🎉 ¡Gracias por suscribirte!</h1>
            </div>
            <p>Hola,</p>
            <p>¡Gracias por tu interés en el <strong>Libro Físico de 8,000 Palabras en Inglés</strong>!</p>
            <p>Te avisaremos cuando esté disponible. ¡Muy pronto!</p>
            <div style="background: #fff8f0; border-left: 4px solid #f97316; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
              <p style="margin: 0; color: #c2410c;">📚 <strong>¿Cuándo estará disponible?</strong></p>
              <p style="margin: 10px 0 0 0;">Estamos trabajando para publicar el libro físico lo más pronto posible. Serás de los primeros en saberlo cuando esté listo.</p>
            </div>
            <div style="background: linear-gradient(135deg, #f97316, #fb923c); padding: 20px; border-radius: 12px; text-align: center; margin: 30px 0;">
              <p style="color: white; font-size: 18px; margin: 0;">📱 Mientras tanto, puedes adquirir la versión digital</p>
              <a href="https://ilinguerelax.com/products" style="display: inline-block; background: white; color: #f97316; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 15px;">Ver Productos Digitales</a>
            </div>
            <p>¡Gracias por confiar en nosotros!</p>
            <p style="color: #666; font-size: 14px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
              — El equipo de iLingue Relax<br>
              <a href="https://ilinguerelax.com" style="color: #f97316;">ilinguerelax.com</a><br>
              📧 hola@ilinguerelax.com
            </p>
            <p style="color: #999; font-size: 12px; margin-top: 20px;"><em>Email del suscriptor: ${email}</em></p>
          </body>
          </html>
        `,
      };
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, storeName, productType = "english" }: NotificationRequest = await req.json();

    console.log(`Subscribing ${email} for ${storeName} notifications (${productType})`);

    const { subject, productName, html } = getEmailContent(productType, email, storeName);

    // Send confirmation to subscriber
    const subscriberEmail = await resend.emails.send({
      from: "iLingue Relax <hola@ilinguerelax.com>",
      to: [email],
      reply_to: "hola@ilinguerelax.com",
      subject,
      html,
    });

    console.log("Subscriber email sent:", subscriberEmail);

    // Send notification to business
    const businessEmail = await resend.emails.send({
      from: "iLingue Relax <hola@ilinguerelax.com>",
      to: ["hola@ilinguerelax.com"],
      subject: `📬 Nueva suscripción - ${productName}`,
      html: `
        <h2>Nueva Suscripción de Notificación</h2>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Producto:</strong> ${productName}</p>
        <p><strong>Tipo:</strong> ${productType}</p>
        <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
      `,
    });

    console.log("Business notification sent:", businessEmail);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-store-notification:", error);
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
