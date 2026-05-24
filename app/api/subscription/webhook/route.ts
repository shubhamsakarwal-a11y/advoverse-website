import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';

// Retry schedule: 30min, 1hr, 2hr, 4hr, 24hr
const RETRY_DELAYS = [30 * 60 * 1000, 60 * 60 * 1000, 2 * 60 * 60 * 1000, 4 * 60 * 60 * 1000, 24 * 60 * 60 * 1000];

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);
    const supabase = createAdminClient();

    // Handle different webhook events
    switch (event.event) {
      case 'subscription.charged': {
        // Successful renewal payment
        const subscription = event.payload.subscription.entity;
        const payment = event.payload.payment.entity;
        const licenseId = parseInt(subscription.notes.license_id);

        // Get license
        const { data: license } = await supabase
          .from('licenses')
          .select('*, profiles!licenses_user_id_fkey(name)')
          .eq('id', licenseId)
          .single();

        if (!license) break;

        // Calculate new expiry date based on duration
        const duration = subscription.notes.duration || 'monthly';
        const currentExpiry = license.expires_at ? new Date(license.expires_at) : new Date();
        const newExpiry = new Date(currentExpiry);

        switch (duration) {
          case 'monthly':
            newExpiry.setDate(newExpiry.getDate() + 30);
            break;
          case 'quarterly':
            newExpiry.setDate(newExpiry.getDate() + 90);
            break;
          case 'yearly':
            newExpiry.setDate(newExpiry.getDate() + 365);
            break;
        }

        // Update license expiry
        await supabase
          .from('licenses')
          .update({
            expires_at: newExpiry.toISOString(),
            renewal_failure_count: 0,
            last_renewal_attempt: new Date().toISOString(),
            grace_period_until: null,
          })
          .eq('id', licenseId);

        // Record successful renewal
        await supabase.from('renewal_history').insert({
          license_id: licenseId,
          attempted_at: new Date().toISOString(),
          success: true,
          amount: payment.amount,
          razorpay_payment_id: payment.id,
          razorpay_subscription_id: subscription.id,
          new_expiry_date: newExpiry.toISOString(),
          retry_attempt: 0,
        });

        // TODO: Send success email to user
        console.log(`✅ License ${licenseId} renewed successfully until ${newExpiry.toISOString()}`);
        break;
      }

      case 'subscription.payment_failed': {
        // Failed renewal payment
        const subscription = event.payload.subscription.entity;
        const payment = event.payload.payment.entity;
        const licenseId = parseInt(subscription.notes.license_id);

        // Get license
        const { data: license } = await supabase
          .from('licenses')
          .select('*')
          .eq('id', licenseId)
          .single();

        if (!license) break;

        const failureCount = (license.renewal_failure_count || 0) + 1;

        // Record failed attempt
        await supabase.from('renewal_history').insert({
          license_id: licenseId,
          attempted_at: new Date().toISOString(),
          success: false,
          amount: payment.amount,
          razorpay_payment_id: payment.id,
          razorpay_subscription_id: subscription.id,
          failure_reason: payment.error_description || 'Payment failed',
          retry_attempt: failureCount,
        });

        if (failureCount >= 5) {
          // All retries exhausted - set grace period
          const gracePeriodEnd = new Date();
          gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 3); // 3-day grace period

          await supabase
            .from('licenses')
            .update({
              renewal_failure_count: failureCount,
              last_renewal_attempt: new Date().toISOString(),
              grace_period_until: gracePeriodEnd.toISOString(),
            })
            .eq('id', licenseId);

          // TODO: Send final warning email
          console.log(`❌ License ${licenseId} - All retries exhausted. Grace period until ${gracePeriodEnd.toISOString()}`);
        } else {
          // Schedule retry
          await supabase
            .from('licenses')
            .update({
              renewal_failure_count: failureCount,
              last_renewal_attempt: new Date().toISOString(),
            })
            .eq('id', licenseId);

          // TODO: Send retry notification email
          console.log(`⚠️ License ${licenseId} - Payment failed. Retry ${failureCount}/5`);
        }
        break;
      }

      case 'subscription.cancelled': {
        // Subscription cancelled
        const subscription = event.payload.subscription.entity;
        const licenseId = parseInt(subscription.notes.license_id);

        await supabase
          .from('licenses')
          .update({
            auto_renewal_enabled: false,
            razorpay_subscription_id: null,
          })
          .eq('id', licenseId);

        console.log(`🔴 License ${licenseId} - Subscription cancelled`);
        break;
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : 'Webhook processing failed' 
    }, { status: 500 });
  }
}
