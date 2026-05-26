'use client';
// Deploy to: app/forgot-password/page.tsx

import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes('@')) { setErrorMsg('Enter a valid email address.'); return; }
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      await res.json();
      setStatus('sent'); // Always show sent — don't reveal if email exists
    } catch {
      setErrorMsg('Something went wrong. Please try again.');
      setStatus('error');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-[#1E3A5F] text-white p-4 flex items-center gap-3">
        <span className="text-2xl">⚖️</span>
        <h1 className="text-xl font-bold">Caseline by Advoverse</h1>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="bg-white rounded-xl shadow-md p-10 w-full max-w-md">
          <div className="text-5xl text-center mb-4">🔑</div>
          <h2 className="text-2xl font-bold text-[#1E3A5F] text-center mb-2">Forgot Password?</h2>
          <p className="text-gray-500 text-sm text-center mb-8">
            Enter your registered email and we&apos;ll send you a reset link.
          </p>

          {status === 'sent' ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-5 text-center">
              <div className="text-3xl mb-2">📧</div>
              <p className="text-green-800 font-semibold">Reset link sent!</p>
              <p className="text-green-700 text-sm mt-2">
                If <strong>{email}</strong> is registered, you&apos;ll receive a reset email shortly.
                Check your spam folder too.
              </p>
              <a href="/" className="inline-block mt-4 text-sm text-[#1E3A5F] font-semibold hover:underline">
                ← Back to Advoverse
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm mb-4 focus:outline-none focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F]"
                required
              />
              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded mb-4">
                  {errorMsg}
                </div>
              )}
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full bg-[#1E3A5F] text-white py-3 rounded-md font-bold text-sm hover:bg-[#2a4f7c] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {status === 'loading' ? '⏳ Sending...' : '📧 Send Reset Link'}
              </button>
            </form>
          )}

          <div className="text-center mt-6">
            <a href="/" className="text-sm text-gray-500 hover:text-[#1E3A5F]">← Back to Advoverse</a>
          </div>
        </div>
      </div>

      <footer className="text-center py-4 text-xs text-gray-400">
        © 2026 Advoverse | advoverse.com
      </footer>
    </div>
  );
}
