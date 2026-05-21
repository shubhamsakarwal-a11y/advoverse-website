# Advoverse Website

Landing page + subscription + license key delivery for [advoverse.com](https://advoverse.com)

**Stack:** Next.js 14 · Supabase (auth + DB) · Razorpay · Stripe · Resend (email) · Vercel (hosting)

**Monthly fixed cost: ₹0** — you only pay payment gateway fees when you earn.

---

## Setup Guide (Do This Once)

### 1. Create Accounts (all free)

| Service | URL | What you need |
|---|---|---|
| Supabase | supabase.com | Project URL, Anon Key, Service Role Key |
| Vercel | vercel.com | Connect your GitHub |
| Razorpay | razorpay.com | Key ID, Key Secret |
| Stripe | stripe.com | Publishable Key, Secret Key, Webhook Secret |
| Resend | resend.com | API Key |

---

### 2. Set Up Supabase Database

1. Go to **Supabase Dashboard → SQL Editor → New Query**
2. Paste the contents of `supabase/schema.sql`
3. Click **Run**

> Optional: In Supabase → Auth → Email, you can turn off "Confirm email" for easier testing.

---

### 3. Configure Environment Variables

Copy `.env.local` and fill in your real keys:

```bash
# Already created at .env.local — just fill in the values
```

For Vercel deployment, add the same keys in:
**Vercel Dashboard → Your Project → Settings → Environment Variables**

---

### 4. Push to GitHub

```bash
cd C:\Users\Admin\Desktop\advoverse-website
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/shubhamsakarwal-a11y/advoverse-website.git
git push -u origin main
```

---

### 5. Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your `advoverse-website` GitHub repo
3. Add all environment variables from `.env.local`
4. Click **Deploy** — Vercel auto-builds and gives you a URL

---

### 6. Connect Your Domain (advoverse.com)

In **Vercel → Project → Settings → Domains**, add `advoverse.com`

Vercel will show you DNS records. In **GoDaddy → DNS Management**:
- Delete existing A record (or update it)
- Add the CNAME or A record Vercel provides
- SSL is automatic — takes ~10 minutes

---

### 7. Set Up Stripe Webhook

After deploying, go to **Stripe Dashboard → Developers → Webhooks → Add endpoint**:
- URL: `https://advoverse.com/api/payment/stripe/webhook`
- Events: `checkout.session.completed`
- Copy the **Webhook Secret** → add to `STRIPE_WEBHOOK_SECRET` env var

---

### 8. Add Your App Download URL

Once your Windows installer is ready (upload to GitHub Releases or Google Drive):
- Add the direct download link to `APP_DOWNLOAD_URL` in your Vercel env vars

---

## Local Development

```bash
npm install
npm run dev
# Open http://localhost:3000
```

---

## How to See Your Orders & Users

Open **Supabase Dashboard → Table Editor**:
- `profiles` — all registered users
- `orders` — all payment attempts
- `licenses` — all issued license keys

No admin panel needed — Supabase gives you a full GUI.

---

## Support

support@advoverse.in
