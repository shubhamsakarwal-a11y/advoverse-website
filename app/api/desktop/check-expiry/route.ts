import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Desktop app API to check license expiry status
 * Called by Caseline desktop app on startup and periodically
 */
export async function POST(req: NextRequest) {
  try {
    const { licenseKey } = await req.json();

    if (!licenseKey) {
      return NextResponse.json({ error: 'License key required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Get license details
    const { data: license } = await supabase
      .from('licenses')
      .select('*')
      .eq('license_key', licenseKey)
      .single();

    if (!license) {
      return NextResponse.json({ 
        valid: false,
        error: 'License not found' 
      }, { status: 404 });
    }

    const now = new Date();
    const expiryDate = license.expires_at ? new Date(license.expires_at) : null;

    // Check if expired
    if (expiryDate && expiryDate <= now) {
      return NextResponse.json({
        valid: false,
        expired: true,
        expiredAt: expiryDate.toISOString(),
        message: 'License expired',
        showRenewalPrompt: true,
        renewalUrl: 'https://advoverse.com/my-licenses',
      });
    }

    // Check if expiring soon
    const daysUntilExpiry = expiryDate 
      ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    let warningLevel: 'none' | 'info' | 'warning' | 'critical' = 'none';
    let warningMessage = '';

    if (daysUntilExpiry !== null) {
      if (daysUntilExpiry <= 1) {
        warningLevel = 'critical';
        warningMessage = `⚠️ Your license expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}! Renew now to avoid service interruption.`;
      } else if (daysUntilExpiry <= 3) {
        warningLevel = 'warning';
        warningMessage = `⏰ Your license expires in ${daysUntilExpiry} days. Please renew soon.`;
      } else if (daysUntilExpiry <= 7) {
        warningLevel = 'info';
        warningMessage = `Your license expires in ${daysUntilExpiry} days.`;
      }
    }

    return NextResponse.json({
      valid: true,
      expired: false,
      isActive: license.is_active,
      planName: license.plan_name,
      expiresAt: expiryDate?.toISOString() || null,
      daysRemaining: daysUntilExpiry,
      autoRenewalEnabled: license.auto_renewal_enabled || false,
      warning: {
        level: warningLevel,
        message: warningMessage,
        showBanner: warningLevel !== 'none',
        showPopup: warningLevel === 'critical',
      },
      actions: {
        renewUrl: 'https://advoverse.com/my-licenses',
        enableAutoRenewalUrl: 'https://advoverse.com/my-licenses',
      },
    });
  } catch (err) {
    console.error('Desktop expiry check error:', err);
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : 'Failed to check expiry' 
    }, { status: 500 });
  }
}
