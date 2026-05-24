import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Desktop app API to validate license for a specific machine
 * Called by Caseline desktop app on startup and periodically
 */
export async function POST(req: NextRequest) {
  try {
    const { licenseKey, machineId } = await req.json();

    if (!licenseKey || !machineId) {
      return NextResponse.json({ 
        valid: false,
        error: 'License key and machine ID required' 
      }, { status: 400 });
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
        error: 'Invalid license key',
        code: 'INVALID_LICENSE'
      });
    }

    // Check if license is active
    if (!license.is_active) {
      return NextResponse.json({ 
        valid: false,
        error: 'License is inactive',
        code: 'INACTIVE_LICENSE'
      });
    }

    // Check if license is expired
    const now = new Date();
    const expiryDate = license.expires_at ? new Date(license.expires_at) : null;

    if (expiryDate && expiryDate <= now) {
      return NextResponse.json({ 
        valid: false,
        expired: true,
        error: 'License has expired',
        code: 'EXPIRED_LICENSE',
        expiredAt: expiryDate.toISOString(),
        renewUrl: 'https://advoverse.com/my-licenses'
      });
    }

    // Check if machine is blocked
    const { data: blockedMachine } = await supabase
      .from('blocked_machines')
      .select('*')
      .eq('license_id', license.id)
      .eq('machine_id', machineId)
      .single();

    if (blockedMachine) {
      return NextResponse.json({ 
        valid: false,
        error: 'This machine has been permanently blocked',
        code: 'MACHINE_BLOCKED',
        blockedAt: blockedMachine.blocked_at
      });
    }

    // Check if license is activated on this machine
    const { data: activation } = await supabase
      .from('license_activations')
      .select('*')
      .eq('license_id', license.id)
      .eq('machine_id', machineId)
      .eq('is_active', true)
      .single();

    if (!activation) {
      // Check if activated on another machine
      const { data: otherActivation } = await supabase
        .from('license_activations')
        .select('*')
        .eq('license_id', license.id)
        .eq('is_active', true)
        .single();

      if (otherActivation) {
        return NextResponse.json({ 
          valid: false,
          error: 'License is active on another machine',
          code: 'ACTIVE_ON_OTHER_MACHINE',
          activeMachine: otherActivation.machine_name
        });
      }

      return NextResponse.json({ 
        valid: false,
        error: 'License not activated on this machine',
        code: 'NOT_ACTIVATED'
      });
    }

    // Update last validated timestamp
    await supabase
      .from('license_activations')
      .update({ last_validated_at: new Date().toISOString() })
      .eq('id', activation.id);

    // Calculate days remaining
    const daysRemaining = expiryDate 
      ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Determine warning level
    let warningLevel: 'none' | 'info' | 'warning' | 'critical' = 'none';
    let warningMessage = '';

    if (daysRemaining !== null) {
      if (daysRemaining <= 1) {
        warningLevel = 'critical';
        warningMessage = `⚠️ Your license expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}! Renew now.`;
      } else if (daysRemaining <= 3) {
        warningLevel = 'warning';
        warningMessage = `⏰ Your license expires in ${daysRemaining} days. Please renew soon.`;
      } else if (daysRemaining <= 7) {
        warningLevel = 'info';
        warningMessage = `Your license expires in ${daysRemaining} days.`;
      }
    }

    return NextResponse.json({ 
      valid: true,
      license: {
        key: license.license_key,
        planName: license.plan_name,
        isActive: license.is_active,
        expiresAt: expiryDate?.toISOString() || null,
        daysRemaining,
        autoRenewalEnabled: license.auto_renewal_enabled || false
      },
      machine: {
        machineId: activation.machine_id,
        machineName: activation.machine_name,
        activatedAt: activation.activated_at,
        lastValidated: activation.last_validated_at
      },
      warning: {
        level: warningLevel,
        message: warningMessage,
        showBanner: warningLevel !== 'none',
        showPopup: warningLevel === 'critical'
      },
      actions: {
        renewUrl: 'https://advoverse.com/my-licenses',
        enableAutoRenewalUrl: 'https://advoverse.com/my-licenses',
        deactivateUrl: 'https://advoverse.com/my-licenses'
      }
    });

  } catch (err) {
    console.error('Validation error:', err);
    return NextResponse.json({ 
      valid: false,
      error: err instanceof Error ? err.message : 'Validation failed' 
    }, { status: 500 });
  }
}
