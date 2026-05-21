-- ─────────────────────────────────────────────────────────────
--  ADVOVERSE — Supabase Database Schema
--  Run this in: Supabase Dashboard → SQL Editor → New Query
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
