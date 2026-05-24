# ✅ PHASE D: EXPIRY NOTIFICATION SYSTEM - DEPLOYED

**Commit**: `1eb7711`  
**Status**: Live on https://advoverse.com  
**Deployment**: Automatic via Vercel

---

## 🎉 WHAT'S LIVE NOW

### 1. **Email Templates** (5 templates)
- ✅ 7-day expiry warning
- ✅ 1-day expiry warning (urgent)
- ✅ License expired notification
- ✅ Auto-renewal reminder (3 days before)
- ✅ Payment failed notification (with retry info)

### 2. **Automated Cron Job**
- ✅ Runs daily at 9:00 AM UTC
- ✅ Checks all active licenses
- ✅ Sends appropriate notifications
- ✅ Endpoint: `/api/cron/check-expiring-licenses`

### 3. **Desktop App API**
- ✅ Endpoint: `/api/desktop/check-expiry`
- ✅ Returns expiry status and warnings
- ✅ Provides warning levels (info/warning/critical)
- ✅ Includes renewal URLs for Caseline app

---

## ⚙️ CONFIGURATION REQUIRED

### Step 1: Add Cron Secret (Security)

**Why**: Prevents unauthorized access to cron endpoint

1. Generate a random secret:
   ```bash
   openssl rand -hex 32
   ```
   Or use: https://generate-secret.vercel.app/32

2. Add to Vercel:
   - Go to: https://vercel.com/shubhamsakarwal-a11y/advoverse-website/settings/environment-variables
   - Add: `CRON_SECRET` = `your_generated_secret`
   - Click "Save"

3. Redeploy (or wait for next auto-deploy)

### Step 2: Verify Email Configuration

**Check these environment variables in Vercel:**

1. `RESEND_API_KEY` - Should already be set
2. `EMAIL_FROM` - Add if not present: `Advoverse <support@advoverse.in>`

**Verify sender email in Resend:**
- Go to: https://resend.com/domains
- Ensure `advoverse.in` or your domain is verified
- Or use Resend's default: `onboarding@resend.dev`

### Step 3: Test Cron Job

**Manual test (after adding CRON_SECRET):**

```bash
curl -X GET https://advoverse.com/api/cron/check-expiring-licenses \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Expected response:**
```json
{
  "success": true,
  "timestamp": "2026-05-25T10:30:00.000Z",
  "results": {
    "sevenDayWarnings": 2,
    "oneDayWarnings": 1,
    "expiredNotifications": 0,
    "errors": []
  }
}
```

---

## 📧 EMAIL NOTIFICATION TIMELINE

### For Regular Licenses:

```
Day -7:  📧 "Your license expires in 7 days"
         Yellow banner, renew button, auto-renewal suggestion

Day -1:  📧 "URGENT: License expires tomorrow"
         Red urgent banner, large renew button

Day 0:   📧 "Your license has expired"
         Expired status, data safe message, renew button
```

### For Auto-Renewal Licenses:

```
Day -3:  📧 "Auto-renewal reminder"
         Amount, payment method, cancel option

Day 0:   🔄 Razorpay charges automatically
         Success: License extended
         Failed: Retry schedule starts

Retry:   📧 "Payment failed - Retry X/5"
         Failure reason, next retry time, update payment button
```

---

## 🖥️ CASELINE DESKTOP APP INTEGRATION

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
- **none**: More than 7 days remaining (no warning)
- **info**: 4-7 days remaining (show banner)
- **warning**: 2-3 days remaining (show banner + notification)
- **critical**: 0-1 days remaining (show banner + popup)

### Implementation in Caseline:

1. **On App Startup**: Call API to check expiry status
2. **Show Banner**: If `warning.showBanner` is true
3. **Show Popup**: If `warning.showPopup` is true
4. **Periodic Check**: Call API every 24 hours
5. **Renewal Button**: Link to `actions.renewUrl`

---

## 📊 MONITORING

### Check Cron Job Execution:
1. Go to: https://vercel.com/shubhamsakarwal-a11y/advoverse-website/deployments
2. Click on latest deployment
3. Go to "Functions" tab
4. Find `/api/cron/check-expiring-licenses`
5. View logs

### Check Email Delivery:
1. Go to: https://resend.com/emails
2. View sent emails
3. Check delivery status
4. See open/click rates

### Database Queries (Supabase):

```sql
-- Licenses expiring in next 7 days
SELECT 
  l.*,
  p.name,
  (l.expires_at - NOW()) as time_remaining
FROM licenses l
JOIN profiles p ON l.user_id = p.id
WHERE l.is_active = true 
AND l.expires_at BETWEEN NOW() AND NOW() + INTERVAL '7 days'
ORDER BY l.expires_at;

-- Expired licenses
SELECT * FROM licenses 
WHERE is_active = true 
AND expires_at < NOW()
ORDER BY expires_at DESC;

-- Auto-renewal enabled
SELECT * FROM licenses 
WHERE auto_renewal_enabled = true
ORDER BY expires_at;
```

---

## 🧪 TESTING CHECKLIST

- [ ] Add `CRON_SECRET` to Vercel
- [ ] Verify `RESEND_API_KEY` is set
- [ ] Add `EMAIL_FROM` to Vercel
- [ ] Test cron job manually
- [ ] Create test license expiring in 7 days
- [ ] Verify 7-day warning email received
- [ ] Create test license expiring in 1 day
- [ ] Verify 1-day warning email received
- [ ] Test desktop API with valid license key
- [ ] Test desktop API with expired license
- [ ] Check Vercel cron logs
- [ ] Check Resend email delivery

---

## 🚨 IMPORTANT NOTES

1. **Vercel Cron Jobs**: Require Pro plan ($20/month)
   - If on Hobby plan, cron won't run
   - Alternative: Use external cron service (cron-job.org) to call the API

2. **Email Sending Limits**: Resend free tier = 100 emails/day
   - Upgrade if you have more users

3. **Time Zone**: Cron runs at 9:00 AM UTC
   - India: 2:30 PM IST
   - Adjust in `vercel.json` if needed

4. **Desktop App**: Must implement the check-expiry API
   - Show warnings based on `warning.level`
   - Link to renewal page

---

## 📁 FILES DEPLOYED

```
✅ lib/email-templates.ts                          (5 email templates)
✅ app/api/cron/check-expiring-licenses/route.ts   (Daily cron job)
✅ app/api/desktop/check-expiry/route.ts           (Desktop API)
✅ vercel.json                                     (Cron configuration)
✅ EXPIRY-NOTIFICATIONS-SETUP.md                   (Full documentation)
```

---

## 🎯 NEXT STEPS

### Immediate (Required):
1. Add `CRON_SECRET` to Vercel environment variables
2. Verify `RESEND_API_KEY` and `EMAIL_FROM` are set
3. Test cron job manually
4. Verify email delivery

### Phase B (Next):
- Machine Activation System
- One license = one active machine
- Machine transfer with 24-hour cooldown
- Email approval for new machines
- Admin dashboard for machine management

---

**Status**: Phase D Complete ✅  
**Deployment**: Live on https://advoverse.com  
**Next**: Configure environment variables and test

