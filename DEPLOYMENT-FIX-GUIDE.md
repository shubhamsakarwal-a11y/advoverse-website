# Deployment Fix Guide - Authentication & Payment Issues

## Current Situation
- **Live Site**: Rolled back to deployment `3gQTgHtm` (commit `2620a6d`)
- **Issues**: 
  1. ❌ Cannot sign in or register (Failed to fetch error)
  2. ❌ Razorpay payment gateway not appearing
  3. ❌ Social login (Google, Microsoft) not available
- **Local Code**: Has all fixes including social login and improved error handling

## Root Cause
The rolled-back deployment is missing:
1. Razorpay environment variables (you added them but then rolled back)
2. Social login functionality
3. Better error handling

## Solution: Deploy Latest Code with Environment Variables

### Step 1: Verify Environment Variables in Vercel

Go to your Vercel project → Settings → Environment Variables and ensure ALL these are set:

#### Required Variables (Must Have):
```
NEXT_PUBLIC_SUPABASE_URL=https://nvzqwtaglkhsdqfobmr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52enF4d3RhZ2xraHNkcWZvYm1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNTg3NTAsImV4cCI6MjA5NDkzNDc1MH0.lwbG0ombv3kn0A95SjyJPFesGNSWgTBnbMTwqdbN3Jw
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52enF4d3RhZ2xraHNkcWZvYm1yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTM1ODc1MCwiZXhwIjoyMDk0OTM0NzUwfQ.nIXRe8D2ohJbix97oTtOuy2B29gOpjfE8xQ1E_GRYKo
RAZORPAY_KEY_ID=rzp_live_SsmesdhQ81LDT7
RAZORPAY_KEY_SECRET=QM7TkdIdmaAHEdxcORdiMnmy
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_SsmesdhQ81LDT7
NEXT_PUBLIC_APP_URL=https://advoverse.com
EMAIL_FROM=Advoverse <support@advoverse.com>
```

**IMPORTANT**: Make sure these are set for **Production** environment!

### Step 2: Verify Supabase Configuration

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/nvzqwtaglkhsdqfobmr
2. Check Authentication settings:
   - Email auth should be enabled
   - For social login, you need to configure OAuth providers:
     - **Google OAuth**: Add your Google Client ID and Secret
     - **Microsoft OAuth**: Add your Azure App credentials
3. Check if email confirmation is required:
   - Go to Authentication → Settings → Email Auth
   - If "Confirm email" is ON, users must verify email before logging in
   - For testing, you can turn this OFF temporarily

### Step 3: Deploy Latest Code

The latest code (commit `64f83c3`) includes:
- ✅ Social login (Google, Microsoft)
- ✅ Better error handling with console logs
- ✅ All styling preserved
- ✅ Razorpay payment integration
- ✅ Download Application section

**To deploy:**

Option A - Push to GitHub (Vercel auto-deploys):
```bash
git status
git add .
git commit -m "Fix authentication and payment with better error handling"
git push origin main
```

Option B - Deploy from Vercel Dashboard:
1. Go to Vercel dashboard
2. Click "Deployments"
3. Find deployment `64f83c3` (or latest)
4. Click "..." → "Promote to Production"

### Step 4: Test After Deployment

1. **Test Registration**:
   - Click any pricing plan
   - Try to register with email
   - Check browser console (F12) for any errors
   - If you see "Failed to fetch", check Supabase URL and keys

2. **Test Social Login**:
   - Click "Continue with Google" or "Continue with Microsoft"
   - Should redirect to OAuth provider
   - After login, should redirect back to site

3. **Test Payment**:
   - Register/login successfully
   - Click a pricing plan
   - Select Razorpay
   - Razorpay modal should appear
   - If not, check browser console for errors

### Step 5: Troubleshooting

#### If Authentication Still Fails:

1. **Check Browser Console** (F12 → Console tab):
   - Look for errors like "Failed to fetch" or CORS errors
   - Look for "Supabase signup error:" or "Supabase signin error:"

2. **Check Supabase Logs**:
   - Go to Supabase Dashboard → Logs → Auth Logs
   - See if requests are reaching Supabase

3. **Verify Environment Variables**:
   - In Vercel, go to Settings → Environment Variables
   - Click "Redeploy" after adding/changing variables

4. **Check Supabase Project Status**:
   - Ensure project is not paused
   - Check if API is accessible

#### If Razorpay Doesn't Appear:

1. **Check Browser Console**:
   - Look for "Failed to load Razorpay script"
   - Look for "Razorpay not loaded"
   - Look for "Create order failed"

2. **Verify Razorpay Keys**:
   - Ensure `NEXT_PUBLIC_RAZORPAY_KEY_ID` is set
   - Ensure `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are set
   - Keys should start with `rzp_live_` for production

3. **Check Network Tab** (F12 → Network):
   - Look for failed requests to `/api/payment/razorpay/create-order`
   - Check response for error messages

#### If Social Login Doesn't Work:

1. **Configure OAuth Providers in Supabase**:
   - Go to Authentication → Providers
   - Enable Google and Azure (Microsoft)
   - Add required credentials

2. **Set Redirect URLs**:
   - In Google Cloud Console: Add `https://nvzqwtaglkhsdqfobmr.supabase.co/auth/v1/callback`
   - In Azure Portal: Add same URL

## What Changed in Latest Code

1. **Better Error Handling**:
   - Added console.error logs for debugging
   - More descriptive error messages
   - Better user feedback

2. **Social Login**:
   - Google OAuth button
   - Microsoft OAuth button
   - Proper redirect handling

3. **Payment Improvements**:
   - Better error messages
   - Check if Razorpay script loaded
   - More detailed logging

## Safety Notes

✅ **Styling is preserved** - No changes to CSS or layout
✅ **All features intact** - Download section, pricing, etc.
✅ **Better debugging** - Console logs help identify issues
✅ **Backward compatible** - Works with existing database

## Next Steps After Successful Deployment

1. Test all features thoroughly
2. Monitor Supabase logs for any auth issues
3. Check Razorpay dashboard for test payments
4. Configure OAuth providers for social login
5. Consider disabling email confirmation in Supabase for easier onboarding

## Need Help?

If issues persist after deployment:
1. Share browser console errors (F12 → Console)
2. Share Supabase auth logs
3. Verify all environment variables are set correctly
4. Check if Supabase project is active and accessible
