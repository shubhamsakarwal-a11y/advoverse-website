import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * API to deny machine transfer request and block the machine
 * Called when user clicks "Deny & Block" button in email
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return new NextResponse(
        `<html><body style="font-family:Arial;padding:40px;text-align:center">
          <h1 style="color:#dc2626">❌ Invalid Request</h1>
          <p>Transfer denial token is missing.</p>
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

    // Update transfer request status
    await supabase
      .from('transfer_requests')
      .update({ 
        status: 'denied',
        processed_at: new Date().toISOString()
      })
      .eq('id', token);

    // Block the new machine permanently
    const { error: blockError } = await supabase
      .from('blocked_machines')
      .insert({
        license_id: transferRequest.license_id,
        machine_id: transferRequest.new_machine_id,
        machine_name: transferRequest.new_machine_name,
        ip_address: transferRequest.new_machine_ip,
        reason: 'Transfer request denied by license owner'
      });

    if (blockError) {
      console.error('Block error:', blockError);
      return new NextResponse(
        `<html><body style="font-family:Arial;padding:40px;text-align:center">
          <h1 style="color:#dc2626">❌ Blocking Failed</h1>
          <p>Failed to block the machine.</p>
        </body></html>`,
        { status: 500, headers: { 'Content-Type': 'text/html' } }
      );
    }

    return new NextResponse(
      `<html>
<head>
  <meta charset="utf-8"/>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 40px; }
    .container { max-width: 500px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 40px; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    h1 { color: #dc2626; margin: 0 0 16px; font-size: 32px; }
    .icon { font-size: 64px; margin-bottom: 20px; }
    p { color: #4b5563; font-size: 16px; line-height: 1.6; }
    .info-box { background: #fee2e2; border: 2px solid #dc2626; border-radius: 12px; padding: 20px; margin: 24px 0; }
    .info-box p { color: #991b1b; margin: 8px 0; font-size: 14px; }
    .info-box strong { color: #7f1d1d; }
    .button { display: inline-block; background: #f59e0b; color: #000; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: bold; margin-top: 20px; }
    .button:hover { background: #d97706; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">🚫</div>
    <h1>Transfer Denied</h1>
    <p>The transfer request has been denied and the machine has been permanently blocked.</p>
    
    <div class="info-box">
      <p><strong>Blocked Machine:</strong> ${transferRequest.new_machine_name}</p>
      ${transferRequest.new_machine_ip ? `<p><strong>IP Address:</strong> ${transferRequest.new_machine_ip}</p>` : ''}
      <p style="margin-top:16px;font-weight:600">🔒 This machine is now permanently blocked</p>
      <p style="font-size:12px">It will never be able to use this license</p>
    </div>

    <p style="font-size:14px;color:#6b7280">Your license remains active on the current machine: <strong>${transferRequest.old_machine_name}</strong></p>

    <a href="https://advoverse.com/my-licenses" class="button">View My Licenses</a>
  </div>
</body>
</html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );

  } catch (err) {
    console.error('Transfer denial error:', err);
    return new NextResponse(
      `<html><body style="font-family:Arial;padding:40px;text-align:center">
        <h1 style="color:#dc2626">❌ Error</h1>
        <p>Failed to process transfer denial.</p>
      </body></html>`,
      { status: 500, headers: { 'Content-Type': 'text/html' } }
    );
  }
}
