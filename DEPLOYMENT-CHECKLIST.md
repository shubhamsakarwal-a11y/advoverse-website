# 🚀 Advoverse Website - GoDaddy Domain Integration Checklist

## ✅ **What's Already Done**

- ✅ Website design implemented with traditional legal style
- ✅ Supabase configured (database + auth)
- ✅ GitHub repository created
- ✅ Payment integration code ready (Razorpay, Stripe)
- ✅ Email service setup (Resend)
- ✅ Environment variables configured in `.env.local`

---

## 📋 **Steps to Connect Your GoDaddy Domain**

### **Step 1: Deploy to Vercel** (Recommended - Free Hosting)

1. **Push latest changes to GitHub:**
   ```bash
   cd C:\Users\Admin\Desktop\advoverse-website
   git add .
   git commit -m "Updated to traditional legal design"
   git push origin main
   ```

2. **Deploy on Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "Add New Project"
   - Import `advoverse-website` repository
   - **Add Environment Variables** (copy from `.env.local`):
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `RAZORPAY_KEY_ID` (when you have it)
     - `RAZORPAY_KEY_SECRET` (when you have it)
     - `NEXT_PUBLIC_RAZORPAY_KEY_ID` (when you have it)
     - `STRIPE_SECRET_KEY` (when you have it)
     - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (when you have it)
     - `STRIPE_WEBHOOK_SECRET` (after webhook setup)
     - `RESEND_API_KEY` (when you have it)
     - `EMAIL_FROM=Advoverse <support@advoverse.com>`
     - `ADMIN_EMAIL` (your email)
     - `NEXT_PUBLIC_APP_URL=https://advoverse.com`
   - Click **Deploy**
   - Wait 2-3 minutes for build to complete

3. **You'll get a Vercel URL** like: `advoverse-website.vercel.app`

---

### **Step 2: Connect Domain on GoDaddy**

1. **In Vercel Dashboard:**
   - Go to your project → **Settings** → **Domains**
   - Click "Add Domain"
   - Enter: `advoverse.com`
   - Also add: `www.advoverse.com`
   - Vercel will show you DNS records to add

2. **In GoDaddy Dashboard:**
   - Go to **My Products** → **Domains** → Click on `advoverse.com`
   - Click **DNS** or **Manage DNS**
   - **Delete or update existing A records**
   - **Add the records Vercel provides:**
     
     **Option A: CNAME Method (Recommended)**
     ```
     Type: CNAME
     Name: @
     Value: cname.vercel-dns.com
     TTL: 600 seconds
     
     Type: CNAME
     Name: www
     Value: cname.vercel-dns.com
     TTL: 600 seconds
     ```
     
     **Option B: A Record Method**
     ```
     Type: A
     Name: @
     Value: 76.76.21.21 (Vercel's IP - check Vercel dashboard for current IP)
     TTL: 600 seconds
     ```

3. **Wait for DNS Propagation:**
   - Usually takes 10-30 minutes
   - Can take up to 48 hours in rare cases
   - Check status: [dnschecker.org](https://dnschecker.org)

4. **SSL Certificate:**
   - Vercel automatically provisions SSL (HTTPS)
   - No action needed - it's automatic!

---

### **Step 3: Configure Payment Webhooks**

**After domain is live:**

1. **Razorpay Webhook:**
   - Go to Razorpay Dashboard → **Settings** → **Webhooks**
   - Add webhook URL: `https://advoverse.com/api/payment/razorpay/webhook`
   - Select events: `payment.captured`, `payment.failed`
   - Copy webhook secret → Add to Vercel env vars

2. **Stripe Webhook:**
   - Go to Stripe Dashboard → **Developers** → **Webhooks**
   - Add endpoint: `https://advoverse.com/api/payment/stripe/webhook`
   - Select event: `checkout.session.completed`
   - Copy webhook secret → Add to Vercel env vars as `STRIPE_WEBHOOK_SECRET`

---

## 🔧 **Before Going Live - Complete These:**

### **1. Payment Gateway Setup**

- [ ] **Razorpay Account:**
  - Sign up at [razorpay.com](https://razorpay.com)
  - Complete KYC verification
  - Get API keys from Dashboard → Settings → API Keys
  - Add to Vercel environment variables

- [ ] **Stripe Account:**
  - Sign up at [stripe.com](https://stripe.com)
  - Complete business verification
  - Get API keys from Dashboard → Developers → API Keys
  - Add to Vercel environment variables

### **2. Email Service Setup**

- [ ] **Resend Account:**
  - Sign up at [resend.com](https://resend.com)
  - Verify your domain `advoverse.com` for sending emails
  - Get API key
  - Add to Vercel environment variables

### **3. Update Contact Information**

- [ ] Replace `+91 XXXXX XXXXX` with real phone number in:
  - `app/page.tsx` (Contact section)

### **4. Test Everything**

- [ ] User registration works
- [ ] User login works
- [ ] Payment flow works (Razorpay)
- [ ] Payment flow works (Stripe)
- [ ] License key email delivery works
- [ ] All links work correctly
- [ ] Mobile responsive design looks good
- [ ] Test on different browsers

---

## 🎯 **Alternative Hosting Options**

If you don't want to use Vercel:

### **Option 1: Netlify** (Similar to Vercel)
- Free tier available
- Easy GitHub integration
- Similar domain connection process

### **Option 2: Traditional Hosting (GoDaddy/Hostinger)**
- Need Node.js hosting
- More complex setup
- Usually costs money
- Not recommended for Next.js

---

## 📊 **Post-Deployment Monitoring**

### **Check These Regularly:**

1. **Supabase Dashboard:**
   - Monitor user registrations
   - Check order records
   - View issued licenses

2. **Vercel Analytics:**
   - Page views
   - Performance metrics
   - Error logs

3. **Payment Dashboards:**
   - Razorpay: Transaction status
   - Stripe: Payment records

---

## 🆘 **Troubleshooting**

### **Domain not working after 24 hours?**
- Check DNS records in GoDaddy match Vercel's requirements
- Clear browser cache
- Try incognito/private mode
- Check [dnschecker.org](https://dnschecker.org)

### **Build failing on Vercel?**
- Check build logs in Vercel dashboard
- Ensure all environment variables are set
- Check for TypeScript errors

### **Payments not working?**
- Verify webhook URLs are correct
- Check API keys are in production mode (not test mode)
- Check Vercel function logs for errors

---

## ✨ **Your Website is Ready!**

The design is complete and matches your traditional legal style HTML. Once you:
1. Deploy to Vercel
2. Connect your GoDaddy domain
3. Configure payment gateways

Your website will be live at **https://advoverse.com** 🎉

---

## 📞 **Need Help?**

- Vercel Docs: [vercel.com/docs](https://vercel.com/docs)
- Next.js Docs: [nextjs.org/docs](https://nextjs.org/docs)
- Supabase Docs: [supabase.com/docs](https://supabase.com/docs)
