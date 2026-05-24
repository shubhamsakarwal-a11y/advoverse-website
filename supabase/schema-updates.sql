-- ═══════════════════════════════════════════════════════════════
--  ADVOVERSE - DATABASE SCHEMA UPDATES
--  Phase 1: Machine Activation & Auto-Renewal System
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────
-- 1. UPDATE LICENSES TABLE - Add Auto-Renewal Fields
-- ───────────────────────────────────────────────────────────────
ALTER TABLE public.licenses 
ADD COLUMN IF NOT EXISTS auto_renewal_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS razorpay_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS payment_method_saved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_renewal_attempt TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS renewal_failure_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS duration_type TEXT DEFAULT 'monthly', -- 'monthly', 'quarterly', 'yearly'
ADD COLUMN IF NOT EXISTS grace_period_until TIMESTAMPTZ;

-- ───────────────────────────────────────────────────────────────
-- 2. LICENSE ACTIVATIONS TABLE - Track Machine Usage
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.license_activations (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  license_id BIGINT REFERENCES public.licenses(id) ON DELETE CASCADE NOT NULL,
  machine_id TEXT NOT NULL,           -- Hardware ID from desktop app
  machine_name TEXT,                  -- User-friendly name (e.g., "Rajesh-PC")
  os_version TEXT,                    -- e.g., "Windows 11 Pro"
  ip_address TEXT,                    -- IP address (admin only)
  location TEXT,                      -- Derived from IP (admin only)
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  deactivated_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_license_activations_license_id ON public.license_activations(license_id);
CREATE INDEX IF NOT EXISTS idx_license_activations_machine_id ON public.license_activations(machine_id);
CREATE INDEX IF NOT EXISTS idx_license_activations_active ON public.license_activations(license_id, is_active);

-- ───────────────────────────────────────────────────────────────
-- 3. TRANSFER REQUESTS TABLE - Machine Transfer Approval System
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.transfer_requests (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  license_id BIGINT REFERENCES public.licenses(id) ON DELETE CASCADE NOT NULL,
  from_machine_id TEXT,               -- Current active machine
  from_machine_name TEXT,
  to_machine_id TEXT NOT NULL,        -- New machine requesting access
  to_machine_name TEXT,
  to_ip_address TEXT,                 -- IP of new machine (admin only)
  to_location TEXT,                   -- Location of new machine (admin only)
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,    -- 24 hours from request
  status TEXT DEFAULT 'pending',      -- 'pending', 'approved', 'denied', 'expired'
  approval_token TEXT UNIQUE NOT NULL, -- Secure token for email link
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_transfer_requests_license_id ON public.transfer_requests(license_id);
CREATE INDEX IF NOT EXISTS idx_transfer_requests_token ON public.transfer_requests(approval_token);
CREATE INDEX IF NOT EXISTS idx_transfer_requests_status ON public.transfer_requests(status);

-- ───────────────────────────────────────────────────────────────
-- 4. BLOCKED MACHINES TABLE - Permanently Denied Machines
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.blocked_machines (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  license_id BIGINT REFERENCES public.licenses(id) ON DELETE CASCADE NOT NULL,
  machine_id TEXT NOT NULL,
  machine_name TEXT,
  blocked_at TIMESTAMPTZ DEFAULT NOW(),
  blocked_by TEXT DEFAULT 'user',     -- 'user' or 'admin'
  reason TEXT,
  can_unblock BOOLEAN DEFAULT true,   -- User can unblock later
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_blocked_machines_license_id ON public.blocked_machines(license_id);
CREATE INDEX IF NOT EXISTS idx_blocked_machines_machine_id ON public.blocked_machines(machine_id);

-- ───────────────────────────────────────────────────────────────
-- 5. RENEWAL HISTORY TABLE - Track All Renewal Attempts
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.renewal_history (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  license_id BIGINT REFERENCES public.licenses(id) ON DELETE CASCADE NOT NULL,
  attempted_at TIMESTAMPTZ DEFAULT NOW(),
  success BOOLEAN NOT NULL,
  amount INTEGER NOT NULL,            -- in paise
  razorpay_payment_id TEXT,
  razorpay_subscription_id TEXT,
  failure_reason TEXT,
  retry_attempt INTEGER DEFAULT 0,    -- 0 = first attempt, 1-5 = retries
  new_expiry_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_renewal_history_license_id ON public.renewal_history(license_id);
CREATE INDEX IF NOT EXISTS idx_renewal_history_attempted_at ON public.renewal_history(attempted_at);

-- ───────────────────────────────────────────────────────────────
-- 6. TRANSFER COOLDOWN TABLE - Enforce 24-Hour Transfer Limit
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.transfer_cooldowns (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  license_id BIGINT REFERENCES public.licenses(id) ON DELETE CASCADE NOT NULL,
  last_transfer_at TIMESTAMPTZ NOT NULL,
  next_transfer_allowed_at TIMESTAMPTZ NOT NULL, -- last_transfer_at + 24 hours
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_transfer_cooldowns_license_id ON public.transfer_cooldowns(license_id);

-- ───────────────────────────────────────────────────────────────
-- 7. ROW LEVEL SECURITY POLICIES
-- ───────────────────────────────────────────────────────────────

-- Enable RLS on new tables
ALTER TABLE public.license_activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renewal_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_cooldowns ENABLE ROW LEVEL SECURITY;

-- Users can view their own license activations
CREATE POLICY "Users can view own license activations"
  ON public.license_activations FOR SELECT
  USING (
    license_id IN (
      SELECT id FROM public.licenses WHERE user_id = auth.uid()
    )
  );

-- Users can view their own transfer requests
CREATE POLICY "Users can view own transfer requests"
  ON public.transfer_requests FOR SELECT
  USING (
    license_id IN (
      SELECT id FROM public.licenses WHERE user_id = auth.uid()
    )
  );

-- Users can view their own blocked machines
CREATE POLICY "Users can view own blocked machines"
  ON public.blocked_machines FOR SELECT
  USING (
    license_id IN (
      SELECT id FROM public.licenses WHERE user_id = auth.uid()
    )
  );

-- Users can view their own renewal history
CREATE POLICY "Users can view own renewal history"
  ON public.renewal_history FOR SELECT
  USING (
    license_id IN (
      SELECT id FROM public.licenses WHERE user_id = auth.uid()
    )
  );

-- ───────────────────────────────────────────────────────────────
-- 8. HELPER FUNCTIONS
-- ───────────────────────────────────────────────────────────────

-- Function to check if transfer is allowed (not in cooldown)
CREATE OR REPLACE FUNCTION public.can_transfer_license(p_license_id BIGINT)
RETURNS BOOLEAN AS $$
DECLARE
  v_next_allowed TIMESTAMPTZ;
BEGIN
  SELECT next_transfer_allowed_at INTO v_next_allowed
  FROM public.transfer_cooldowns
  WHERE license_id = p_license_id;
  
  IF v_next_allowed IS NULL THEN
    RETURN true; -- No cooldown record, first transfer
  END IF;
  
  RETURN NOW() >= v_next_allowed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active machine for a license
CREATE OR REPLACE FUNCTION public.get_active_machine(p_license_id BIGINT)
RETURNS TABLE(machine_id TEXT, machine_name TEXT, activated_at TIMESTAMPTZ) AS $$
BEGIN
  RETURN QUERY
  SELECT la.machine_id, la.machine_name, la.activated_at
  FROM public.license_activations la
  WHERE la.license_id = p_license_id
    AND la.is_active = true
  ORDER BY la.activated_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if machine is blocked
CREATE OR REPLACE FUNCTION public.is_machine_blocked(p_license_id BIGINT, p_machine_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_blocked BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.blocked_machines
    WHERE license_id = p_license_id
      AND machine_id = p_machine_id
  ) INTO v_blocked;
  
  RETURN v_blocked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ───────────────────────────────────────────────────────────────
-- 9. ADMIN USER SETUP
-- ───────────────────────────────────────────────────────────────

-- Create admin_users table for dashboard access
CREATE TABLE IF NOT EXISTS public.admin_users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert admin user
INSERT INTO public.admin_users (email, name)
VALUES ('shubham.sakarwal@gmail.com', 'Shubham Sakarwal')
ON CONFLICT (email) DO NOTHING;

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Admin users can view all data (no restrictions)
CREATE POLICY "Admin users have full access"
  ON public.admin_users FOR ALL
  USING (email = auth.jwt()->>'email');

-- ═══════════════════════════════════════════════════════════════
--  END OF SCHEMA UPDATES
--  Run this in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════
