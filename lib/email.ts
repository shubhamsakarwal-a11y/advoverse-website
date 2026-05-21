import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || 'Advoverse <support@advoverse.in>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';

interface LicenseEmailParams {
  to: string;
  userName: string;
  planName: string;
  licenseKey: string;
  expiresAt: Date | null;
}

export async function sendLicenseEmail(params: LicenseEmailParams) {
  const { to, userName, planName, licenseKey, expiresAt } = params;
  const validityLine = expiresAt
    ? `Valid until: <strong>${expiresAt.toDateString()}</strong>`
    : `Validity: <strong>Lifetime</strong>`;

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your Advoverse License Key — ${planName}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="background:#f4f4f4;font-family:Arial,sans-serif;margin:0;padding:20px">
  <div style="max-width:580px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden">
    <div style="background:#0f1720;padding:36px 40px">
      <h1 style="color:#fff;margin:0 0 4px;letter-spacing:3px;font-size:26px">ADVOVERSE</h1>
      <p style="color:#9ca3af;margin:0;font-size:13px">Digital Chamber Management System</p>
    </div>
    <div style="padding:40px">
      <h2 style="color:#111827;margin-top:0">🎉 Your License is Ready, ${userName}!</h2>
      <p style="color:#4b5563">Thank you for subscribing to <strong>${planName}</strong>. Here is your license key:</p>
      <div style="background:#0f1720;border:2px solid #f59e0b;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
        <p style="color:#9ca3af;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px">License Key</p>
        <p style="color:#f59e0b;font-size:24px;font-weight:bold;letter-spacing:4px;font-family:monospace;margin:0">${licenseKey}</p>
      </div>
      <p style="color:#4b5563">${validityLine}</p>
      <div style="background:#f9fafb;border-radius:12px;padding:20px;margin:24px 0">
        <h3 style="margin-top:0;color:#374151">How to Activate</h3>
        <ol style="color:#4b5563;line-height:2.2">
          <li>Download &amp; open Advoverse on your Windows computer</li>
          <li>Click <strong>"Enter License Key"</strong> on the trial screen</li>
          <li>Paste the key above and click <strong>"Activate"</strong></li>
        </ol>
      </div>
      <p style="color:#6b7280;font-size:14px">
        Not downloaded yet? Visit <a href="https://advoverse.com" style="color:#f59e0b">advoverse.com</a>
      </p>
      <p style="color:#6b7280;font-size:14px">
        Issues? Email us: <a href="mailto:support@advoverse.in" style="color:#f59e0b">support@advoverse.in</a>
      </p>
    </div>
    <div style="background:#f9fafb;padding:20px 40px;text-align:center;color:#9ca3af;font-size:12px">
      <p>© 2026 Advoverse. All Rights Reserved.</p>
    </div>
  </div>
</body>
</html>`,
  });
}

export async function sendAdminNotification(params: {
  userName: string;
  userEmail: string;
  planName: string;
  amount: number;
  gateway: string;
  licenseKey: string;
}) {
  if (!ADMIN_EMAIL) return;
  const { userName, userEmail, planName, amount, gateway, licenseKey } = params;

  await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `💰 New Sale: ${planName} — ₹${(amount / 100).toLocaleString('en-IN')}`,
    html: `
<div style="font-family:Arial,sans-serif;max-width:480px">
  <h2 style="color:#f59e0b">New Advoverse Sale 🎉</h2>
  <table style="width:100%;border-collapse:collapse">
    <tr><td style="padding:8px 0;color:#6b7280">Customer</td><td><strong>${userName}</strong></td></tr>
    <tr><td style="padding:8px 0;color:#6b7280">Email</td><td>${userEmail}</td></tr>
    <tr><td style="padding:8px 0;color:#6b7280">Plan</td><td><strong>${planName}</strong></td></tr>
    <tr><td style="padding:8px 0;color:#6b7280">Amount</td><td><strong>₹${(amount / 100).toLocaleString('en-IN')}</strong></td></tr>
    <tr><td style="padding:8px 0;color:#6b7280">Gateway</td><td>${gateway}</td></tr>
    <tr><td style="padding:8px 0;color:#6b7280">License Key</td><td style="font-family:monospace;font-size:13px">${licenseKey}</td></tr>
  </table>
  <p style="color:#9ca3af;font-size:12px;margin-top:24px">View all orders at your Supabase dashboard.</p>
</div>`,
  });
}
