-- App Updates table for Caseline desktop app version management
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS app_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  version VARCHAR(20) NOT NULL,
  title VARCHAR(200) NOT NULL,
  changelog TEXT,
  download_url TEXT NOT NULL,
  is_mandatory BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  min_version VARCHAR(20),  -- minimum version that should force update
  platform VARCHAR(20) DEFAULT 'windows',  -- windows, mac, linux
  file_size VARCHAR(20),  -- e.g. "85 MB"
  published_by VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick latest version lookup
CREATE INDEX idx_app_updates_active ON app_updates(is_active, platform, published_at DESC);

-- Enable RLS
ALTER TABLE app_updates ENABLE ROW LEVEL SECURITY;

-- Allow public read for active updates (desktop app needs to check)
CREATE POLICY "Public can read active updates" ON app_updates
  FOR SELECT USING (is_active = true);

-- Only service role can insert/update/delete
CREATE POLICY "Service role full access" ON app_updates
  FOR ALL USING (true) WITH CHECK (true);
