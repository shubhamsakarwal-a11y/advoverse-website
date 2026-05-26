'use client';
import { useState } from 'react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  price: number;
  onSelectRazorpay: (password: string) => void;
  onSelectStripe: () => void;
  isLoading: boolean;
}

export function PaymentMethodModal({
  isOpen,
  onClose,
  planName,
  price,
  onSelectRazorpay,
  onSelectStripe,
  isLoading,
}: PaymentModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [pwdError, setPwdError] = useState('');

  if (!isOpen) return null;

  const handleRazorpay = () => {
    setPwdError('');
    if (!password || password.length < 8) {
      setPwdError('Caseline password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setPwdError('Passwords do not match.');
      return;
    }
    onSelectRazorpay(password);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f1720] border border-white/10 rounded-3xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">Complete Purchase</h2>
          <p className="text-gray-400 text-sm mt-2">
            {planName} &bull; &#8377;{price.toLocaleString('en-IN')}
          </p>
        </div>

        {/* Caseline Password Section */}
        <div className="px-6 pt-5 pb-2">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 mb-4">
            <p className="text-blue-300 text-xs font-semibold mb-3">
              Set your Caseline login password
            </p>
            <div className="space-y-3">
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Set Caseline password (min 8 chars)"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-400 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-sm"
                >
                  {showPwd ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                type="password"
                placeholder="Confirm Caseline password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-400"
              />
              {pwdError && (
                <p className="text-red-400 text-xs">{pwdError}</p>
              )}
              <p className="text-gray-500 text-xs">
                This password will be used to login to Caseline desktop app. You can change it later in Settings.
              </p>
            </div>
          </div>
        </div>

        {/* Payment Options */}
        <div className="px-6 pb-4 space-y-4">
          {/* Razorpay */}
          <button
            onClick={handleRazorpay}
            disabled={isLoading}
            className="w-full p-4 rounded-2xl border-2 border-blue-500/50 hover:border-blue-500 bg-blue-500/10 hover:bg-blue-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xl">
                  Pay
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-white">Pay with Razorpay</h3>
                <p className="text-xs text-gray-400">UPI, Cards, Net Banking, Wallets</p>
              </div>
              {isLoading && (
                <div className="ml-auto animate-spin text-xl">...</div>
              )}
            </div>
          </button>
        </div>

        {/* Info */}
        <div className="px-6 pb-4">
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <p className="text-xs text-yellow-300">
              After payment: your license key + Caseline password will be emailed to you.
            </p>
          </div>
        </div>

        {/* Cancel */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-full py-3 rounded-2xl border border-white/20 text-white hover:bg-white/10 transition disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
