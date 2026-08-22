import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { resend } from "../_shared/brevo.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

// Escape user-controlled text before interpolating into HTML emails
// (prevents HTML/formatting injection into the admin inbox).
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, subject, message }: ContactEmailRequest = await req.json();

    // Validate inputs
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: "Nombre, email y mensaje son requeridos" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Length limits + basic email shape (defense in depth; client also validates)
    if (
      typeof name !== "string" || name.length > 100 ||
      typeof email !== "string" || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      (subject && (typeof subject !== "string" || subject.length > 200)) ||
      typeof message !== "string" || message.length > 2000
    ) {
      return new Response(
        JSON.stringify({ error: "Entrada inválida" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Save contact
    try {
      await supabaseAdmin.from("email_contacts").insert({
        email: email.toLowerCase(),
        name,
        source: "contact_form",
        metadata: { subject: subject || null, message: message.slice(0, 500) },
      });
    } catch (e) {
      console.log("Contact already saved or insert skipped:", e);
    }

    // Send notification email to admin
    const adminEmailResponse = await resend.emails.send({
      from: "iLingue Relax <hola@ilinguerelax.com>",
      to: ["hola@ilinguerelax.com"],
      subject: subject ? `[Contacto] ${subject}` : `[Contacto] Nuevo mensaje de ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Nuevo mensaje de contacto</h2>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Nombre:</strong> ${escapeHtml(name)}</p>
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
            ${subject ? `<p><strong>Asunto:</strong> ${escapeHtml(subject)}</p>` : ''}
            <p><strong>Mensaje:</strong></p>
            <p style="white-space: pre-wrap;">${escapeHtml(message)}</p>
          </div>
          <p style="color: #6b7280; font-size: 12px;">
            Este mensaje fue enviado desde el formulario de contacto de ilinguerelax.com
          </p>
        </div>
      `,
    });

    console.log("Admin notification sent:", adminEmailResponse);

    // Send confirmation email to user
    const userEmailResponse = await resend.emails.send({
      from: "iLingue Relax <hola@ilinguerelax.com>",
      to: [email],
      subject: "¡Recibimos tu mensaje! - iLingue Relax",
      html: `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                  
                  <!-- Header with gradient -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 40px 30px; border-radius: 16px 16px 0 0; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                        🌍 iLingue Relax
                      </h1>
                      <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                        Aprende idiomas de forma relajada
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Main content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="margin: 0 0 20px; color: #1e293b; font-size: 24px; font-weight: 600;">
                        ¡Hola ${escapeHtml(name)}! 👋
                      </h2>
                      
                      <p style="margin: 0 0 25px; color: #475569; font-size: 16px; line-height: 1.6;">
                        Hemos recibido tu mensaje y queremos que sepas que <strong>es importante para nosotros</strong>. Nuestro equipo lo revisará y te responderá lo antes posible.
                      </p>
                      
                      <!-- Message box -->
                      <div style="background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); padding: 25px; border-radius: 12px; border-left: 4px solid #3b82f6; margin: 25px 0;">
                        <p style="margin: 0 0 10px; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
                          📝 Tu mensaje:
                        </p>
                        <p style="margin: 0; color: #334155; font-size: 15px; line-height: 1.7; white-space: pre-wrap; font-style: italic;">
                          "${escapeHtml(message)}"
                        </p>
                      </div>
                      
                      <!-- Response time -->
                      <div style="background: #eff6ff; padding: 20px; border-radius: 12px; text-align: center; margin: 25px 0;">
                        <p style="margin: 0; color: #1e40af; font-size: 14px;">
                          ⏱️ <strong>Tiempo de respuesta estimado:</strong> 24-48 horas
                        </p>
                      </div>
                      
                      <!-- CTA -->
                      <div style="text-align: center; margin: 30px 0;">
                        <a href="https://ilinguerelax.com" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.4);">
                          Visitar nuestra web →
                        </a>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background: #f8fafc; padding: 30px; border-radius: 0 0 16px 16px; border-top: 1px solid #e2e8f0;">
                      <table role="presentation" style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td style="text-align: center;">
                            <p style="margin: 0 0 15px; color: #1e293b; font-size: 16px; font-weight: 600;">
                              ¡Gracias por contactarnos!
                            </p>
                            <p style="margin: 0 0 20px; color: #64748b; font-size: 14px;">
                              El equipo de iLingue Relax 💙
                            </p>
                            
                            <!-- Social links placeholder -->
                            <div style="margin: 20px 0;">
                              <a href="https://ilinguerelax.com" style="display: inline-block; margin: 0 8px; color: #3b82f6; text-decoration: none; font-size: 13px;">
                                🌐 Web
                              </a>
                              <span style="color: #cbd5e1;">|</span>
                              <a href="mailto:hola@ilinguerelax.com" style="display: inline-block; margin: 0 8px; color: #3b82f6; text-decoration: none; font-size: 13px;">
                                ✉️ Email
                              </a>
                            </div>
                            
                            <p style="margin: 20px 0 0; color: #94a3b8; font-size: 11px; line-height: 1.5;">
                              Este es un correo automático de confirmación.<br>
                              © ${new Date().getFullYear()} iLingue Relax. Todos los derechos reservados.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log("User confirmation sent:", userEmailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Emails enviados correctamente" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
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
