import { createBrowserClient } from '@supabase/ssr';

// Client-side Supabase client (used in React components)
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Debug logging - will show in browser console
  if (typeof window !== 'undefined') {
    console.log('=== Supabase Client Debug ===');
    console.log('Supabase URL:', supabaseUrl);
    console.log('Supabase Key exists:', !!supabaseAnonKey);
    console.log('Supabase Key length:', supabaseAnonKey?.length || 0);
    
    // Check if variables are actually defined
    if (!supabaseUrl) {
      console.error('❌ NEXT_PUBLIC_SUPABASE_URL is undefined!');
      console.log('Available env vars:', Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC')));
    }
    if (!supabaseAnonKey) {
      console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is undefined!');
    }
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    const error = new Error('Missing Supabase environment variables. Check Vercel settings.');
    console.error(error);
    throw error;
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
