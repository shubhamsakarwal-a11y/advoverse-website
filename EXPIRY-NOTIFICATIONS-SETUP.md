# 📧 EXPIRY NOTIFICATIONS SETUP GUIDE

## Phase D: Expiry Notification System - Complete

The expiry notification system is now built and ready to use!

---

## ✅ WHAT'S BUILT

### 1. **Email Templates**
- ✅ 7-day expiry warning
- ✅ 1-day expiry warning (urgent)
- ✅ License expired notification
- ✅ Auto-renewal reminder (3 days before)
- ✅ Payment failed notification (with retry info)

### 2. **Automated Cron Job**
- ✅ Runs daily at 9:00 AM
- ✅ Checks all active licenses
- ✅ Sends appropriate notifications
- ✅ Logs all activities

### 3. **Desktop App API**
- ✅ `/api/desktop/check-expiry` endpoint
- ✅ Returns expiry status and warnings
- ✅ Provides warning levels (info/warning/critical)
- ✅ Includes renewal URLs

---

## 🔧 SETUP REQUIRED

### Step 1: Configure Resend API Key

You already have `RESEND_API_KEY` in Vercel, but verify it's set:

1. Go to: https://resend.com/api-keys
2. Copy your API key
3. Go to Vercel → Settings → Environment Variables
4. Verify: `RESEND_API_KEY` = `re_your_key_here`
5. Add: `EMAIL_FROM` = `Advoverse <support@advoverse.in>`

### Step 2: Add Cron Secret (Security)

1. Generate a random secret: `openssl rand -hex 32`
2. Add to Vercel Environment Variables:
   - `CRON_SECRET` = `your_generated_secret`
3. Redeploy

### Step 3: Verify Cron Job

The cron job is configured in `vercel.json`:
- Runs daily at 9:00 AM UTC
- Path: `/api/cron/check-expiring-licenses`

**Vercel will automatically set this up on deployment!**

---

## 📧 EMAIL NOTIFICATION FLOW

### Timeline:

```
Day -7:  📧 "Your license expires in 7 days"
         - Yellow warning banner
         - Renew now button
         - Enable auto-renewal suggestion

Day -1:  📧 "URGENT: License expires tomorrow"
         - Red urgent banner
         - Large renew button
         - List of features that will be lost

Day 0:   📧 "Your license has expired"
         - Expired status
         - Data is safe message
         - Renew to restore access button
```

### Auto-Renewal Flow:

```
Day -3:  📧 "Auto-renewal reminder"
         - Amount to be charged
         - Payment method (card ending)
         - Cancel option

Day 0:   🔄 Razorpay charges automatically
         - If success: License extended
         - If failed: Retry schedule starts

Retry:   📧 "Payment failed - Retry X/5"
         - Failure reason
         - Next retry time
         - Update payment method button
```

---

## 🖥️ DESKTOP APP INTEGRATION

### API Endpoint:
`POST https://advoverse.com/api/desktop/check-expiry`

### Request:
```json
{
  "licenseKey": "ADV-1A2B-3C4D-5E6F-7G8H"
}
```

### Response:
```json
{
  "valid": true,
  "expired": false,
  "isActive": true,
  "planName": "Chamber (monthly)",
  "expiresAt": "2026-07-25T00:00:00.000Z",
  "daysRemaining": 15,
  "autoRenewalEnabled": false,
  "warning": {
    "level": "info",
    "message": "Your license expires in 15 days.",
    "showBanner": true,
    "showPopup": false
  },
  "actions": {
    "renewUrl": "https://advoverse.com/my-licenses",
    "enableAutoRenewalUrl": "https://advoverse.com/my-licenses"
  }
}
```

### Warning Levels:
- **none**: More than 7 days remaining
- **info**: 4-7 days remaining (show banner)
- **warning**: 2-3 days remaining (show banner + notification)
- **critical**: 0-1 days remaining (show banner + popup)

### Desktop App Implementation:

```csharp
// Check on app startup
var response = await CheckLicenseExpiry(licenseKey);

if (response.Warning.ShowBanner) {
    ShowExpiryBanner(response.Warning.Message, response.Warning.Level);
}

if (response.Warning.ShowPopup) {
    ShowExpiryPopup(response.Warning.Message, response.Actions.RenewUrl);
}

// Check periodically (every 24 hours)
Timer.Interval = TimeSpan.FromHours(24);
Timer.Tick += async (s, e) => {
    var response = await CheckLicenseExpiry(licenseKey);
    UpdateExpiryStatus(response);
};
```

---

## 🧪 TESTING

### Test Cron Job Manually:

```bash
curl -X GET https://advoverse.com/api/cron/check-expiring-licenses \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Test Desktop API:

```bash
curl -X POST https://advoverse.com/api/desktop/check-expiry \
  -H "Content-Type: application/json" \
  -d '{"licenseKey": "ADV-1A2B-3C4D-5E6F-7G8H"}'
```

### Test Emails:

1. Create a test license expiring in 7 days
2. Run cron job manually
3. Check email inbox
4. Verify email formatting and links

---

## 📊 MONITORING

### Check Cron Job Logs:
1. Go to Vercel → Deployments → Functions
2. Find `/api/cron/check-expiring-licenses`
3. View logs for execution history

### Check Email Delivery:
1. Go to Resend Dashboard: https://resend.com/emails
2. View sent emails
3. Check delivery status
4. See open/click rates

### Database Queries:

```sql
-- Licenses expiring in next 7 days
SELECT * FROM licenses 
WHERE is_active = true 
AND expires_at BETWEEN NOW() AND NOW() + INTERVAL '7 days'
ORDER BY expires_at;

-- Expired licenses
SELECT * FROM licenses 
WHERE is_active = true 
AND expires_at < NOW()
ORDER BY expires_at DESC;

-- Auto-renewal enabled licenses
SELECT * FROM licenses 
WHERE auto_renewal_enabled = true
ORDER BY expires_at;
```

---

## 🎨 EMAIL CUSTOMIZATION

All email templates are in: `lib/email-templates.ts`

You can customize:
- Colors and styling
- Text content
- Button labels
- Company branding
- Footer information

---

## ⚙️ CONFIGURATION OPTIONS

### Change Cron Schedule:

Edit `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/check-expiring-licenses",
    "schedule": "0 9 * * *"  // 9 AM daily
  }]
}
```

Cron syntax:
- `0 9 * * *` - 9 AM daily
- `0 */6 * * *` - Every 6 hours
- `0 0 * * *` - Midnight daily

### Change Warning Thresholds:

Edit `app/api/desktop/check-expiry/route.ts`:
```typescript
if (daysUntilExpiry <= 1) {
  warningLevel = 'critical';
} else if (daysUntilExpiry <= 3) {
  warningLevel = 'warning';
} else if (daysUntilExpiry <= 7) {
  warningLevel = 'info';
}
```

---

## 🚨 IMPORTANT NOTES

1. **Resend API Key**: Must be configured for emails to work
2. **Cron Secret**: Recommended for security
3. **Email From Address**: Must be verified in Resend
4. **Desktop App**: Must implement the check-expiry API
5. **Time Zone**: Cron runs in UTC, adjust schedule accordingly

---

## 📞 TROUBLESHOOTING

### Emails Not Sending:
- Check Resend API key is set
- Verify EMAIL_FROM is configured
- Check Resend dashboard for errors
- Ensure sender email is verified

### Cron Not Running:
- Check vercel.json is in root directory
- Verify cron secret is set
- Check Vercel deployment logs
- Ensure project is on Pro plan (crons require Pro)

### Desktop API Not Working:
- Check license key is correct
- Verify API endpoint URL
- Check network connectivity
- Review API response for errors

---

**Status**: Expiry Notification System Complete ✅
**Next**: Phase B - Machine Activation System
