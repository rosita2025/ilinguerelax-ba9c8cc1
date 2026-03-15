import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const buildAnnouncementHtml = (productName: string, productUrl: string, imageUrl: string): string => {
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
            Te escribimos porque te suscribiste para recibir novedades sobre nuestros libros. ¡Tenemos excelentes noticias!
          </p>

          <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-bottom: 24px;">
            El <strong>${productName}</strong> ya está disponible para comprar. 🎉
          </p>

          <div style="text-align: center; margin: 32px 0;">
            <img src="${imageUrl}" alt="${productName}" style="max-width: 200px; border-radius: 12px; box-shadow: 0 4px 14px rgba(0,0,0,0.15);" />
          </div>

          <div style="background: #fff7ed; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <p style="color: #9a3412; margin: 0; font-size: 14px; line-height: 1.6;">
              📚 <strong>¿Qué incluye?</strong><br>
              Libro físico tapa blanda de alta calidad con vocabulario esencial, pronunciación en español y fonética UK/USA.
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

  try {
    // Verify admin key
    const authHeader = req.headers.get("authorization");
    const adminKey = Deno.env.get("ADMIN_REVIEW_KEY");
    if (!authHeader || !authHeader.includes(adminKey || "")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { productTypes, subject, productName, productUrl, imageUrl, action, email } = body;

    // Handle marking a drip as converted (purchased)
    if (action === "mark_converted") {
      if (!email) {
        return new Response(JSON.stringify({ error: "Email required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      const { data, error } = await supabaseAdmin
        .from("announcement_drips")
        .update({ converted: true, is_completed: true, updated_at: new Date().toISOString() })
        .eq("email", email)
        .eq("converted", false);
      
      if (error) throw error;
      return new Response(
        JSON.stringify({ message: `Marked ${email} as converted`, data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!productTypes || !subject || !productName || !productUrl) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get subscribers who haven't received this announcement
    const { data: subscribers, error: fetchError } = await supabaseAdmin
      .from("store_subscribers")
      .select("*")
      .in("product_type", productTypes)
      .eq("announcement_sent", false)
      .limit(100);

    if (fetchError) throw fetchError;

    if (!subscribers || subscribers.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending subscribers", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const html = buildAnnouncementHtml(
      productName,
      productUrl,
      imageUrl || "https://ilinguerelax.com/images/product-5000-book.webp"
    );

    let sent = 0;
    let failed = 0;

    for (const subscriber of subscribers) {
      try {
        await resend.emails.send({
          from: "iLingue Relax <hola@ilinguerelax.com>",
          to: [subscriber.email],
          subject,
          html,
        });

        await supabaseAdmin
          .from("store_subscribers")
          .update({ announcement_sent: true, updated_at: new Date().toISOString() })
          .eq("id", subscriber.id);

        sent++;
        console.log(`Announcement sent to ${subscriber.email}`);
      } catch (emailError) {
        console.error(`Failed to send to ${subscriber.email}:`, emailError);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({ message: "Announcement complete", sent, failed, total: subscribers.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending announcements:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
