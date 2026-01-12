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
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, storeName }: NotificationRequest = await req.json();

    console.log(`Subscribing ${email} for ${storeName} notifications`);

    // Send confirmation to subscriber
    const subscriberEmail = await resend.emails.send({
      from: "iLingue Relax <onboarding@resend.dev>",
      to: [email],
      subject: `¡Te notificaremos cuando esté disponible en ${storeName}!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #f97316; margin-bottom: 10px;">🎉 ¡Gracias por suscribirte!</h1>
          </div>
          
          <p>Hola,</p>
          
          <p>Te has suscrito para recibir notificaciones cuando el <strong>Libro Físico de 8,000 Palabras en Inglés</strong> esté disponible en <strong>${storeName}</strong>.</p>
          
          <p>Te enviaremos un email tan pronto esté disponible para que puedas ser de los primeros en adquirirlo.</p>
          
          <div style="background: linear-gradient(135deg, #f97316, #fb923c); padding: 20px; border-radius: 12px; text-align: center; margin: 30px 0;">
            <p style="color: white; font-size: 18px; margin: 0;">📚 Mientras tanto, puedes adquirir la versión digital</p>
            <a href="https://ilinguerelax.com/products" style="display: inline-block; background: white; color: #f97316; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 15px;">Ver Productos Digitales</a>
          </div>
          
          <p>¡Gracias por tu interés!</p>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
            — El equipo de iLingue Relax<br>
            <a href="https://ilinguerelax.com" style="color: #f97316;">ilinguerelax.com</a>
          </p>
        </body>
        </html>
      `,
    });

    console.log("Subscriber email sent:", subscriberEmail);

    // Send notification to business
    const businessEmail = await resend.emails.send({
      from: "iLingue Relax <onboarding@resend.dev>",
      to: ["ilinguerelax@gmail.com"],
      subject: `📬 Nueva suscripción para ${storeName}`,
      html: `
        <h2>Nueva suscripción de notificación</h2>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Tienda:</strong> ${storeName}</p>
        <p><strong>Producto:</strong> Libro Físico 8,000 Palabras</p>
        <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}</p>
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