'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'login' | 'register';
  onModeChange: (mode: 'login' | 'register') => void;
  onSuccess: (user: { name: string; email: string; token: string }) => void;
}

export function AuthModal({ isOpen, onClose, mode, onModeChange, onSuccess }: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', barNumber: '' });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const supabase = createClient();

    try {
      if (mode === 'register') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: form.email.trim().toLowerCase(),
          password: form.password,
          options: {
            data: {
              name: form.name.trim(),
              phone: form.phone.trim(),
              bar_number: form.barNumber.trim(),
            },
          },
        });

        if (signUpError) throw new Error(signUpError.message);
        if (!data.session) {
          // Supabase email confirmation is on — tell user to check inbox
          // For production you can disable confirmation in Supabase dashboard
          setError('');
          alert('Account created! Check your email to confirm, then log in.');
          onModeChange('login');
          return;
        }

        const session = data.session;
        onSuccess({
          name: form.name.trim(),
          email: form.email.trim(),
          token: session.access_token,
        });
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: form.email.trim().toLowerCase(),
          password: form.password,
        });

        if (signInError) throw new Error('Invalid email or password');

        const userName =
          data.user?.user_metadata?.name ||
          data.user?.email?.split('@')[0] ||
          'User';

        onSuccess({
          name: userName,
          email: data.user!.email!,
          token: data.session!.access_token,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'azure') => {
    setIsLoading(true);
    setError('');
    
    const supabase = createClient();
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Social login failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f1720] border border-white/10 rounded-3xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold">
            {mode === 'register' ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-gray-400 text-sm mt-2">
            {mode === 'register'
              ? 'Register to purchase and receive your license key.'
              : 'Login to continue to checkout.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Social Login Buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleSocialLogin('google')}
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-white text-gray-800 font-medium hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
            
            <button
              type="button"
              onClick={() => handleSocialLogin('azure')}
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-[#0078D4] text-white font-medium hover:bg-[#106EBE] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 23 23" fill="none">
                <path d="M0 0h10.377v10.377H0z" fill="#f25022"/>
                <path d="M12.623 0H23v10.377H12.623z" fill="#7fba00"/>
                <path d="M0 12.623h10.377V23H0z" fill="#00a4ef"/>
                <path d="M12.623 12.623H23V23H12.623z" fill="#ffb900"/>
              </svg>
              Continue with Microsoft
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#0f1720] text-gray-400">Or continue with email</span>
            </div>
          </div>
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Full Name *</label>
                <input
                  type="text" name="name" required value={form.name} onChange={handleChange}
                  placeholder="Adv. Rajesh Kumar"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 transition"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Phone Number</label>
                <input
                  type="tel" name="phone" value={form.phone} onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 transition"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Bar Council Enrollment No.</label>
                <input
                  type="text" name="barNumber" value={form.barNumber} onChange={handleChange}
                  placeholder="MH/1234/2020"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 transition"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-1">Email Address *</label>
            <input
              type="email" name="email" required value={form.email} onChange={handleChange}
              placeholder="you@example.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 transition"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Password *</label>
            <input
              type="password" name="password" required minLength={8} value={form.password}
              onChange={handleChange} placeholder="Minimum 8 characters"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 transition"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit" disabled={isLoading}
            className="w-full py-4 rounded-2xl bg-yellow-500 text-black font-semibold hover:bg-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Please wait...' : mode === 'register' ? 'Create Account' : 'Login'}
          </button>
        </form>

        {/* Switch */}
        <div className="px-6 pb-4 text-center text-sm text-gray-400">
          {mode === 'register' ? (
            <>Already have an account?{' '}
              <button onClick={() => onModeChange('login')} className="text-yellow-400 hover:underline">Login</button>
            </>
          ) : (
            <>Don&apos;t have an account?{' '}
              <button onClick={() => onModeChange('register')} className="text-yellow-400 hover:underline">Register</button>
            </>
          )}
        </div>

        <div className="px-6 pb-6 border-t border-white/10 pt-4">
          <button onClick={onClose}
            className="w-full py-3 rounded-2xl border border-white/20 text-white hover:bg-white/10 transition text-sm">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
