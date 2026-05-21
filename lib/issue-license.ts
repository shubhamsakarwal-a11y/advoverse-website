/**
 * Shared helper: mark order as paid, generate license,
 * save to Supabase, send emails.
 * Called by both the Razorpay verify route and Stripe webhook.
 */
import { createAdminClient } from './supabase/server';
import { generateLicenseKey, getLicenseExpiry } from './license';
import { sendLicenseEmail, sendAdminNotification } from './email';

export async function issueLicense(params: {
  userId: string;
  userEmail: string;
  userName: string;
  orderId: number;
  planName: string;
  amount: number;       // in paise
  paymentId: string;
  gateway: string;
}): Promise<string> {
  const { userId, userEmail, userName, orderId, planName, amount, paymentId, gateway } = params;
  const supabase = createAdminClient();

  // Idempotency check — don't re-issue if already done
  const { data: existingLicense } = await supabase
    .from('licenses')
    .select('license_key')
    .eq('order_id', orderId)
    .single();

  if (existingLicense) {
    return existingLicense.license_key as string;
  }

  // Generate key
  const licenseKey = generateLicenseKey();
  const expiresAt = getLicenseExpiry(planName);

  // Update order to paid
  await supabase
    .from('orders')
    .update({ status: 'paid', payment_id: paymentId, updated_at: new Date().toISOString() })
    .eq('id', orderId);

  // Save license
  await supabase.from('licenses').insert({
    user_id: userId,
    order_id: orderId,
    license_key: licenseKey,
    plan_name: planName,
    expires_at: expiresAt?.toISOString() ?? null,
    is_active: true,
    email_sent: false,
  });

  // Send license email to user
  try {
    await sendLicenseEmail({ to: userEmail, userName, planName, licenseKey, expiresAt });
    await supabase
      .from('licenses')
      .update({ email_sent: true })
      .eq('license_key', licenseKey);
  } catch (e) {
    console.error('License email failed (non-fatal):', e);
  }

  // Notify admin
  try {
    await sendAdminNotification({ userName, userEmail, planName, amount, gateway, licenseKey });
  } catch (e) {
    console.error('Admin notification failed (non-fatal):', e);
  }

  return licenseKey;
}
