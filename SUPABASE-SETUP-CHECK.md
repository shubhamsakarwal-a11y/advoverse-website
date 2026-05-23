# Supabase Setup Verification Guide

## Your Supabase Project Details

- **Project URL**: https://nvzqwtaglkhsdqfobmr.supabase.co
- **Dashboard**: https://supabase.com/dashboard/project/nvzqwtaglkhsdqfobmr

## Critical Checks

### 1. Is Your Supabase Project Active?

1. Go to: https://supabase.com/dashboard/project/nvzqwtaglkhsdqfobmr
2. Check if you see "Project is paused" banner
3. If paused, click "Restore project"

### 2. Is Email Authentication Enabled?

1. Go to: Authentication → Providers
2. Find "Email" provider
3. Make sure it's **Enabled** (toggle should be ON)

### 3. Email Confirmation Settings

1. Go to: Authentication → Settings → Email Auth
2. Check "Confirm email" setting:
   - **If ON**: Users must verify email before logging in
   - **If OFF**: Users can login immediately after registration

**For Testing**: Turn OFF email confirmation to make testing easier

### 4. Check Database Tables

Your app needs these tables:

1. Go to: Table Editor
2. Check if these tables exist:
   - `profiles` (for user data)
   - `orders` (for payment records)
   - `licenses` (for license keys)

**If tables are missing**, you need to run database migrations.

### 5. Test Supabase Connection

Open browser console (F12) and run this:

```javascript
// Test if Supabase is reachable
fetch('https://nvzqwtaglkhsdqfobmr.supabase.co/rest/v1/', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52enF4d3RhZ2xraHNkcWZvYm1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNTg3NTAsImV4cCI6MjA5NDkzNDc1MH0.lwbG0ombv3kn0A95SjyJPFesGNSWgTBnbMTwqdbN3Jw'
  }
})
.then(r => r.json())
.then(d => console.log('Supabase is reachable:', d))
.catch(e => console.error('Supabase connection failed:', e));
```

**Expected Result**: Should see "Supabase is reachable" with some data
**If Error**: Supabase project might be paused or keys are wrong

### 6. Check Auth Logs

1. Go to: Logs → Auth Logs
2. Try to register on your website
3. Check if you see the registration attempt in logs
4. Look for error messages

### 7. Row Level Security (RLS)

If tables exist but queries fail:

1. Go to: Authentication → Policies
2. Check if RLS policies are set up for:
   - `profiles` table
   - `orders` table
   - `licenses` table

**Common Issue**: RLS is too restrictive and blocks legitimate queries

### 8. CORS Settings

Supabase should allow requests from your domain:

1. Go to: Settings → API
2. Check "API Settings"
3. Your domain `https://advoverse.com` should be allowed

## Common Supabase Errors and Solutions

### Error: "Failed to fetch"
**Cause**: Can't reach Supabase API
**Solutions**:
- Check if project is paused
- Verify NEXT_PUBLIC_SUPABASE_URL is correct
- Check internet connection
- Check browser console for CORS errors

### Error: "Invalid API key"
**Cause**: Wrong Supabase keys in environment variables
**Solutions**:
- Verify NEXT_PUBLIC_SUPABASE_ANON_KEY matches dashboard
- Go to Settings → API → Project API keys
- Copy the "anon public" key
- Update in Vercel environment variables

### Error: "Email not confirmed"
**Cause**: Email confirmation is required but user didn't verify
**Solutions**:
- Turn OFF email confirmation in Supabase
- Or tell users to check their email inbox

### Error: "User already registered"
**Cause**: Email already exists in database
**Solutions**:
- Try logging in instead of registering
- Or use a different email
- Or delete the user from Supabase dashboard

### Error: "Invalid login credentials"
**Cause**: Wrong email or password
**Solutions**:
- Check if user is registered
- Check if email confirmation is required
- Try password reset

## Database Schema Check

Your app expects these tables with these columns:

### `profiles` table:
```sql
- id (uuid, primary key, references auth.users)
- name (text)
- email (text)
- phone (text, nullable)
- bar_number (text, nullable)
- created_at (timestamp)
```

### `orders` table:
```sql
- id (bigint, primary key)
- user_id (uuid, references auth.users)
- plan_name (text)
- amount (integer)
- currency (text)
- payment_gateway (text)
- gateway_order_id (text)
- gateway_payment_id (text, nullable)
- status (text)
- created_at (timestamp)
```

### `licenses` table:
```sql
- id (bigint, primary key)
- user_id (uuid, references auth.users)
- order_id (bigint, references orders)
- license_key (text, unique)
- plan_name (text)
- status (text)
- issued_at (timestamp)
- expires_at (timestamp, nullable)
```

## Quick Test Script

Run this in your browser console on https://advoverse.com:

```javascript
// Test Supabase client creation
const { createClient } = window.supabase || {};
if (!createClient) {
  console.error('Supabase client not loaded');
} else {
  console.log('✅ Supabase client available');
}

// Test environment variables
console.log('SUPABASE_URL:', 'https://nvzqwtaglkhsdqfobmr.supabase.co');
console.log('Check if this matches your Vercel env var');
```

## Need Database Migrations?

If tables are missing, you need to create them. Check if you have:
- `prisma/schema.prisma` file
- Or SQL migration files in `supabase/migrations/`

Let me know if you need help setting up the database schema!

## OAuth Setup (For Social Login)

### Google OAuth:
1. Go to: https://console.cloud.google.com
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `https://nvzqwtaglkhsdqfobmr.supabase.co/auth/v1/callback`
4. Copy Client ID and Secret
5. Add to Supabase → Authentication → Providers → Google

### Microsoft OAuth:
1. Go to: https://portal.azure.com
2. Register an app
3. Add redirect URI: `https://nvzqwtaglkhsdqfobmr.supabase.co/auth/v1/callback`
4. Copy Application (client) ID and Secret
5. Add to Supabase → Authentication → Providers → Azure

---

**Next Steps**: After verifying all these settings, try registering again and check the browser console for specific error messages!
