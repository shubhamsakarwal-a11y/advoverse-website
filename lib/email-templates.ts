/**
 * Email templates for license expiry notifications
 */

interface EmailTemplate {
  subject: string;
  html: string;
}

export function getExpiryWarning7Days(params: {
  userName: string;
  planName: string;
  licenseKey: string;
  expiryDate: Date;
}): EmailTemplate {
  const { userName, planName, licenseKey, expiryDate } = params;
  
  return {
    subject: `⏰ Your Advoverse License Expires in 7 Days`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="background:#f4f4f4;font-family:Arial,sans-serif;margin:0;padding:20px">
  <div style="max-width:580px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden">
    <div style="background:#fbbf24;padding:36px 40px">
      <h1 style="color:#78350f;margin:0 0 4px;letter-spacing:2px;font-size:26px">⏰ LICENSE EXPIRING SOON</h1>
      <p style="color:#92400e;margin:0;font-size:13px">Action Required</p>
    </div>
    <div style="padding:40px">
      <h2 style="color:#111827;margin-top:0">Hi ${userName},</h2>
      <p style="color:#4b5563;font-size:16px">Your <strong>${planName}</strong> license will expire in <strong>7 days</strong>.</p>
      
      <div style="background:#fef3c7;border:2px solid #fbbf24;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
        <p style="color:#92400e;font-size:13px;margin:0 0 8px">Expires On</p>
        <p style="color:#78350f;font-size:28px;font-weight:bold;margin:0">${expiryDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
      </div>

      <p style="color:#dc2626;font-size:15px;font-weight:600;margin:24px 0">
        ⚠️ Don't lose access to your cases and data!
      </p>

      <div style="text-align:center;margin:32px 0">
        <a href="https://advoverse.com/my-licenses" style="display:inline-block;background:#f59e0b;color:#000;padding:16px 32px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:16px">
          Renew License Now
        </a>
      </div>

      <div style="background:#f9fafb;border-radius:12px;padding:20px;margin:24px 0">
        <h3 style="margin-top:0;color:#374151;font-size:16px">💡 Enable Auto-Renewal</h3>
        <p style="color:#4b5563;font-size:14px;margin:8px 0">Never worry about expiry again! Enable auto-renewal and your license will automatically renew before expiry.</p>
        <a href="https://advoverse.com/my-licenses" style="color:#f59e0b;text-decoration:none;font-weight:600">Enable Auto-Renewal →</a>
      </div>

      <p style="color:#6b7280;font-size:13px;margin-top:24px">
        Your License Key: <code style="background:#f3f4f6;padding:4px 8px;border-radius:4px;font-family:monospace">${licenseKey}</code>
      </p>
    </div>
    <div style="background:#f9fafb;padding:20px 40px;text-align:center;color:#9ca3af;font-size:12px">
      <p>Need help? Email us at <a href="mailto:support@advoverse.com" style="color:#f59e0b">support@advoverse.com</a></p>
      <p>© 2026 Advoverse. All Rights Reserved.</p>
    </div>
  </div>
</body>
</html>`,
  };
}

export function getExpiryWarning1Day(params: {
  userName: string;
  planName: string;
  licenseKey: string;
  expiryDate: Date;
}): EmailTemplate {
  const { userName, planName, licenseKey, expiryDate } = params;
  
  return {
    subject: `🚨 URGENT: Your Advoverse License Expires Tomorrow`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="background:#f4f4f4;font-family:Arial,sans-serif;margin:0;padding:20px">
  <div style="max-width:580px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:3px solid #dc2626">
    <div style="background:#dc2626;padding:36px 40px">
      <h1 style="color:#fff;margin:0 0 4px;letter-spacing:2px;font-size:26px">🚨 URGENT: LICENSE EXPIRING</h1>
      <p style="color:#fecaca;margin:0;font-size:13px">Less than 24 hours remaining</p>
    </div>
    <div style="padding:40px">
      <h2 style="color:#111827;margin-top:0">Hi ${userName},</h2>
      <p style="color:#dc2626;font-size:18px;font-weight:bold">Your <strong>${planName}</strong> license expires in less than 24 hours!</p>
      
      <div style="background:#fee2e2;border:3px solid #dc2626;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
        <p style="color:#991b1b;font-size:13px;margin:0 0 8px">⏰ EXPIRES TOMORROW</p>
        <p style="color:#7f1d1d;font-size:32px;font-weight:bold;margin:0">${expiryDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        <p style="color:#991b1b;font-size:14px;margin:8px 0 0">at 11:59 PM</p>
      </div>

      <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:16px;margin:24px 0">
        <p style="color:#92400e;font-size:14px;margin:0;font-weight:600">⚠️ After expiry, you won't be able to:</p>
        <ul style="color:#92400e;font-size:14px;margin:8px 0;padding-left:20px">
          <li>Access your cases</li>
          <li>View client data</li>
          <li>Use chamber features</li>
        </ul>
      </div>

      <div style="text-align:center;margin:32px 0">
        <a href="https://advoverse.com/my-licenses" style="display:inline-block;background:#dc2626;color:#fff;padding:18px 40px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:18px;box-shadow:0 4px 12px rgba(220,38,38,0.3)">
          Renew Immediately
        </a>
      </div>

      <p style="color:#6b7280;font-size:13px;margin-top:24px">
        Your License Key: <code style="background:#f3f4f6;padding:4px 8px;border-radius:4px;font-family:monospace">${licenseKey}</code>
      </p>
    </div>
    <div style="background:#f9fafb;padding:20px 40px;text-align:center;color:#9ca3af;font-size:12px">
      <p>Need help? Email us at <a href="mailto:support@advoverse.com" style="color:#f59e0b">support@advoverse.com</a></p>
      <p>© 2026 Advoverse. All Rights Reserved.</p>
    </div>
  </div>
</body>
</html>`,
  };
}

export function getLicenseExpired(params: {
  userName: string;
  planName: string;
  licenseKey: string;
  expiredDate: Date;
}): EmailTemplate {
  const { userName, planName, licenseKey, expiredDate } = params;
  
  return {
    subject: `❌ Your Advoverse License Has Expired`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="background:#f4f4f4;font-family:Arial,sans-serif;margin:0;padding:20px">
  <div style="max-width:580px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden">
    <div style="background:#7f1d1d;padding:36px 40px">
      <h1 style="color:#fff;margin:0 0 4px;letter-spacing:2px;font-size:26px">❌ LICENSE EXPIRED</h1>
      <p style="color:#fecaca;margin:0;font-size:13px">Renew to restore access</p>
    </div>
    <div style="padding:40px">
      <h2 style="color:#111827;margin-top:0">Hi ${userName},</h2>
      <p style="color:#4b5563;font-size:16px">Your <strong>${planName}</strong> license expired on <strong>${expiredDate.toLocaleDateString('en-IN')}</strong>.</p>
      
      <div style="background:#fee2e2;border:2px solid #dc2626;border-radius:12px;padding:24px;margin:24px 0">
        <p style="color:#991b1b;font-size:15px;font-weight:600;margin:0 0 12px">🔒 Your data is safe, but you can't access it until renewal.</p>
        <p style="color:#991b1b;font-size:14px;margin:0">All your cases, clients, and documents are securely stored and will be restored immediately after renewal.</p>
      </div>

      <div style="text-align:center;margin:32px 0">
        <a href="https://advoverse.com/my-licenses" style="display:inline-block;background:#f59e0b;color:#000;padding:18px 40px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:18px">
          Renew Now to Restore Access
        </a>
      </div>

      <div style="background:#dcfce7;border-left:4px solid #16a34a;padding:16px;margin:24px 0">
        <p style="color:#166534;font-size:14px;margin:0;font-weight:600">💡 Enable Auto-Renewal</p>
        <p style="color:#166534;font-size:13px;margin:8px 0 0">Never face this again! Enable auto-renewal for uninterrupted service.</p>
      </div>

      <p style="color:#6b7280;font-size:13px;margin-top:24px">
        Your License Key: <code style="background:#f3f4f6;padding:4px 8px;border-radius:4px;font-family:monospace">${licenseKey}</code>
      </p>
    </div>
    <div style="background:#f9fafb;padding:20px 40px;text-align:center;color:#9ca3af;font-size:12px">
      <p>Need help? Email us at <a href="mailto:support@advoverse.com" style="color:#f59e0b">support@advoverse.com</a></p>
      <p>© 2026 Advoverse. All Rights Reserved.</p>
    </div>
  </div>
</body>
</html>`,
  };
}

export function getAutoRenewalReminder(params: {
  userName: string;
  planName: string;
  amount: number;
  renewalDate: Date;
  cardLast4: string;
}): EmailTemplate {
  const { userName, planName, amount, renewalDate, cardLast4 } = params;
  
  return {
    subject: `💳 Auto-Renewal Reminder: ${planName}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="background:#f4f4f4;font-family:Arial,sans-serif;margin:0;padding:20px">
  <div style="max-width:580px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden">
    <div style="background:#16a34a;padding:36px 40px">
      <h1 style="color:#fff;margin:0 0 4px;letter-spacing:2px;font-size:26px">💳 AUTO-RENEWAL REMINDER</h1>
      <p style="color:#dcfce7;margin:0;font-size:13px">Your license will renew automatically</p>
    </div>
    <div style="padding:40px">
      <h2 style="color:#111827;margin-top:0">Hi ${userName},</h2>
      <p style="color:#4b5563;font-size:16px">Your <strong>${planName}</strong> license will auto-renew in 3 days.</p>
      
      <div style="background:#dcfce7;border:2px solid #16a34a;border-radius:12px;padding:24px;margin:24px 0">
        <div style="display:flex;justify-content:space-between;margin-bottom:12px">
          <span style="color:#166534;font-size:14px">Renewal Date:</span>
          <span style="color:#166534;font-size:14px;font-weight:bold">${renewalDate.toLocaleDateString('en-IN')}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:12px">
          <span style="color:#166534;font-size:14px">Amount:</span>
          <span style="color:#166534;font-size:14px;font-weight:bold">₹${amount.toLocaleString('en-IN')}</span>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span style="color:#166534;font-size:14px">Payment Method:</span>
          <span style="color:#166534;font-size:14px;font-weight:bold">Card ending in ${cardLast4}</span>
        </div>
      </div>

      <p style="color:#4b5563;font-size:14px">No action needed! Your license will automatically renew and you'll receive a confirmation email.</p>

      <div style="text-align:center;margin:32px 0">
        <a href="https://advoverse.com/my-licenses" style="display:inline-block;background:#f59e0b;color:#000;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;margin-right:12px">
          View License
        </a>
        <a href="https://advoverse.com/my-licenses" style="display:inline-block;background:#fff;color:#dc2626;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;border:2px solid #dc2626">
          Cancel Auto-Renewal
        </a>
      </div>

      <p style="color:#9ca3af;font-size:12px;margin-top:24px;text-align:center">
        You can cancel auto-renewal anytime from your account settings.
      </p>
    </div>
    <div style="background:#f9fafb;padding:20px 40px;text-align:center;color:#9ca3af;font-size:12px">
      <p>Need help? Email us at <a href="mailto:support@advoverse.com" style="color:#f59e0b">support@advoverse.com</a></p>
      <p>© 2026 Advoverse. All Rights Reserved.</p>
    </div>
  </div>
</body>
</html>`,
  };
}

export function getPaymentFailedNotification(params: {
  userName: string;
  planName: string;
  retryAttempt: number;
  nextRetry: Date;
  failureReason: string;
}): EmailTemplate {
  const { userName, planName, retryAttempt, nextRetry, failureReason } = params;
  
  return {
    subject: `❌ Auto-Renewal Payment Failed - Retry ${retryAttempt}/5`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="background:#f4f4f4;font-family:Arial,sans-serif;margin:0;padding:20px">
  <div style="max-width:580px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden">
    <div style="background:#dc2626;padding:36px 40px">
      <h1 style="color:#fff;margin:0 0 4px;letter-spacing:2px;font-size:26px">❌ PAYMENT FAILED</h1>
      <p style="color:#fecaca;margin:0;font-size:13px">Auto-renewal unsuccessful</p>
    </div>
    <div style="padding:40px">
      <h2 style="color:#111827;margin-top:0">Hi ${userName},</h2>
      <p style="color:#4b5563;font-size:16px">We couldn't process your auto-renewal payment for <strong>${planName}</strong>.</p>
      
      <div style="background:#fee2e2;border:2px solid #dc2626;border-radius:12px;padding:20px;margin:24px 0">
        <p style="color:#991b1b;font-size:14px;margin:0 0 8px"><strong>Reason:</strong> ${failureReason}</p>
        <p style="color:#991b1b;font-size:14px;margin:0"><strong>Retry Attempt:</strong> ${retryAttempt} of 5</p>
      </div>

      <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:16px;margin:24px 0">
        <p style="color:#92400e;font-size:14px;margin:0;font-weight:600">⏰ Next Retry</p>
        <p style="color:#92400e;font-size:14px;margin:8px 0 0">We'll automatically retry on ${nextRetry.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
      </div>

      <p style="color:#4b5563;font-size:14px">To avoid service interruption, please:</p>
      <ul style="color:#4b5563;font-size:14px">
        <li>Ensure sufficient funds in your account</li>
        <li>Check if your card is active and not expired</li>
        <li>Update your payment method if needed</li>
      </ul>

      <div style="text-align:center;margin:32px 0">
        <a href="https://advoverse.com/my-licenses" style="display:inline-block;background:#f59e0b;color:#000;padding:16px 32px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:16px">
          Update Payment Method
        </a>
      </div>

      ${retryAttempt >= 4 ? `
      <div style="background:#fee2e2;border:2px solid #dc2626;border-radius:12px;padding:16px;margin:24px 0">
        <p style="color:#991b1b;font-size:13px;margin:0;font-weight:600">⚠️ Warning: This is your ${retryAttempt === 4 ? 'second-to-last' : 'final'} retry attempt!</p>
        <p style="color:#991b1b;font-size:13px;margin:8px 0 0">After 5 failed attempts, you'll have a 3-day grace period before your license is suspended.</p>
      </div>
      ` : ''}
    </div>
    <div style="background:#f9fafb;padding:20px 40px;text-align:center;color:#9ca3af;font-size:12px">
      <p>Need help? Email us at <a href="mailto:support@advoverse.com" style="color:#f59e0b">support@advoverse.com</a></p>
      <p>© 2026 Advoverse. All Rights Reserved.</p>
    </div>
  </div>
</body>
</html>`,
  };
}
