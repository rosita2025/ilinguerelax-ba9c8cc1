import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PurchaseEmailRequest {
  customerEmail: string;
  customerName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { customerEmail, customerName }: PurchaseEmailRequest = await req.json();

    const downloadUrl = "https://drive.google.com/file/d/1KA1IQ-WEB7a_dw3BKVWaU0pImfGsdV3i/view?usp=sharing";
    const name = customerName || "Valued Customer";

    // Send email to customer with download link
    const customerEmailResponse = await resend.emails.send({
      from: "iLingue Relax <hola@ilinguerelax.com>",
      to: [customerEmail],
      subject: "🎉 Thank You for Your Purchase! Here's Your Digital Download",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); border-radius: 16px 16px 0 0; padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Thank You for Your Purchase! 🎉</h1>
            </div>
            
            <div style="background: white; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <p style="font-size: 18px; color: #1f2937; margin-bottom: 24px;">
                Hello ${name}!
              </p>
              
              <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-bottom: 24px;">
                Welcome to the <strong>Spanish Relax</strong> family! We're thrilled you've chosen to learn Spanish with us.
              </p>
              
              <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-bottom: 24px;">
                Your digital PDF is ready for immediate download. Start learning Spanish right away while your physical book is on its way!
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${downloadUrl}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 18px; font-weight: bold; box-shadow: 0 4px 14px rgba(139, 92, 246, 0.4);">
                  📚 Download Your PDF Now
                </a>
              </div>
              
              <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin: 32px 0;">
                <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 16px;">📦 Physical Book Shipping</h3>
                <p style="color: #6b7280; margin: 0; font-size: 14px; line-height: 1.6;">
                  Your physical book will be shipped to your address soon. You'll receive a separate email with tracking information once it's on its way.
                </p>
              </div>
              
              <div style="background: #fef3c7; border-radius: 12px; padding: 24px; margin: 32px 0;">
                <h3 style="color: #92400e; margin: 0 0 16px 0; font-size: 16px;">💡 Pro Tip</h3>
                <p style="color: #78350f; margin: 0; font-size: 14px; line-height: 1.6;">
                  Start with just 10-15 words per day. Consistency is key! The stress-free method works best when you learn at your own pace.
                </p>
              </div>
              
              <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-bottom: 8px;">
                If you have any questions, just reply to this email or contact us at <a href="mailto:hola@ilinguerelax.com" style="color: #8b5cf6;">hola@ilinguerelax.com</a>
              </p>
              
              <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-top: 32px;">
                ¡Buena suerte! (Good luck!)<br>
                <strong style="color: #8b5cf6;">The iLingue Relax Team</strong>
              </p>
            </div>
            
            <div style="text-align: center; padding: 24px; color: #9ca3af; font-size: 12px;">
              <p style="margin: 0;">© 2024 iLingue Relax. All rights reserved.</p>
              <p style="margin: 8px 0 0 0;">Learn Spanish the stress-free way.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Customer email sent successfully:", customerEmailResponse);

    // Send notification email to the business
    const notificationEmailResponse = await resend.emails.send({
      from: "iLingue Relax <hola@ilinguerelax.com>",
      to: ["hola@ilinguerelax.com"],
      subject: `🛒 New Purchase! Spanish Relax - ${customerEmail}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #8b5cf6;">🎉 New Purchase Alert!</h2>
          <p><strong>Product:</strong> Spanish Relax v1.0 - 5,000 Words</p>
          <p><strong>Customer Email:</strong> ${customerEmail}</p>
          <p><strong>Customer Name:</strong> ${name}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280;">The customer has received their digital download link automatically.</p>
        </body>
        </html>
      `,
    });

    console.log("Notification email sent successfully:", notificationEmailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        customerEmail: customerEmailResponse,
        notificationEmail: notificationEmailResponse 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error sending purchase email:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
