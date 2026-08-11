import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Global 24h throttle check for all marketing/automated emails.
 * Prevents credit waste and customer saturation.
 * 
 * Sources checked:
 * - newsletter_drip_sends
 * - marketing_drip_sends
 * - review_invitations (last_email_sent_at)
 * - brevo_sync_logs (event_type=tienda_abandoned/hotmart_abandoned)
 */
export async function checkGlobalEmailThrottle(
  supabase: SupabaseClient,
  email: string
): Promise<{ throttled: boolean; reason?: string }> {
  const norm = email.trim().toLowerCase();
  const window24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // 1. Check newsletter drips
  const { count: newsletterCount } = await supabase
    .from('newsletter_drip_sends')
    .select('id', { count: 'exact', head: true })
    .eq('email', norm)
    .eq('status', 'sent')
    .gte('sent_at', window24h);
  
  if ((newsletterCount || 0) > 0) return { throttled: true, reason: 'newsletter_sent_24h' };

  // 2. Check marketing drips (post-purchase)
  const { count: marketingCount } = await supabase
    .from('marketing_drip_sends')
    .select('id', { count: 'exact', head: true })
    .eq('email', norm)
    .eq('status', 'sent')
    .gte('sent_at', window24h);

  if ((marketingCount || 0) > 0) return { throttled: true, reason: 'marketing_sent_24h' };

  // 3. Check review invitations
  const { count: reviewCount } = await supabase
    .from('review_invitations')
    .select('id', { count: 'exact', head: true })
    .eq('customer_email', norm)
    .gte('last_email_sent_at', window24h);

  if ((reviewCount || 0) > 0) return { throttled: true, reason: 'review_sent_24h' };

  // 4. Check abandoned cart logs (Brevo syncs)
  const { count: abandonedCount } = await supabase
    .from('brevo_sync_logs')
    .select('id', { count: 'exact', head: true })
    .eq('email', norm)
    .in('event_type', ['hotmart_abandoned', 'tienda_abandoned'])
    .eq('status', 'success')
    .gte('created_at', window24h);

  if ((abandonedCount || 0) > 0) return { throttled: true, reason: 'abandoned_sent_24h' };

  return { throttled: false };
}
