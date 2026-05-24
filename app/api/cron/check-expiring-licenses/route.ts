import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { 
  getExpiryWarning7Days, 
  getExpiryWarning1Day, 
  getLicenseExpired 
} from '@/lib/email-templates';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Cron job to check for expiring licenses and send notifications
 * Should be called daily (e.g., via Vercel Cron or external scheduler)
 * 
 * Setup in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/check-expiring-licenses",
 *     "schedule": "0 9 * * *"
 *   }]
 * }
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret (optional but recommended)
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const now = new Date();
    
    // Calculate date ranges
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    const oneDayFromNow = new Date(now);
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);

    const results = {
      sevenDayWarnings: 0,
      oneDayWarnings: 0,
      expiredNotifications: 0,
      errors: [] as string[],
    };

    // Get all active licenses
    const { data: licenses } = await supabase
      .from('licenses')
      .select(`
        *,
        profiles!licenses_user_id_fkey (
          id,
          name
        )
      `)
      .eq('is_active', true)
      .not('expires_at', 'is', null);

    if (!licenses) {
      return NextResponse.json({ message: 'No licenses found' });
    }

    // Get user emails
    const { data: users } = await supabase.auth.admin.listUsers();

    for (const license of licenses) {
      const expiryDate = new Date(license.expires_at!);
      const user = users?.users.find(u => u.id === license.user_id);
      
      if (!user?.email) continue;

      const userName = license.profiles?.name || user.email.split('@')[0];
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      try {
        // Check if license expired today
        if (daysUntilExpiry === 0 && expiryDate.toDateString() === now.toDateString()) {
          const template = getLicenseExpired({
            userName,
            planName: license.plan_name,
            licenseKey: license.license_key,
            expiredDate: expiryDate,
          });

          await resend.emails.send({
            from: process.env.EMAIL_FROM || 'Advoverse <support@advoverse.in>',
            to: user.email,
            subject: template.subject,
            html: template.html,
          });

          results.expiredNotifications++;
          console.log(`✅ Sent expiry notification to ${user.email}`);
        }
        // Check if expires in 1 day
        else if (daysUntilExpiry === 1) {
          const template = getExpiryWarning1Day({
            userName,
            planName: license.plan_name,
            licenseKey: license.license_key,
            expiryDate,
          });

          await resend.emails.send({
            from: process.env.EMAIL_FROM || 'Advoverse <support@advoverse.in>',
            to: user.email,
            subject: template.subject,
            html: template.html,
          });

          results.oneDayWarnings++;
          console.log(`✅ Sent 1-day warning to ${user.email}`);
        }
        // Check if expires in 7 days
        else if (daysUntilExpiry === 7) {
          const template = getExpiryWarning7Days({
            userName,
            planName: license.plan_name,
            licenseKey: license.license_key,
            expiryDate,
          });

          await resend.emails.send({
            from: process.env.EMAIL_FROM || 'Advoverse <support@advoverse.in>',
            to: user.email,
            subject: template.subject,
            html: template.html,
          });

          results.sevenDayWarnings++;
          console.log(`✅ Sent 7-day warning to ${user.email}`);
        }
      } catch (err) {
        const errorMsg = `Failed to send email to ${user.email}: ${err instanceof Error ? err.message : 'Unknown error'}`;
        results.errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      results,
    });
  } catch (err) {
    console.error('Cron job error:', err);
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : 'Cron job failed' 
    }, { status: 500 });
  }
}
