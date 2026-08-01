import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resend } from "../_shared/brevo.ts";
import { assertInternalCall } from "../_shared/internalAuth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Intervals in days for follow-up emails (10 total sends including initial)
const DRIP_INTERVALS_DAYS = [0, 1, 2, 4, 9, 15, 22, 30, 45, 60];

const buildAnnouncementHtml = (
  productName: string,
  productUrl: string,
  imageUrl: string,
  emailIndex: number
): string => {
  const isFirstEmail = emailIndex === 0;
  const greeting = isFirstEmail
    ? "¡Tenemos excelentes noticias!"
    : "¡No te lo pierdas! Te recordamos que ya está disponible:";

  const urgencyMessages = [
    "",
    "⏰ ¡No dejes pasar esta oportunidad!",
    "🔥 ¡Muchas personas ya lo están disfrutando!",
    "📚 ¡Últimas unidades con precio de lanzamiento!",
    "💡 ¿Sabías que aprender con un libro físico mejora la retención?",
    "🌟 ¡Miles de estudiantes ya mejoraron su inglés con este método!",
    "⚡ ¡Aprovecha antes de que suba el precio!",
    "🎯 ¡Tu inglés puede mejorar hoy mismo!",
    "📖 ¡Última oportunidad a este precio especial!",
    "🚀 ¡No te quedes atrás! Últimos recordatorios.",
  ];

  const urgency = urgencyMessages[emailIndex] || "";

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); border-radius: 16px 16px 0 0; padding: 40px; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 16px;">📖🎉</div>
          <h1 style="color: white; margin: 0; font-size: 24px;">¡Ya está disponible!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 18px;">${productName}</p>
        </div>
        
        <div style="background: white; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <p style="font-size: 18px; color: #1f2937; margin-bottom: 24px;">
            ¡Hola! 👋
          </p>
          
          <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-bottom: 24px;">
            ${greeting}
          </p>

          <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-bottom: 24px;">
            El <strong>${productName}</strong> ya está disponible para comprar. 🎉
          </p>

          ${urgency ? `<p style="font-size: 16px; color: #ea580c; font-weight: bold; text-align: center; margin: 20px 0;">${urgency}</p>` : ""}

          <div style="text-align: center; margin: 32px 0;">
            <img src="${imageUrl}" alt="${productName}" style="max-width: 200px; border-radius: 12px; box-shadow: 0 4px 14px rgba(0,0,0,0.15);" />
          </div>

          <div style="background: #fff7ed; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <p style="color: #9a3412; margin: 0; font-size: 14px; line-height: 1.6;">
              📚 <strong>¿Qué incluye?</strong><br>
              Libro físico tapa blanda de alta calidad con vocabulario esencial, pronunciación en español y fonética UK/USA. Incluye versión digital GRATIS.
            </p>
          </div>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${productUrl}" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 18px; font-weight: bold; box-shadow: 0 4px 14px rgba(249, 115, 22, 0.4);">
              📖 Ver Libro Físico
            </a>
          </div>
          
          <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-top: 32px;">
            ¡Muchas gracias por tu interés!<br>
            <strong style="color: #f97316;">El equipo de iLingue Relax</strong>
          </p>
        </div>
        
        <div style="text-align: center; padding: 24px; color: #9ca3af; font-size: 12px;">
          <p style="margin: 0;">© 2025 iLingue Relax. Todos los derechos reservados.</p>
          <p style="margin: 8px 0 0;">Si no deseas recibir más correos, responde "CANCELAR" a este email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const __blocked = await assertInternalCall(req);
  if (__blocked) return __blocked;

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get drips that are due and not completed
    const { data: drips, error: fetchError } = await supabaseAdmin
      .from("announcement_drips")
      .select("*")
      .eq("is_completed", false)
      .eq("converted", false)
      .lte("next_email_at", new Date().toISOString())
      .limit(50);

    if (fetchError) throw fetchError;

    if (!drips || drips.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending drips", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let sent = 0;
    let failed = 0;
    let completed = 0;

    for (const drip of drips) {
      const emailIndex = drip.emails_sent;

      // If we've sent all emails in the sequence, mark as completed
      if (emailIndex >= DRIP_INTERVALS_DAYS.length) {
        await supabaseAdmin
          .from("announcement_drips")
          .update({ is_completed: true, updated_at: new Date().toISOString() })
          .eq("id", drip.id);
        completed++;
        continue;
      }

      const subjects = [
        `📖 ¡Ya disponible! ${drip.product_name}`,
        `⏰ ¡No te lo pierdas! ${drip.product_name}`,
        `🔥 ¡Muchos ya lo tienen! ${drip.product_name}`,
        `📚 ¡Últimas unidades! ${drip.product_name}`,
        `💡 Mejora tu inglés con ${drip.product_name}`,
        `🌟 ¡Miles lo recomiendan! ${drip.product_name}`,
        `⚡ ¡Precio especial! ${drip.product_name}`,
        `🎯 ¡Tu oportunidad! ${drip.product_name}`,
        `📖 ¡Última oportunidad! ${drip.product_name}`,
        `🚀 ¡Último recordatorio! ${drip.product_name}`,
      ];

      const html = buildAnnouncementHtml(
        drip.product_name,
        drip.product_url,
        drip.image_url || "https://ilinguerelax.com/images/product-5000-book.webp",
        emailIndex
      );

      try {
        await resend.emails.send({
          from: "iLingue Relax <hola@ilinguerelax.com>",
          to: [drip.email],
          subject: subjects[emailIndex] || `📖 ${drip.product_name} - Recordatorio`,
          html,
        });

        const nextIndex = emailIndex + 1;
        const isLast = nextIndex >= DRIP_INTERVALS_DAYS.length;

        // Calculate next email time
        let nextEmailAt = new Date();
        if (!isLast) {
          const nextIntervalDays = DRIP_INTERVALS_DAYS[nextIndex];
          const createdAt = new Date(drip.created_at);
          nextEmailAt = new Date(createdAt.getTime() + nextIntervalDays * 24 * 60 * 60 * 1000);
        }

        await supabaseAdmin
          .from("announcement_drips")
          .update({
            emails_sent: nextIndex,
            last_email_sent_at: new Date().toISOString(),
            next_email_at: nextEmailAt.toISOString(),
            is_completed: isLast,
            updated_at: new Date().toISOString(),
          })
          .eq("id", drip.id);

        sent++;
        console.log(`Drip #${nextIndex} sent to ${drip.email} for ${drip.product_name}`);
      } catch (emailError) {
        console.error(`Failed to send drip to ${drip.email}:`, emailError);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({ message: "Drip processing complete", sent, failed, completed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing announcement drips:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
