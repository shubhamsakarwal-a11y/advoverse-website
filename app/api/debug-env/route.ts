import { NextResponse } from 'next/server';

// Debug endpoint to check environment variables
// This runs on the server, so it can see all env vars
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    vercel: {
      env: process.env.VERCEL_ENV,
      url: process.env.VERCEL_URL,
      region: process.env.VERCEL_REGION,
    },
    supabase: {
      url: supabaseUrl,
      urlCorrect: supabaseUrl?.includes('nvzqxwtaglkhsdqfobmr'), // Should be true (with x)
      urlIncorrect: supabaseUrl?.includes('nvzqwtaglkhsdqfobmr'), // Should be false (without x)
      keyExists: !!supabaseKey,
      keyLength: supabaseKey?.length || 0,
    },
    razorpay: {
      keyId: razorpayKey,
      keyExists: !!razorpayKey,
    },
    app: {
      url: appUrl,
    },
    diagnosis: {
      supabaseUrlStatus: supabaseUrl?.includes('nvzqxwtaglkhsdqfobmr') 
        ? '✅ CORRECT (has x)' 
        : supabaseUrl?.includes('nvzqwtaglkhsdqfobmr')
        ? '❌ WRONG (missing x)'
        : '❌ INVALID URL',
      allEnvVarsPresent: !!(supabaseUrl && supabaseKey && razorpayKey && appUrl),
    }
  });
}
