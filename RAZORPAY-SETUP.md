# 🔄 RAZORPAY AUTO-RENEWAL SETUP GUIDE

## Phase C: Auto-Renewal System - Configuration Required

The auto-renewal system is now built, but you need to configure Razorpay to make it work.

---

## 📋 STEP 1: Create Subscription Plans in Razorpay

You need to create 21 subscription plans in Razorpay Dashboard (7 plans × 3 durations).

### Go to Razorpay Dashboard:
https://dashboard.razorpay.com/app/subscriptions/plans

### Create Plans:

#### Junior Advocate Plans:
1. **Monthly** - ₹100/month (30 days)
   - Plan ID: `plan_junior_monthly`
   - Billing Interval: 1 month
   - Amount: ₹100

2. **Quarterly** - ₹270/quarter (90 days)
   - Plan ID: `plan_junior_quarterly`
   - Billing Interval: 3 months
   - Amount: ₹270

3. **Yearly** - ₹960/year (365 days)
   - Plan ID: `plan_junior_yearly`
   - Billing Interval: 12 months
   - Amount: ₹960

#### Solo Advocate Plans:
1. Monthly: `plan_solo_monthly` - ₹200
2. Quarterly: `plan_solo_quarterly` - ₹540
3. Yearly: `plan_solo_yearly` - ₹1920

#### Advocate + Clerk Plans:
1. Monthly: `plan_clerk_monthly` - ₹300
2. Quarterly: `plan_clerk_quarterly` - ₹810
3. Yearly: `plan_clerk_yearly` - ₹2880

#### Chamber Lite Plans:
1. Monthly: `plan_lite_monthly` - ₹800
2. Quarterly: `plan_lite_quarterly` - ₹2160
3. Yearly: `plan_lite_yearly` - ₹7680

#### Chamber Plans:
1. Monthly: `plan_chamber_monthly` - ₹1500
2. Quarterly: `plan_chamber_quarterly` - ₹4050
3. Yearly: `plan_chamber_yearly` - ₹14400

#### Chamber Pro Plans:
1. Monthly: `plan_pro_monthly` - ₹3000
2. Quarterly: `plan_pro_quarterly` - ₹8100
3. Yearly: `plan_pro_yearly` - ₹28800

#### Exclusive Plans:
1. Monthly: `plan_exclusive_monthly` - ₹5000
2. Quarterly: `plan_exclusive_quarterly` - ₹13500
3. Yearly: `plan_exclusive_yearly` - ₹48000

---

## 📋 STEP 2: Setup Webhook

### Go to Razorpay Webhooks:
https://dashboard.razorpay.com/app/webhooks

### Create New Webhook:
1. Click **"Create New Webhook"**
2. **Webhook URL**: `https://advoverse.com/api/subscription/webhook`
3. **Active Events** - Select these:
   - ✅ `subscription.charged` (successful renewal)
   - ✅ `subscription.payment_failed` (failed renewal)
   - ✅ `subscription.cancelled` (subscription cancelled)
4. **Secret**: Generate a strong secret (save it!)
5. Click **"Create Webhook"**

### Add Webhook Secret to Vercel:
1. Go to Vercel → Your Project → Settings → Environment Variables
2. Add: `RAZORPAY_WEBHOOK_SECRET` = `your_webhook_secret_here`
3. Redeploy

---

## 📋 STEP 3: Update Plan IDs in Code (Optional)

If you used different Plan IDs in Razorpay, update them in:
`app/api/subscription/create/route.ts`

Look for the `SUBSCRIPTION_PLAN_IDS` object and update with your actual Plan IDs.

---

## 🔄 HOW AUTO-RENEWAL WORKS

### User Flow:
1. User purchases a license (one-time payment)
2. User enables auto-renewal from "My Licenses" page
3. System creates Razorpay subscription
4. Before license expires, Razorpay automatically charges user
5. Webhook receives notification
6. System extends license expiry

### Payment Retry Logic:
If payment fails, system retries 5 times:
- Retry 1: After 30 minutes
- Retry 2: After 1 hour
- Retry 3: After 2 hours
- Retry 4: After 4 hours
- Retry 5: After 24 hours

After 5 failures:
- User gets 3-day grace period
- After grace period: License suspended (data safe, access locked)

### Grace Period:
- User has 3 days to update payment method
- License remains active during grace period
- After 3 days: License suspended

---

## 📧 EMAIL NOTIFICATIONS (To Be Implemented in Phase D)

Auto-renewal emails:
1. **3 days before renewal**: "Your license will auto-renew in 3 days"
2. **After successful renewal**: "License renewed successfully"
3. **After failed payment**: "Payment failed - Retry X/5"
4. **After all retries fail**: "Update payment method - Grace period active"
5. **Grace period ending**: "License will suspend in 1 day"

---

## ✅ TESTING AUTO-RENEWAL

### Test Mode:
1. Use Razorpay Test Mode keys
2. Create test subscription plans
3. Use test cards: https://razorpay.com/docs/payments/payments/test-card-details/
4. Test successful payment: `4111 1111 1111 1111`
5. Test failed payment: `4000 0000 0000 0002`

### Verify:
1. Enable auto-renewal on a license
2. Check Razorpay Dashboard → Subscriptions
3. Trigger webhook manually to test
4. Check database: `renewal_history` table

---

## 🔐 SECURITY NOTES

- Webhook signature verification is implemented
- All API endpoints require authentication
- User can only manage their own licenses
- Payment details never stored on your server
- Razorpay handles all card tokenization (PCI-compliant)

---

## 📊 MONITORING

### Check Renewal Status:
- Admin Dashboard → Licenses page
- Look for "🔄 Auto-renewal ON" badge
- Check `renewal_history` table in Supabase

### Failed Payments:
- Check `renewal_history` table
- Filter by `success = false`
- See `failure_reason` and `retry_attempt`

---

## 🚨 IMPORTANT NOTES

1. **Razorpay Plans**: Must be created before auto-renewal works
2. **Webhook Secret**: Must be added to Vercel environment variables
3. **Test Mode**: Test thoroughly before going live
4. **Email Notifications**: Will be implemented in Phase D
5. **User Communication**: Inform users about auto-renewal clearly

---

## 📞 SUPPORT

If you face issues:
1. Check Razorpay Dashboard → Webhooks → Logs
2. Check Vercel → Deployments → Function Logs
3. Check Supabase → Table Editor → `renewal_history`

---

**Status**: Auto-Renewal System Built ✅
**Next**: Configure Razorpay Plans & Webhook
**Then**: Phase D - Expiry Notifications
