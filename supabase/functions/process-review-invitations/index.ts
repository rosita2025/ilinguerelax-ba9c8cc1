import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resend } from "../_shared/brevo.ts";
import { assertInternalCall } from "../_shared/internalAuth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Schedule: 1 day, 5 days, 10 days, 15 days, 30 days, 60 days
// intervals[i] = delay AFTER emails_sent == i before sending email i+1
const EMAIL_INTERVALS_DAYS = [1, 5, 10, 15, 30, 60];
const MAX_EMAILS = EMAIL_INTERVALS_DAYS.length;

const getNextEmailDelay = (emailsSent: number): number | null => {
  if (emailsSent >= MAX_EMAILS) return null;
  return EMAIL_INTERVALS_DAYS[emailsSent] * 24 * 60 * 60 * 1000;
};

const buildEmailHtml = (customerName: string, displayName: string, reviewUrl: string, emailNumber: number): string => {
  const subjects: Record<number, string> = {
    1: "¿Qué te pareció tu libro?",
    2: "Tu opinión nos importa mucho",
    3: "¡Aún esperamos tu reseña!",
    4: "Comparte tu experiencia con otros estudiantes",
    5: "Última oportunidad para dejar tu reseña",
    6: "Te extrañamos - ¿nos dejas tu opinión?",
  };
  
  const headline = subjects[emailNumber] || "¿Qué te pareció tu libro?";

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 16px 16px 0 0; padding: 40px; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 16px;">⭐⭐⭐⭐⭐</div>
          <h1 style="color: white; margin: 0; font-size: 24px;">${headline}</h1>
        </div>
        
        <div style="background: white; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <p style="font-size: 18px; color: #1f2937; margin-bottom: 24px;">
            ¡Hola ${customerName}! 👋
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
  `;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const __blocked = assertInternalCall(req);
  if (__blocked) return __blocked;

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get pending invitations where next_email_at <= now and not completed
    const { data: invitations, error: fetchError } = await supabaseAdmin
      .from("review_invitations")
      .select("*")
      .eq("is_completed", false)
      .eq("has_reviewed", false)
      .lte("next_email_at", new Date().toISOString())
      .order("next_email_at", { ascending: true })
      .limit(50);

    if (fetchError) throw fetchError;

    if (!invitations || invitations.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending invitations", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let processed = 0;
    let skipped = 0;

    for (const invitation of invitations) {
      // Check if customer already submitted a review
      const { data: existingReview } = await supabaseAdmin
        .from("reviews")
        .select("id")
        .eq("customer_email", invitation.customer_email)
        .eq("product_type", invitation.product_type)
        .maybeSingle();

      if (existingReview) {
        // Customer already reviewed - mark as complete
        await supabaseAdmin
          .from("review_invitations")
          .update({ has_reviewed: true, is_completed: true, updated_at: new Date().toISOString() })
          .eq("id", invitation.id);
        skipped++;
        continue;
      }

      // Check if max emails reached
      if (invitation.emails_sent >= MAX_EMAILS) {
        await supabaseAdmin
          .from("review_invitations")
          .update({ is_completed: true, updated_at: new Date().toISOString() })
          .eq("id", invitation.id);
        skipped++;
        continue;
      }

      const emailNumber = invitation.emails_sent + 1;
      const reviewUrl = `https://ilinguerelax.com/dejar-resena?product=${encodeURIComponent(invitation.product_type)}`;

      const subjects: Record<number, string> = {
        1: `⭐ ${invitation.customer_name}, ¿qué te pareció ${invitation.product_name}?`,
        2: `💬 ${invitation.customer_name}, tu opinión nos importa mucho`,
        3: `📝 ¡Aún esperamos tu reseña, ${invitation.customer_name}!`,
        4: `🌟 Comparte tu experiencia con ${invitation.product_name}`,
        5: `⏰ Última oportunidad - ¿nos dejas tu opinión?`,
        6: `💛 Te extrañamos, ${invitation.customer_name} - ¿qué tal tu libro?`,
      };

      try {
        await resend.emails.send({
          from: "iLingue Relax <hola@ilinguerelax.com>",
          to: [invitation.customer_email],
          subject: subjects[emailNumber] || `⭐ ¿Qué te pareció ${invitation.product_name}?`,
          html: buildEmailHtml(invitation.customer_name, invitation.product_name, reviewUrl, emailNumber),
        });

        // Calculate next email time
        const nextDelay = getNextEmailDelay(emailNumber);
        const updateData: Record<string, unknown> = {
          emails_sent: emailNumber,
          last_email_sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        if (nextDelay) {
          updateData.next_email_at = new Date(Date.now() + nextDelay).toISOString();
        } else {
          updateData.is_completed = true;
        }

        await supabaseAdmin
          .from("review_invitations")
          .update(updateData)
          .eq("id", invitation.id);

        processed++;
        console.log(`Review invitation email #${emailNumber} sent to ${invitation.customer_email}`);
      } catch (emailError) {
        console.error(`Failed to send email to ${invitation.customer_email}:`, emailError);
      }
    }

    return new Response(
      JSON.stringify({ message: "Processing complete", processed, skipped }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing review invitations:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
