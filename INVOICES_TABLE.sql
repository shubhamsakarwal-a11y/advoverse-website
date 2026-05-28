-- Run this in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  order_id INTEGER,
  invoice_number VARCHAR(30) UNIQUE NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  user_name VARCHAR(255),
  plan_name VARCHAR(100) NOT NULL,
  duration VARCHAR(20) NOT NULL,
  base_amount INTEGER NOT NULL,
  discount_amount INTEGER DEFAULT 0,
  referral_code VARCHAR(50),
  subtotal INTEGER NOT NULL,
  gateway_fee INTEGER DEFAULT 0,
  total_amount INTEGER NOT NULL,
  payment_id VARCHAR(100),
  payment_date TIMESTAMP DEFAULT NOW(),
  service_start DATE,
  service_end DATE,
  status VARCHAR(20) DEFAULT 'paid',
  created_at TIMESTAMP DEFAULT NOW()
);