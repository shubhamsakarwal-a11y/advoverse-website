# 🚀 QUICK SETUP GUIDE - Phase D

## ⚡ 3 Steps to Activate Expiry Notifications

### Step 1: Add Cron Secret (2 minutes)

1. **Generate secret**: Go to https://generate-secret.vercel.app/32
2. **Copy the generated secret**
3. **Add to Vercel**:
   - Go to: https://vercel.com → Your Project → Settings → Environment Variables
   - Variable: `CRON_SECRET`
   - Value: `paste_your_generated_secret`
   - Click "Save"

### Step 2: Verify Email Settings (1 minute)

Check these are set in Vercel Environment Variables:

- ✅ `RESEND_API_KEY` = `re_your_key_here` (should already exist)
- ✅ `EMAIL_FROM` = `Advoverse <support@advoverse.in>` (add if missing)

### Step 3: Test It Works (2 minutes)

**Option A: Wait for automatic cron (runs daily at 9 AM UTC / 2:30 PM IST)**

**Option B: Test manually now:**

```bash
curl -X GET https://advoverse.com/api/cron/check-expiring-licenses \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## 📧 What Happens Now?

### Automatic Daily Checks:
- Every day at 9:00 AM UTC (2:30 PM IST)
- System checks all active licenses
- Sends emails to users whose licenses:
  - Expire in 7 days
  - Expire in 1 day
  - Expired today

### Email Examples:

**7 Days Before:**
> ⏰ Your Advoverse License Expires in 7 Days
> Yellow banner, renew button, auto-renewal suggestion

**1 Day Before:**
> 🚨 URGENT: Your Advoverse License Expires Tomorrow
> Red urgent banner, large renew button

**Expired:**
> ❌ Your Advoverse License Has Expired
> Data safe message, renew to restore access

---

## 🖥️ Caseline Desktop App Integration

### API Endpoint:
`POST https://advoverse.com/api/desktop/check-expiry`

### Request Body:
```json
{
  "licenseKey": "ADV-1A2B-3C4D-5E6F-7G8H"
}
```

### What You Get:
- License validity status
- Days remaining
- Warning level (none/info/warning/critical)
- Warning message to show user
- Renewal URL

### When to Call:
1. On app startup
2. Every 24 hours while app is running
3. When user clicks "Check License" button

---

## 🎯 Testing Checklist

- [ ] Add `CRON_SECRET` to Vercel ← **DO THIS FIRST**
- [ ] Verify `RESEND_API_KEY` exists
- [ ] Add `EMAIL_FROM` if missing
- [ ] Test cron job manually (optional)
- [ ] Wait for 9 AM UTC to see automatic run
- [ ] Check Vercel logs for cron execution
- [ ] Check Resend dashboard for sent emails

---

## 🚨 Important Notes

1. **Vercel Pro Plan Required**: Cron jobs need Pro plan ($20/month)
   - If on Hobby plan, use external cron service instead

2. **Resend Email Limits**: Free tier = 100 emails/day
   - Upgrade if you have more users

3. **Time Zone**: Cron runs at 9:00 AM UTC
   - India: 2:30 PM IST
   - Change in `vercel.json` if needed

---

## 📞 Need Help?

**Check Logs:**
- Vercel: https://vercel.com → Deployments → Functions
- Resend: https://resend.com/emails

**Common Issues:**
- Emails not sending? Check `RESEND_API_KEY` is set
- Cron not running? Verify you're on Vercel Pro plan
- 401 error? Check `CRON_SECRET` matches

---

**Status**: Phase D Deployed ✅  
**Next**: Add environment variables and test!

