'use client';
import { useState } from 'react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  price: number;
  onSelectRazorpay: (password: string, referralCode?: string, discountedPrice?: number) => void;
  onSelectStripe: () => void;
  isLoading: boolean;
  userEmail?: string;
}

export function PaymentMethodModal({
  isOpen, onClose, planName, price, onSelectRazorpay, onSelectStripe, isLoading, userEmail,
}: PaymentModalProps) {
  const [referralCode, setReferralCode] = useState('');
  const [referralStatus, setReferralStatus] = useState<{
    valid: boolean; text: string; discountedAmount?: number; discountText?: string;
  } | null>(null);
  const [validating, setValidating] = useState(false);

  if (!isOpen) return null;

  const finalPrice = referralStatus?.valid && referralStatus.discountedAmount !== undefined
    ? referralStatus.discountedAmount
    : price;

  const validateCode = async () => {
    if (!referralCode.trim()) return;
    setValidating(true);
    setReferralStatus(null);
    try {
      const res = await fetch(`/api/referral/validate?code=${encodeURIComponent(referralCode.trim().toUpperCase())}&amount=${price}`);
      const d = await res.json();
      if (d.valid) {
        setReferralStatus({ valid: true, text: `✅ ${d.discountText} applied!`, discountedAmount: d.discountedAmount, discountText: d.discountText });
      } else {
        setReferralStatus({ valid: false, text: `❌ ${d.error}` });
      }
    } catch {
      setReferralStatus({ valid: false, text: '❌ Could not validate code' });
    }
    setValidating(false);
  };

  const clearCode = () => {
    setReferralCode('');
    setReferralStatus(null);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f1720] border border-white/10 rounded-3xl max-w-md w-full shadow-2xl">

        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">Complete Purchase</h2>
          <div className="flex items-center justify-between mt-2">
            <p className="text-gray-400 text-sm">{planName}</p>
            <div className="text-right">
              {referralStatus?.valid && referralStatus.discountedAmount !== undefined ? (
                <div>
                  <span className="text-gray-500 line-through text-sm mr-2">₹{price.toLocaleString('en-IN')}</span>
                  <span className="text-green-400 font-bold text-lg">₹{referralStatus.discountedAmount.toLocaleString('en-IN')}</span>
                </div>
              ) : (
                <span className="text-white font-bold text-lg">₹{price.toLocaleString('en-IN')}</span>
              )}
            </div>
          </div>
          {userEmail && <p className="text-green-400 text-xs mt-1">Buying as: {userEmail}</p>}
        </div>

        {/* Referral Code */}
        <div className="px-6 pt-5 pb-2">
          <p className="text-gray-400 text-xs font-semibold mb-2 uppercase tracking-wide">Have a Referral Code?</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={referralCode}
              onChange={e => { setReferralCode(e.target.value.toUpperCase()); setReferralStatus(null); }}
              onKeyDown={e => e.key === 'Enter' && validateCode()}
              placeholder="Enter code (e.g. LAUNCH50)"
              disabled={isLoading}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 text-sm font-mono tracking-widest uppercase"
            />
            {referralStatus?.valid ? (
              <button onClick={clearCode} className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 text-sm font-semibold hover:bg-red-500/30 transition">
                Remove
              </button>
            ) : (
              <button onClick={validateCode} disabled={!referralCode.trim() || validating || isLoading}
                className="px-4 py-2 rounded-xl bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-sm font-semibold hover:bg-yellow-500/30 transition disabled:opacity-40 disabled:cursor-not-allowed">
                {validating ? '...' : 'Apply'}
              </button>
            )}
          </div>
          {referralStatus && (
            <p className={`text-xs mt-2 font-semibold ${referralStatus.valid ? 'text-green-400' : 'text-red-400'}`}>
              {referralStatus.text}
            </p>
          )}
        </div>

        {/* Info box */}
        <div className="px-6 pt-3 pb-2">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 mb-4">
            <p className="text-blue-300 text-xs font-semibold mb-1">After payment:</p>
            <ul className="text-gray-300 text-xs space-y-1">
              <li>Your Caseline subscription will activate immediately</li>
              <li>Login to Caseline with your advoverse.com email + password</li>
              <li>Click Refresh in Settings to see your subscription</li>
            </ul>
          </div>
        </div>

        {/* Payment Button */}
        <div className="px-6 pb-4 space-y-4">
          <button
            onClick={() => onSelectRazorpay('', referralStatus?.valid ? referralCode.trim().toUpperCase() : undefined, referralStatus?.valid ? finalPrice : undefined)}
            disabled={isLoading}
            className="w-full p-4 rounded-2xl border-2 border-blue-500/50 hover:border-blue-500 bg-blue-500/10 hover:bg-blue-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm">Pay</div>
              <div className="text-left">
                <h3 className="font-semibold text-white">
                  Pay ₹{finalPrice.toLocaleString('en-IN')} with Razorpay
                </h3>
                <p className="text-xs text-gray-400">UPI, Cards, Net Banking, Wallets</p>
              </div>
              {isLoading && <div className="ml-auto text-gray-400 text-sm animate-pulse">Processing...</div>}
            </div>
          </button>
        </div>

        {/* Security note */}
        <div className="px-6 pb-4">
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <p className="text-xs text-yellow-300">Secure payment. Your subscription activates instantly after payment confirmation.</p>
          </div>
        </div>

        {/* Cancel */}
        <div className="px-6 pb-6">
          <button onClick={onClose} disabled={isLoading} className="w-full py-3 rounded-2xl border border-white/20 text-white hover:bg-white/10 transition disabled:opacity-50">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
