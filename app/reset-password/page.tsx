'use client';
// Deploy to: app/reset-password/page.tsx

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'invalid'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [strength, setStrength] = useState(0);

  useEffect(() => {
    if (!token || !email) setStatus('invalid');
  }, [token, email]);

  function checkStrength(pwd: string) {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    setStrength(score);
  }

  const strengthColors = ['', '#dc3545', '#fd7e14', '#ffc107', '#28a745', '#1E3A5F'];
  const strengthLabels = ['', '🔴 Weak', '🟠 Fair', '🟡 Good', '🟢 Strong', '💪 Very Strong'];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    if (newPassword.length < 8) { setErrorMsg('Password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { setErrorMsg('Passwords do not match.'); return; }

    setStatus('loading');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, newPassword })
      });
      const data = await res.json();

      if (data.success) {
        setStatus('success');
      } else {
        if (data.error?.includes('expired') || data.error?.includes('Invalid')) {
          setStatus('invalid');
        } else {
          setErrorMsg(data.error || 'Failed to update password.');
          setStatus('error');
        }
      }
    } catch {
      setErrorMsg('Something went wrong. Please try again.');
      setStatus('error');
    }
  }

  if (status === 'invalid') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <div className="text-3xl mb-2">⏰</div>
        <p className="text-yellow-800 font-semibold">Invalid or Expired Link</p>
        <p className="text-yellow-700 text-sm mt-2">This reset link is invalid or has expired.</p>
        <a href="/forgot-password" className="inline-block mt-4 bg-[#1E3A5F] text-white px-5 py-2 rounded-md text-sm font-bold hover:bg-[#2a4f7c]">
          Request New Link →
        </a>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <div className="text-3xl mb-2">✅</div>
        <p className="text-green-800 font-bold text-lg">Password Updated!</p>
        <p className="text-green-700 text-sm mt-2 mb-4">
          Your Caseline password has been changed. Login with:
          <br /><strong className="text-green-800">{email}</strong> and your new password.
        </p>
        <a href="/" className="inline-block bg-[#1E3A5F] text-white px-5 py-2 rounded-md text-sm font-bold hover:bg-[#2a4f7c]">
          ← Back to Advoverse
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-600 mb-1">New Password</label>
        <div className="relative">
          <input
            type={showPwd ? 'text' : 'password'}
            value={newPassword}
            onChange={e => { setNewPassword(e.target.value); checkStrength(e.target.value); }}
            placeholder="Min 8 characters"
            className="w-full border border-gray-300 rounded-md px-3 py-2.5 pr-10 text-sm focus:outline-none focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F]"
            required
          />
          <button type="button" onClick={() => setShowPwd(!showPwd)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg">
            {showPwd ? '🙈' : '👁️'}
          </button>
        </div>
        {newPassword && (
          <>
            <div className="h-1 rounded mt-1.5" style={{ background: strengthColors[strength], width: `${strength * 20}%`, transition: 'all 0.3s' }} />
            <p className="text-xs mt-0.5" style={{ color: strengthColors[strength] }}>{strengthLabels[strength]}</p>
          </>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-600 mb-1">Confirm New Password</label>
        <div className="relative">
          <input
            type={showConfirm ? 'text' : 'password'}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Re-enter new password"
            className="w-full border border-gray-300 rounded-md px-3 py-2.5 pr-10 text-sm focus:outline-none focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F]"
            required
          />
          <button type="button" onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg">
            {showConfirm ? '🙈' : '👁️'}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded mb-4">
          {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full bg-green-600 text-white py-3 rounded-md font-bold text-sm hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {status === 'loading' ? '⏳ Updating...' : '🔒 Update Password'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-[#1E3A5F] text-white p-4 flex items-center gap-3">
        <span className="text-2xl">⚖️</span>
        <h1 className="text-xl font-bold">Caseline by Advoverse</h1>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="bg-white rounded-xl shadow-md p-10 w-full max-w-md">
          <div className="text-5xl text-center mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-[#1E3A5F] text-center mb-2">Set New Password</h2>
          <p className="text-gray-500 text-sm text-center mb-8">Choose a strong password for your Caseline account.</p>

          <Suspense fallback={<div className="text-center text-gray-500">Loading...</div>}>
            <ResetPasswordForm />
          </Suspense>

          <div className="text-center mt-5">
            <a href="/forgot-password" className="text-sm text-gray-400 hover:text-[#1E3A5F]">← Request new reset link</a>
          </div>
        </div>
      </div>

      <footer className="text-center py-4 text-xs text-gray-400">© 2026 Advoverse | advoverse.com</footer>
    </div>
  );
}
