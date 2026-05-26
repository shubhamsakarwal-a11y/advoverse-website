import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { Resend } from 'resend';



/**
 * Desktop app API to activate license on a machine
 * Called by Caseline desktop app when user enters license key
 */
export async function POST(req: NextRequest) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { licenseKey, machineId, machineName, ipAddress } = await req.json();

    if (!licenseKey || !machineId) {
      return NextResponse.json({ 
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
        success: false,
        error: 'Invalid license key',
        code: 'INVALID_LICENSE'
      }, { status: 404 });
    }

    // Check if license is active
    if (!license.is_active) {
      return NextResponse.json({ 
        success: false,
        error: 'License is inactive',
        code: 'INACTIVE_LICENSE'
      }, { status: 403 });
    }

    // Check if license is expired
    if (license.expires_at) {
      const expiryDate = new Date(license.expires_at);
      if (expiryDate <= new Date()) {
        return NextResponse.json({ 
          success: false,
          error: 'License has expired',
          code: 'EXPIRED_LICENSE',
          expiredAt: expiryDate.toISOString(),
          renewUrl: 'https://advoverse.com/my-licenses'
        }, { status: 403 });
      }
    }

    // Check if machine is permanently blocked
    const { data: blockedMachine } = await supabase
      .from('blocked_machines')
      .select('*')
      .eq('license_id', license.id)
      .eq('machine_id', machineId)
      .single();

    if (blockedMachine) {
      return NextResponse.json({ 
        success: false,
        error: 'This machine has been permanently blocked by the license owner',
        code: 'MACHINE_BLOCKED',
        blockedAt: blockedMachine.blocked_at,
        reason: blockedMachine.reason
      }, { status: 403 });
    }

    // Check if license is already activated on this machine
    const { data: existingActivation } = await supabase
      .from('license_activations')
      .select('*')
      .eq('license_id', license.id)
      .eq('machine_id', machineId)
      .eq('is_active', true)
      .single();

    if (existingActivation) {
      // Already activated on this machine - success
      return NextResponse.json({ 
        success: true,
        message: 'License already activated on this machine',
        activation: {
          activatedAt: existingActivation.activated_at,
          machineName: existingActivation.machine_name,
          expiresAt: license.expires_at
        }
      });
    }

    // Check if license is activated on a different machine
    const { data: otherActivation } = await supabase
      .from('license_activations')
      .select('*')
      .eq('license_id', license.id)
      .eq('is_active', true)
      .neq('machine_id', machineId)
      .single();

    if (otherActivation) {
      // License is active on another machine - need transfer approval

      // Check transfer cooldown
      const { data: recentTransfer } = await supabase
        .from('transfer_cooldowns')
        .select('*')
        .eq('license_id', license.id)
        .gte('cooldown_until', new Date().toISOString())
        .single();

      if (recentTransfer) {
        return NextResponse.json({ 
          success: false,
          error: 'Transfer cooldown active. You can only transfer once every 24 hours.',
          code: 'TRANSFER_COOLDOWN',
          cooldownUntil: recentTransfer.cooldown_until,
          currentMachine: otherActivation.machine_name
        }, { status: 429 });
      }

      // Check if there's already a pending transfer request
      const { data: pendingRequest } = await supabase
        .from('transfer_requests')
        .select('*')
        .eq('license_id', license.id)
        .eq('new_machine_id', machineId)
        .eq('status', 'pending')
        .single();

      if (pendingRequest) {
        return NextResponse.json({ 
          success: false,
          error: 'Transfer request already pending. Check your email for approval link.',
          code: 'TRANSFER_PENDING',
          requestedAt: pendingRequest.requested_at,
          currentMachine: otherActivation.machine_name
        }, { status: 202 });
      }

      // Create transfer request
      const { data: transferRequest, error: transferError } = await supabase
        .from('transfer_requests')
        .insert({
          license_id: license.id,
          user_id: license.user_id,
          old_machine_id: otherActivation.machine_id,
          old_machine_name: otherActivation.machine_name,
          new_machine_id: machineId,
          new_machine_name: machineName || 'Unknown Machine',
          new_machine_ip: ipAddress,
          status: 'pending'
        })
        .select()
        .single();

      if (transferError || !transferRequest) {
        console.error('Transfer request creation error:', transferError);
        return NextResponse.json({ 
          error: 'Failed to create transfer request' 
        }, { status: 500 });
      }

      // Get user email
      const { data: { user } } = await supabase.auth.admin.getUserById(license.user_id);

      if (user?.email) {
        // Send transfer approval email
        const approveUrl = `https://advoverse.com/api/transfer/approve?token=${transferRequest.id}`;
        const denyUrl = `https://advoverse.com/api/transfer/deny?token=${transferRequest.id}`;

        await resend.emails.send({
          from: process.env.EMAIL_FROM || 'Advoverse <support@advoverse.in>',
          to: user.email,
          subject: '🔐 New Machine Detected - Approve Transfer?',
          html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="background:#f4f4f4;font-family:Arial,sans-serif;margin:0;padding:20px">
  <div style="max-width:580px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden">
    <div style="background:#f59e0b;padding:36px 40px">
      <h1 style="color:#78350f;margin:0 0 4px;letter-spacing:2px;font-size:26px">🔐 NEW MACHINE DETECTED</h1>
      <p style="color:#92400e;margin:0;font-size:13px">Action Required</p>
    </div>
    <div style="padding:40px">
      <h2 style="color:#111827;margin-top:0">Hi ${user.email.split('@')[0]},</h2>
      <p style="color:#4b5563;font-size:16px">Someone is trying to use your <strong>${license.plan_name}</strong> license on a new machine.</p>
      
      <div style="background:#fef3c7;border:2px solid #f59e0b;border-radius:12px;padding:24px;margin:24px 0">
        <div style="margin-bottom:16px">
          <p style="color:#92400e;font-size:13px;margin:0 0 4px">Current Machine:</p>
          <p style="color:#78350f;font-size:16px;font-weight:bold;margin:0">${otherActivation.machine_name}</p>
        </div>
        <div>
          <p style="color:#92400e;font-size:13px;margin:0 0 4px">New Machine:</p>
          <p style="color:#78350f;font-size:16px;font-weight:bold;margin:0">${machineName || 'Unknown Machine'}</p>
          ${ipAddress ? `<p style="color:#92400e;font-size:12px;margin:4px 0 0">IP: ${ipAddress}</p>` : ''}
        </div>
      </div>

      <p style="color:#dc2626;font-size:15px;font-weight:600;margin:24px 0">
        ⚠️ If you approve, your license will be deactivated on the current machine and activated on the new machine.
      </p>

      <div style="text-align:center;margin:32px 0">
        <a href="${approveUrl}" style="display:inline-block;background:#16a34a;color:#fff;padding:16px 32px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:16px;margin-right:12px">
          ✅ Approve Transfer
        </a>
        <a href="${denyUrl}" style="display:inline-block;background:#dc2626;color:#fff;padding:16px 32px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:16px">
          ❌ Deny & Block
        </a>
      </div>

      <div style="background:#fee2e2;border-left:4px solid #dc2626;padding:16px;margin:24px 0">
        <p style="color:#991b1b;font-size:13px;margin:0;font-weight:600">🚫 If you deny this request:</p>
        <p style="color:#991b1b;font-size:13px;margin:8px 0 0">The new machine will be permanently blocked from using this license.</p>
      </div>

      <p style="color:#6b7280;font-size:13px;margin-top:24px">
        License Key: <code style="background:#f3f4f6;padding:4px 8px;border-radius:4px;font-family:monospace">${license.license_key}</code>
      </p>

      <p style="color:#9ca3af;font-size:12px;margin-top:24px">
        If you didn't initiate this transfer, click "Deny & Block" to protect your license.
      </p>
    </div>
    <div style="background:#f9fafb;padding:20px 40px;text-align:center;color:#9ca3af;font-size:12px">
      <p>Need help? Email us at <a href="mailto:support@advoverse.com" style="color:#f59e0b">support@advoverse.com</a></p>
      <p>© 2026 Advoverse. All Rights Reserved.</p>
    </div>
  </div>
</body>
</html>`,
        });
      }

      return NextResponse.json({ 
        success: false,
        error: 'License is active on another machine. Transfer approval required.',
        code: 'TRANSFER_REQUIRED',
        currentMachine: otherActivation.machine_name,
        message: 'An email has been sent to the license owner for approval.',
        transferRequestId: transferRequest.id
      }, { status: 202 });
    }

    // No existing activation - activate on this machine
    const { data: newActivation, error: activationError } = await supabase
      .from('license_activations')
      .insert({
        license_id: license.id,
        user_id: license.user_id,
        machine_id: machineId,
        machine_name: machineName || 'Unknown Machine',
        ip_address: ipAddress,
        is_active: true
      })
      .select()
      .single();

    if (activationError || !newActivation) {
      console.error('Activation error:', activationError);
      return NextResponse.json({ 
        error: 'Failed to activate license' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'License activated successfully',
      activation: {
        activatedAt: newActivation.activated_at,
        machineName: newActivation.machine_name,
        expiresAt: license.expires_at,
        planName: license.plan_name
      }
    });

  } catch (err) {
    console.error('Activation error:', err);
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : 'Activation failed' 
    }, { status: 500 });
  }
}
