import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Email intervals: after how many seconds from cart creation each email should be sent
const EMAIL_SCHEDULE = [
  { index: 0, delayMs: 0 },                          // Email 1: immediate (already scheduled at 1h)
  { index: 1, delayMs: 24 * 60 * 60 * 1000 },        // Email 2: +1 day
  { index: 2, delayMs: 3 * 24 * 60 * 60 * 1000 },    // Email 3: +3 days (4 days total)
  { index: 3, delayMs: 3 * 24 * 60 * 60 * 1000 },    // Email 4: +3 days (7 days total)
  { index: 4, delayMs: 8 * 24 * 60 * 60 * 1000 },    // Email 5: +8 days (15 days total)
  { index: 5, delayMs: 15 * 24 * 60 * 60 * 1000 },   // Email 6: +15 days (30 days total)
];

const HOTMART_CHECKOUT_URL = "https://pay.hotmart.com/O100578526P?off=gis8lsvy&checkoutMode=10&bid=1760824943067";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get all carts that need an email sent now
    const now = new Date().toISOString();
    const { data: pendingCarts, error } = await supabase
      .from("abandoned_carts")
      .select("*")
      .eq("is_completed", false)
      .eq("converted", false)
      .lte("next_email_at", now)
      .order("next_email_at", { ascending: true })
      .limit(50);

    if (error) {
      console.error("Error fetching pending carts:", error);
      throw error;
    }

    if (!pendingCarts || pendingCarts.length === 0) {
      console.log("No pending abandoned cart emails to send");
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing ${pendingCarts.length} abandoned cart emails`);

    let processed = 0;
    let errors = 0;

    for (const cart of pendingCarts) {
      try {
        const emailIndex = cart.emails_sent;
        
        if (emailIndex >= 6) {
          // Max emails reached, mark as completed
          await supabase
            .from("abandoned_carts")
            .update({ is_completed: true })
            .eq("id", cart.id);
          continue;
        }

        const emailContent = getEmailContent(emailIndex, cart.customer_name, cart.language);
        
        const emailResponse = await resend.emails.send({
          from: "iLingue Relax <hola@ilinguerelax.com>",
          to: [cart.customer_email],
          subject: emailContent.subject,
          html: emailContent.html,
        });

        console.log(`Email ${emailIndex + 1}/6 sent to ${cart.customer_email}:`, emailResponse);

        // Calculate next email time
        const nextEmailIndex = emailIndex + 1;
        const isLastEmail = nextEmailIndex >= 6;

        const updateData: Record<string, unknown> = {
          emails_sent: nextEmailIndex,
          last_email_sent_at: now,
          is_completed: isLastEmail,
        };

        if (!isLastEmail) {
          const nextDelay = EMAIL_SCHEDULE[nextEmailIndex]?.delayMs || 0;
          updateData.next_email_at = new Date(Date.now() + nextDelay).toISOString();
        }

        await supabase
          .from("abandoned_carts")
          .update(updateData)
          .eq("id", cart.id);

        processed++;
      } catch (emailError) {
        console.error(`Error processing cart ${cart.id}:`, emailError);
        errors++;
      }
    }

    console.log(`Processed: ${processed}, Errors: ${errors}`);

    return new Response(
      JSON.stringify({ processed, errors, total: pendingCarts.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Process error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getEmailContent(index: number, name: string, lang: string) {
  const isSpanish = lang === "es";
  const firstName = name.split(" ")[0];

  const templates = isSpanish ? getSpanishTemplates(firstName) : getEnglishTemplates(firstName);
  return templates[index] || templates[0];
}

function getSpanishTemplates(name: string) {
  return [
    // Email 1: 1 hora - Recordatorio suave
    {
      subject: `${name}, ¡tu libro te está esperando! 📚`,
      html: buildEmail({
        name,
        headline: "¡Tu libro te está esperando!",
        body: `<p>Notamos que estabas a punto de conseguir <strong>"Inglés Relax - 5,000 Palabras"</strong> pero no completaste la compra.</p>
        <p>¡No te preocupes! Tu selección sigue disponible al <strong>precio especial de $12</strong> (antes $54).</p>
        <p>Con este libro podrás aprender 5,000 palabras en inglés de forma relajada y sin estrés, con pronunciación adaptada para hispanohablantes.</p>`,
        ctaText: "Completar mi compra →",
        ctaUrl: HOTMART_CHECKOUT_URL,
        footer: "Este precio especial podría no estar disponible por mucho tiempo.",
        color: "#8b5cf6",
      }),
    },
    // Email 2: 1 día - Beneficios
    {
      subject: `${name}, ¿sabías que puedes aprender 5,000 palabras sin estrés? 🧠`,
      html: buildEmail({
        name,
        headline: "¿Por qué miles ya aprenden con nosotros?",
        body: `<p>Ayer estuviste viendo nuestro libro <strong>"Inglés Relax - 5,000 Palabras"</strong> y queremos contarte por qué es diferente:</p>
        <ul style="color: #4b5563; line-height: 2;">
          <li>✅ <strong>5,000 palabras</strong> con pronunciación en español</li>
          <li>✅ <strong>Fonética UK y USA</strong> para que elijas tu acento</li>
          <li>✅ <strong>52 capítulos temáticos</strong> organizados por situaciones reales</li>
          <li>✅ <strong>4 Bonus GRATIS</strong> incluidos con tu compra</li>
          <li>✅ <strong>Descarga inmediata</strong> - empieza hoy mismo</li>
        </ul>
        <p>Y todo esto por solo <strong>$12</strong> en lugar de $54. ¡Un 78% de descuento!</p>`,
        ctaText: "¡Quiero mi libro ahora! 📚",
        ctaUrl: HOTMART_CHECKOUT_URL,
        footer: "Más de 1,200 personas ya confían en el método Relax.",
        color: "#6366f1",
      }),
    },
    // Email 3: 4 días - Urgencia
    {
      subject: `⏰ ${name}, el precio especial está por terminar`,
      html: buildEmail({
        name,
        headline: "El tiempo corre...",
        body: `<p>Han pasado unos días desde que visitaste <strong>"Inglés Relax - 5,000 Palabras"</strong>.</p>
        <p>Queremos recordarte que el precio especial de <strong>$12</strong> (un ahorro del 78%) es por tiempo limitado.</p>
        <p>Imagina poder dominar 5,000 palabras en inglés aprendiendo solo <strong>10-15 palabras al día</strong>, sin estrés y a tu propio ritmo.</p>
        <p>No dejes pasar esta oportunidad. ¡Tu futuro bilingüe te espera!</p>`,
        ctaText: "Aprovechar el descuento →",
        ctaUrl: HOTMART_CHECKOUT_URL,
        footer: "Recuerda: incluye 4 bonus gratis valorados en más de $40.",
        color: "#ec4899",
      }),
    },
    // Email 4: 1 semana - Testimonio social
    {
      subject: `${name}, mira lo que dicen nuestros estudiantes 🌟`,
      html: buildEmail({
        name,
        headline: "Lo que dicen nuestros estudiantes",
        body: `<p>Hace una semana estuviste interesado en <strong>"Inglés Relax - 5,000 Palabras"</strong>. Mira lo que dicen quienes ya lo tienen:</p>
        <div style="background: #f3f4f6; border-left: 4px solid #8b5cf6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="font-style: italic; color: #4b5563;">"Nunca pensé que aprender inglés pudiera ser tan fácil. La pronunciación en español me ayudó muchísimo."</p>
          <p style="color: #6b7280; font-size: 14px;">⭐⭐⭐⭐⭐ - María G.</p>
        </div>
        <div style="background: #f3f4f6; border-left: 4px solid #6366f1; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="font-style: italic; color: #4b5563;">"Lo mejor es que puedo aprender a mi ritmo, sin presión. Ya llevo 500 palabras en 2 semanas."</p>
          <p style="color: #6b7280; font-size: 14px;">⭐⭐⭐⭐⭐ - Carlos R.</p>
        </div>
        <p>Únete a más de <strong>1,200 estudiantes</strong> que ya están aprendiendo con el método Relax.</p>`,
        ctaText: "Unirme ahora por solo $12 →",
        ctaUrl: HOTMART_CHECKOUT_URL,
        footer: "Satisfacción garantizada con nuestro método.",
        color: "#8b5cf6",
      }),
    },
    // Email 5: 15 días - Última oportunidad
    {
      subject: `🚨 ${name}, última oportunidad: 78% de descuento`,
      html: buildEmail({
        name,
        headline: "¡Última oportunidad!",
        body: `<p>Hace 15 días mostraste interés en aprender inglés con nuestro método Relax.</p>
        <p>Este es un recordatorio amistoso de que el <strong>descuento del 78%</strong> sigue activo, pero no por mucho tiempo más.</p>
        <p><strong>Lo que recibes:</strong></p>
        <ul style="color: #4b5563; line-height: 2;">
          <li>📖 5,000 palabras con pronunciación</li>
          <li>🎁 4 Bonus gratis (diccionario, estructura, artículos, y más)</li>
          <li>📱 Descarga inmediata en PDF</li>
          <li>🔄 Actualizaciones gratuitas de por vida</li>
        </ul>
        <p>Todo por solo <strong>$12</strong> en vez de $54.</p>`,
        ctaText: "¡SÍ, QUIERO MI LIBRO! 🎉",
        ctaUrl: HOTMART_CHECKOUT_URL,
        footer: "Esta podría ser tu última oportunidad a este precio.",
        color: "#ef4444",
      }),
    },
    // Email 6: 30 días - Despedida
    {
      subject: `${name}, te decimos adiós (pero con un regalo) 🎁`,
      html: buildEmail({
        name,
        headline: "Un último mensaje para ti",
        body: `<p>Ha pasado un mes desde que visitaste nuestra página y este será nuestro último correo sobre <strong>"Inglés Relax - 5,000 Palabras"</strong>.</p>
        <p>Entendemos que quizás no era el momento adecuado, y lo respetamos completamente.</p>
        <p>Pero antes de despedirnos, queremos dejarte el enlace por si en algún momento decides dar el paso. El precio de <strong>$12</strong> seguirá disponible para ti:</p>
        <p>Aprender inglés no tiene que ser difícil ni estresante. Cuando estés listo, estaremos aquí para ayudarte. 💜</p>`,
        ctaText: "Guardar mi enlace de compra →",
        ctaUrl: HOTMART_CHECKOUT_URL,
        footer: "¡Te deseamos mucho éxito en tu aprendizaje! Este es nuestro último correo.",
        color: "#8b5cf6",
      }),
    },
  ];
}

function getEnglishTemplates(name: string) {
  return [
    {
      subject: `${name}, your book is waiting for you! 📚`,
      html: buildEmail({
        name,
        headline: "Your book is waiting!",
        body: `<p>We noticed you were about to get <strong>"Inglés Relax - 5,000 Words"</strong> but didn't complete your purchase.</p>
        <p>No worries! Your selection is still available at the <strong>special price of $12</strong> (was $54).</p>
        <p>Learn 5,000 English words in a relaxed, stress-free way with pronunciation adapted for Spanish speakers.</p>`,
        ctaText: "Complete my purchase →",
        ctaUrl: HOTMART_CHECKOUT_URL,
        footer: "This special price may not last much longer.",
        color: "#8b5cf6",
      }),
    },
    {
      subject: `${name}, did you know you can learn 5,000 words stress-free? 🧠`,
      html: buildEmail({
        name,
        headline: "Why thousands already learn with us",
        body: `<p>Yesterday you were checking out <strong>"Inglés Relax - 5,000 Words"</strong>. Here's why it's different:</p>
        <ul style="color: #4b5563; line-height: 2;">
          <li>✅ <strong>5,000 words</strong> with Spanish pronunciation guide</li>
          <li>✅ <strong>UK & USA phonetics</strong></li>
          <li>✅ <strong>52 thematic chapters</strong></li>
          <li>✅ <strong>4 FREE bonuses</strong> included</li>
          <li>✅ <strong>Instant download</strong></li>
        </ul>
        <p>All for just <strong>$12</strong> instead of $54. That's 78% off!</p>`,
        ctaText: "Get my book now! 📚",
        ctaUrl: HOTMART_CHECKOUT_URL,
        footer: "Over 1,200 people trust the Relax method.",
        color: "#6366f1",
      }),
    },
    {
      subject: `⏰ ${name}, the special price is ending soon`,
      html: buildEmail({
        name, headline: "Time is running out...",
        body: `<p>It's been a few days since you visited <strong>"Inglés Relax - 5,000 Words"</strong>.</p>
        <p>The special price of <strong>$12</strong> (78% savings) is limited time only.</p>
        <p>Imagine mastering 5,000 English words by learning just <strong>10-15 words per day</strong>, stress-free and at your own pace.</p>`,
        ctaText: "Claim my discount →", ctaUrl: HOTMART_CHECKOUT_URL,
        footer: "Remember: includes 4 free bonuses worth over $40.", color: "#ec4899",
      }),
    },
    {
      subject: `${name}, see what our students say 🌟`,
      html: buildEmail({
        name, headline: "What our students say",
        body: `<p>A week ago you showed interest in our book. Here's what others say:</p>
        <div style="background: #f3f4f6; border-left: 4px solid #8b5cf6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="font-style: italic; color: #4b5563;">"I never thought learning English could be this easy. The Spanish pronunciation guide helped me so much."</p>
          <p style="color: #6b7280; font-size: 14px;">⭐⭐⭐⭐⭐ - María G.</p>
        </div>
        <p>Join <strong>1,200+ students</strong> learning with the Relax method.</p>`,
        ctaText: "Join now for only $12 →", ctaUrl: HOTMART_CHECKOUT_URL,
        footer: "Satisfaction guaranteed.", color: "#8b5cf6",
      }),
    },
    {
      subject: `🚨 ${name}, last chance: 78% off`,
      html: buildEmail({
        name, headline: "Last chance!",
        body: `<p>15 days ago you showed interest in learning English with our Relax method.</p>
        <p>The <strong>78% discount</strong> is still active but not for much longer.</p>
        <p><strong>What you get:</strong></p>
        <ul style="color: #4b5563; line-height: 2;">
          <li>📖 5,000 words with pronunciation</li>
          <li>🎁 4 Free bonuses</li>
          <li>📱 Instant PDF download</li>
          <li>🔄 Free lifetime updates</li>
        </ul>
        <p>All for just <strong>$12</strong> instead of $54.</p>`,
        ctaText: "YES, I WANT MY BOOK! 🎉", ctaUrl: HOTMART_CHECKOUT_URL,
        footer: "This might be your last chance at this price.", color: "#ef4444",
      }),
    },
    {
      subject: `${name}, we're saying goodbye (but with a gift) 🎁`,
      html: buildEmail({
        name, headline: "One last message",
        body: `<p>It's been a month since you visited our page. This will be our last email about <strong>"Inglés Relax - 5,000 Words"</strong>.</p>
        <p>We understand it might not have been the right time, and we respect that.</p>
        <p>But before we say goodbye, here's the link in case you ever decide to take the step. The price of <strong>$12</strong> will still be available for you:</p>
        <p>Learning English doesn't have to be hard or stressful. When you're ready, we'll be here. 💜</p>`,
        ctaText: "Save my purchase link →", ctaUrl: HOTMART_CHECKOUT_URL,
        footer: "Wishing you the best! This is our final email.", color: "#8b5cf6",
      }),
    },
  ];
}

function buildEmail(params: {
  name: string;
  headline: string;
  body: string;
  ctaText: string;
  ctaUrl: string;
  footer: string;
  color: string;
}) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: linear-gradient(135deg, ${params.color} 0%, ${params.color}dd 100%); border-radius: 16px 16px 0 0; padding: 40px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 26px;">${params.headline}</h1>
    </div>
    <div style="background: white; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <p style="font-size: 18px; color: #1f2937; margin-bottom: 24px;">Hola ${params.name}!</p>
      <div style="font-size: 16px; color: #4b5563; line-height: 1.6;">${params.body}</div>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${params.ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, ${params.color} 0%, ${params.color}dd 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 18px; font-weight: bold; box-shadow: 0 4px 14px ${params.color}66;">
          ${params.ctaText}
        </a>
      </div>
      <p style="font-size: 14px; color: #9ca3af; text-align: center; margin-top: 24px;">${params.footer}</p>
    </div>
    <div style="text-align: center; padding: 24px; color: #9ca3af; font-size: 12px;">
      <p style="margin: 0;">© 2024 iLingue Relax. All rights reserved.</p>
      <p style="margin: 8px 0 0 0;">Si no deseas recibir más correos, simplemente ignora este mensaje.</p>
    </div>
  </div>
</body>
</html>`;
}
