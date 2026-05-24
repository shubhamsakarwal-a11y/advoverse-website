import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * API to approve machine transfer request
 * Called when user clicks "Approve" button in email
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return new NextResponse(
        `<html><body style="font-family:Arial;padding:40px;text-align:center">
          <h1 style="color:#dc2626">❌ Invalid Request</h1>
          <p>Transfer approval token is missing.</p>
        </body></html>`,
        { status: 400, headers: { 'Content-Type': 'text/html' } }
      );
    }

    const supabase = createAdminClient();

    // Get transfer request
    const { data: transferRequest } = await supabase
      .from('transfer_requests')
      .select('*')
      .eq('id', token)
      .single();

    if (!transferRequest) {
      return new NextResponse(
        `<html><body style="font-family:Arial;padding:40px;text-align:center">
          <h1 style="color:#dc2626">❌ Invalid Token</h1>
          <p>Transfer request not found.</p>
        </body></html>`,
        { status: 404, headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Check if already processed
    if (transferRequest.status !== 'pending') {
      const statusText = transferRequest.status === 'approved' ? 'approved' : 'denied';
      return new NextResponse(
        `<html><body style="font-family:Arial;padding:40px;text-align:center">
          <h1 style="color:#f59e0b">⚠️ Already Processed</h1>
          <p>This transfer request was already ${statusText}.</p>
          <p style="color:#6b7280;font-size:14px">Processed at: ${new Date(transferRequest.processed_at!).toLocaleString()}</p>
        </body></html>`,
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Deactivate old machine
    await supabase
      .from('license_activations')
      .update({ 
        is_active: false,
        deactivated_at: new Date().toISOString()
      })
      .eq('license_id', transferRequest.license_id)
      .eq('machine_id', transferRequest.old_machine_id);

    // Activate new machine
    const { error: activationError } = await supabase
      .from('license_activations')
      .insert({
        license_id: transferRequest.license_id,
        user_id: transferRequest.user_id,
        machine_id: transferRequest.new_machine_id,
        machine_name: transferRequest.new_machine_name,
        ip_address: transferRequest.new_machine_ip,
        is_active: true
      });

    if (activationError) {
      console.error('Activation error:', activationError);
      return new NextResponse(
        `<html><body style="font-family:Arial;padding:40px;text-align:center">
          <h1 style="color:#dc2626">❌ Activation Failed</h1>
          <p>Failed to activate license on new machine.</p>
        </body></html>`,
        { status: 500, headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Update transfer request status
    await supabase
      .from('transfer_requests')
      .update({ 
        status: 'approved',
        processed_at: new Date().toISOString()
      })
      .eq('id', token);

    // Add transfer cooldown (24 hours)
    const cooldownUntil = new Date();
    cooldownUntil.setHours(cooldownUntil.getHours() + 24);

    await supabase
      .from('transfer_cooldowns')
      .insert({
        license_id: transferRequest.license_id,
        cooldown_until: cooldownUntil.toISOString()
      });

    return new NextResponse(
      `<html>
<head>
  <meta charset="utf-8"/>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 40px; }
    .container { max-width: 500px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 40px; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    h1 { color: #16a34a; margin: 0 0 16px; font-size: 32px; }
    .icon { font-size: 64px; margin-bottom: 20px; }
    p { color: #4b5563; font-size: 16px; line-height: 1.6; }
    .info-box { background: #dcfce7; border: 2px solid #16a34a; border-radius: 12px; padding: 20px; margin: 24px 0; }
    .info-box p { color: #166534; margin: 8px 0; font-size: 14px; }
    .info-box strong { color: #14532d; }
    .button { display: inline-block; background: #f59e0b; color: #000; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: bold; margin-top: 20px; }
    .button:hover { background: #d97706; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">✅</div>
    <h1>Transfer Approved!</h1>
    <p>Your license has been successfully transferred to the new machine.</p>
    
    <div class="info-box">
      <p><strong>Old Machine:</strong> ${transferRequest.old_machine_name}</p>
      <p><strong>New Machine:</strong> ${transferRequest.new_machine_name}</p>
      <p style="margin-top:16px;font-weight:600">⏰ Transfer Cooldown: 24 hours</p>
      <p style="font-size:12px">You can transfer again after ${cooldownUntil.toLocaleString()}</p>
    </div>

    <p style="font-size:14px;color:#6b7280">The old machine has been deactivated. You can now use your license on the new machine.</p>

    <a href="https://advoverse.com/my-licenses" class="button">View My Licenses</a>
  </div>
</body>
</html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );

  } catch (err) {
    console.error('Transfer approval error:', err);
    return new NextResponse(
      `<html><body style="font-family:Arial;padding:40px;text-align:center">
        <h1 style="color:#dc2626">❌ Error</h1>
        <p>Failed to process transfer approval.</p>
      </body></html>`,
      { status: 500, headers: { 'Content-Type': 'text/html' } }
    );
  }
}
