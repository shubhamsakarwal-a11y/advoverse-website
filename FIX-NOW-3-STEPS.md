# 🚨 FIX "FAILED TO FETCH" ERROR - 3 STEPS

## The Problem
Your website is using the **WRONG Supabase URL**:
- ❌ Using: `nvzqwtaglkhsdqfobmr` (missing "x")
- ✅ Should be: `nvzqxwtaglkhsdqfobmr` (with "x")

---

## 🔧 THE FIX (Takes 5 Minutes)

### STEP 1: Delete Old Environment Variable

1. Go to: https://vercel.com/dashboard
2. Click your **advoverse-website** project
3. Click **Settings** → **Environment Variables**
4. Find `NEXT_PUBLIC_SUPABASE_URL`
5. Click **3 dots** → **Delete**
6. Confirm deletion

---

### STEP 2: Add Correct Environment Variable

1. Still in Environment Variables page
2. Click **Add New**
3. Enter EXACTLY:
   ```
   Name: NEXT_PUBLIC_SUPABASE_URL
   Value: https://nvzqxwtaglkhsdqfobmr.supabase.co
   ```
   **⚠️ IMPORTANT**: Copy the value above - it has "x" after "nvzq"
4. Check ALL environments: Production, Preview, Development
5. Click **Save**

---

### STEP 3: Force Rebuild (Clear Cache)

1. Go to **Deployments** tab
2. Click the **latest deployment** (top one)
3. Click **3 dots menu** (⋮) → **Redeploy**
4. **✅ CHECK THIS BOX**: "Clear build cache and redeploy"
5. Click **Redeploy**
6. Wait 2-3 minutes for deployment to complete

---

## ✅ TEST IT

1. Go to https://advoverse.com
2. Press **F12** to open console
3. Click any pricing plan
4. Look for this in console:
   ```
   === Supabase Client Debug ===
   Supabase URL: https://nvzqxwtaglkhsdqfobmr.supabase.co
   ```
5. **Verify it has "x"**: `nvzqxwtaglkhsdqfobmr` ✅

6. Try to register:
   - Fill the form
   - Click "Create Account"
   - Should work now!

---

## 🎯 BONUS FIX: Disable Email Confirmation

**To let users register without waiting for email:**

1. Go to: https://supabase.com/dashboard/project/nvzqxwtaglkhsdqfobmr
2. Click **Authentication** → **Settings**
3. Find **"Enable email confirmations"**
4. **Turn it OFF**
5. Click **Save**

**Result**: Users can login immediately after registration!

---

## 🎯 BONUS FIX 2: Update Site URL

**To make email links work correctly:**

1. In Supabase dashboard
2. Click **Authentication** → **URL Configuration**
3. Change **Site URL** from `http://localhost:3000` to:
   ```
   https://advoverse.com
   ```
4. Add **Redirect URLs**:
   ```
   https://advoverse.com/auth/callback
   https://advoverse.com
   ```
5. Click **Save**

---

## 📞 Still Not Working?

**Check if Supabase project is paused:**
1. Go to: https://supabase.com/dashboard/project/nvzqxwtaglkhsdqfobmr
2. Look for "Project is paused" banner
3. Click **"Restore project"** if paused

**Check which deployment is in production:**
1. Go to Vercel → Deployments
2. Find the one with **"PRODUCTION"** badge
3. Should be commit `9cf3387`
4. If not, click that deployment → **Promote to Production**

---

## ✅ Success!

You'll know it's fixed when:
- ✅ Console shows correct URL with "x"
- ✅ No more "Failed to fetch" errors
- ✅ Users can register successfully
- ✅ Users can login

---

**Need help?** Check `CRITICAL-FIX-FAILED-TO-FETCH.md` for detailed troubleshooting.
