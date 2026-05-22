# 🌐 GoDaddy DNS Setup for Advoverse.com

## Quick Setup Guide (5 Minutes)

### **Step 1: Deploy to Vercel First**

Before touching GoDaddy, you need to deploy your website:

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "Add New Project"
3. Import your `advoverse-website` repository
4. Add all environment variables from `.env.local`
5. Click Deploy
6. Wait for deployment to complete

You'll get a URL like: `advoverse-website.vercel.app`

---

### **Step 2: Add Domain in Vercel**

1. In Vercel, go to your project
2. Click **Settings** → **Domains**
3. Click **Add Domain**
4. Enter: `advoverse.com`
5. Click **Add**
6. Vercel will show you DNS configuration options

---

### **Step 3: Configure DNS in GoDaddy**

#### **Login to GoDaddy:**
1. Go to [godaddy.com](https://godaddy.com)
2. Sign in to your account
3. Go to **My Products**
4. Find `advoverse.com` and click **DNS** or **Manage DNS**

#### **Update DNS Records:**

**Option A: CNAME Method (Recommended - Easier)**

Delete existing A records for `@` and `www`, then add:

```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
TTL: 600 seconds (or 10 minutes)

Type: CNAME  
Name: www
Value: cname.vercel-dns.com
TTL: 600 seconds
```

**Option B: A Record Method (Alternative)**

If CNAME doesn't work for `@`, use A records:

```
Type: A
Name: @
Value: 76.76.21.21
TTL: 600 seconds

Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 600 seconds
```

> **Note:** The IP address `76.76.21.21` is Vercel's Anycast IP. Check Vercel dashboard for the current IP if this doesn't work.

---

### **Step 4: Wait for DNS Propagation**

- **Typical time:** 10-30 minutes
- **Maximum time:** 48 hours (rare)
- **Check status:** [dnschecker.org](https://dnschecker.org)

While waiting, you can:
- Test your site on the Vercel URL
- Set up payment gateway webhooks
- Configure email service

---

### **Step 5: Verify It's Working**

1. Open `https://advoverse.com` in your browser
2. Check if the site loads with your new design
3. Verify SSL certificate (should show 🔒 padlock)
4. Test on mobile device

---

## 🔍 **Visual Guide: Where to Find Things in GoDaddy**

### **Finding DNS Management:**

```
GoDaddy Dashboard
  └─ My Products
      └─ Domains
          └─ advoverse.com
              └─ [DNS] or [Manage DNS] button
                  └─ DNS Management page
                      └─ Add/Edit Records here
```

### **What Your DNS Records Should Look Like:**

```
┌─────────┬──────┬─────────────────────────┬─────┐
│ Type    │ Name │ Value                   │ TTL │
├─────────┼──────┼─────────────────────────┼─────┤
│ CNAME   │ @    │ cname.vercel-dns.com    │ 600 │
│ CNAME   │ www  │ cname.vercel-dns.com    │ 600 │
└─────────┴──────┴─────────────────────────┴─────┘
```

---

## ⚠️ **Common Issues & Solutions**

### **Issue 1: "CNAME not allowed for root domain"**

**Solution:** Use A record instead:
```
Type: A
Name: @
Value: 76.76.21.21
TTL: 600
```

### **Issue 2: "Domain already in use"**

**Solution:** 
- Remove the domain from any other Vercel projects
- Wait 5 minutes and try again

### **Issue 3: "SSL Certificate Pending"**

**Solution:**
- This is normal - Vercel auto-provisions SSL
- Usually takes 5-10 minutes
- Don't worry if you see "Not Secure" initially

### **Issue 4: "Site not loading after 24 hours"**

**Solution:**
1. Check DNS records match exactly
2. Clear browser cache (Ctrl + Shift + Delete)
3. Try incognito/private mode
4. Check [dnschecker.org](https://dnschecker.org)
5. Contact GoDaddy support if DNS not propagating

### **Issue 5: "Old website still showing"**

**Solution:**
- Clear browser cache
- Wait for DNS propagation
- Check if old hosting is still active (disable it)

---

## 📱 **Testing Checklist**

After DNS is connected, test:

- [ ] `https://advoverse.com` loads correctly
- [ ] `https://www.advoverse.com` loads correctly
- [ ] SSL certificate is active (🔒 padlock shows)
- [ ] All pages work (Features, Plans, Contact)
- [ ] Login/Register modals work
- [ ] Payment buttons work
- [ ] Mobile responsive design looks good
- [ ] Test on Chrome, Firefox, Safari
- [ ] Test on mobile device

---

## 🎯 **What Happens After DNS is Connected?**

1. **Automatic SSL:** Vercel provisions free SSL certificate
2. **Global CDN:** Your site loads fast worldwide
3. **Auto-deployments:** Push to GitHub = auto-deploy to live site
4. **Analytics:** View traffic in Vercel dashboard

---

## 📊 **DNS Propagation Checker**

Use these tools to check if DNS has propagated:

- [dnschecker.org](https://dnschecker.org)
- [whatsmydns.net](https://whatsmydns.net)
- Command line: `nslookup advoverse.com`

---

## 🔐 **Security Notes**

- ✅ SSL/HTTPS is automatic with Vercel
- ✅ DDoS protection included
- ✅ Automatic security headers
- ✅ Environment variables are encrypted

---

## 💡 **Pro Tips**

1. **Keep TTL low (600s) initially** - easier to fix mistakes
2. **After everything works, increase TTL to 3600s** - better performance
3. **Always test on Vercel URL first** before connecting domain
4. **Don't delete old DNS records** until new ones are working
5. **Take screenshots** of old DNS settings before changing

---

## 📞 **Support Resources**

- **Vercel Support:** [vercel.com/support](https://vercel.com/support)
- **GoDaddy Support:** [godaddy.com/help](https://godaddy.com/help)
- **DNS Help:** [vercel.com/docs/custom-domains](https://vercel.com/docs/custom-domains)

---

## ✅ **Summary: 3 Simple Steps**

1. **Deploy to Vercel** → Get your site online
2. **Add domain in Vercel** → Tell Vercel about advoverse.com
3. **Update GoDaddy DNS** → Point domain to Vercel

That's it! Your website will be live at **https://advoverse.com** 🚀
