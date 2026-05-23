# ⚠️ CRITICAL: Database Setup Required!

## Why Authentication is Failing

Your Supabase database is missing the required tables! The authentication code is working, but it can't save user data because the tables don't exist.

## What You Need to Do

### Step 1: Go to Supabase SQL Editor

1. Open: https://supabase.com/dashboard/project/nvzqwtaglkhsdqfobmr
2. Click "SQL Editor" in the left sidebar
3. Click "New Query"

### Step 2: Run the Database Schema

Copy the ENTIRE contents of `supabase/schema.sql` file and paste it into the SQL Editor, then click "Run".

**Or copy this:**

```sql
-- ─────────────────────────────────────────────────────────────
--  ADVOVERSE — Supabase Database Schema
-- ─────────────────────────────────────────────────────────────

-- Profiles table (extends Supabase auth.users)
create table if not exists public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  name        text not null,
  phone       text,
  bar_number  text,
  created_at  timestamptz default now()
);

-- Orders table
create table if not exists public.orders (
  id                  bigint generated always as identity primary key,
  user_id             uuid references auth.users(id) on delete cascade not null,
  plan_name           text not null,
  amount              integer not null,  -- in paise
  currency            text not null default 'INR',
  payment_gateway     text not null,     -- 'razorpay' | 'stripe'
  gateway_order_id    text,              -- razorpay order id / stripe session id
  payment_id          text,              -- razorpay payment id / stripe payment intent
  status              text not null default 'pending', -- pending | paid | failed
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- Licenses table
create table if not exists public.licenses (
  id           bigint generated always as identity primary key,
  user_id      uuid references auth.users(id) on delete cascade not null,
  order_id     bigint references public.orders(id) unique not null,
  license_key  text unique not null,
  plan_name    text not null,
  expires_at   timestamptz,             -- null = lifetime
  is_active    boolean default true,
  email_sent   boolean default false,
  created_at   timestamptz default now()
);

-- Enable Row Level Security
alter table public.profiles  enable row level security;
alter table public.orders    enable row level security;
alter table public.licenses  enable row level security;

-- Profiles: users can read/update their own profile
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Orders: users can view their own orders
create policy "Users can view own orders"
  on public.orders for select using (auth.uid() = user_id);

-- Licenses: users can view their own licenses
create policy "Users can view own licenses"
  on public.licenses for select using (auth.uid() = user_id);

-- Auto-create profile when a user registers
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

### Step 3: Verify Tables Were Created

1. Click "Table Editor" in left sidebar
2. You should now see 3 tables:
   - ✅ `profiles`
   - ✅ `orders`
   - ✅ `licenses`

### Step 4: Test Registration Again

1. Go to https://advoverse.com
2. Click any pricing plan
3. Try to register with a test email
4. Should work now! ✅

## What This Schema Does

### 1. **profiles** table
- Stores user information (name, phone, bar number)
- Automatically created when user registers
- Linked to Supabase auth.users

### 2. **orders** table
- Stores payment orders
- Tracks Razorpay/Stripe transactions
- Links users to their purchases

### 3. **licenses** table
- Stores license keys
- Generated after successful payment
- Sent to user's email

### 4. **Row Level Security (RLS)**
- Users can only see their own data
- Prevents unauthorized access
- Secure by default

### 5. **Auto-create Profile Trigger**
- When user registers, profile is auto-created
- Uses name from registration form
- Falls back to email username if no name

## Why This Was Missing

The database schema needs to be run manually in Supabase. It's not automatically created when you deploy the code.

## After Running the Schema

Your website will be fully functional:
- ✅ User registration will work
- ✅ User login will work
- ✅ Payment orders will be saved
- ✅ License keys will be generated
- ✅ Users can see their purchase history

## Troubleshooting

### If you get "relation already exists" errors:
- This is OK! It means some tables already exist
- The `if not exists` clause prevents errors
- Just continue with the rest of the script

### If you get permission errors:
- Make sure you're logged into the correct Supabase project
- Check that you have admin access

### If tables are created but registration still fails:
- Check browser console (F12) for specific errors
- Verify environment variables in Vercel
- Check Supabase Auth Logs

## Next Steps After Database Setup

1. ✅ Run the schema in Supabase SQL Editor
2. ✅ Verify tables exist in Table Editor
3. ✅ Test registration on your website
4. ✅ Test payment flow
5. ✅ Configure OAuth for social login (optional)

---

**This is the most likely reason your authentication is failing!** Run the schema and try again.
