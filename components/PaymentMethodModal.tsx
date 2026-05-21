'use client';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  price: number;
  onSelectRazorpay: () => void;
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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f1720] border border-white/10 rounded-3xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">Select Payment Method</h2>
          <p className="text-gray-400 text-sm mt-2">
            {planName} &bull; ₹{price.toLocaleString('en-IN')}
          </p>
        </div>

        {/* Payment Options */}
        <div className="p-6 space-y-4">
          {/* Razorpay */}
          <button
            onClick={onSelectRazorpay}
            disabled={isLoading}
            className="w-full p-4 rounded-2xl border-2 border-blue-500/50 hover:border-blue-500 bg-blue-500/10 hover:bg-blue-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xl">
                💳
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-white">Razorpay</h3>
                <p className="text-xs text-gray-400">Best for India – UPI, Cards, Net Banking, Wallets</p>
              </div>
              {isLoading && (
                <div className="ml-auto animate-spin text-xl">⚙️</div>
              )}
            </div>
          </button>

          {/* Stripe */}
          <button
            onClick={onSelectStripe}
            disabled={isLoading}
            className="w-full p-4 rounded-2xl border-2 border-purple-500/50 hover:border-purple-500 bg-purple-500/10 hover:bg-purple-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center text-white text-xl">
                🌐
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-white">Stripe</h3>
                <p className="text-xs text-gray-400">Global – Cards, Apple Pay, Google Pay</p>
              </div>
              {isLoading && (
                <div className="ml-auto animate-spin text-xl">⚙️</div>
              )}
            </div>
          </button>
        </div>

        {/* Info */}
        <div className="px-6 pb-4">
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <p className="text-xs text-yellow-300">
              ✓ Both are secure, certified payment gateways. Your license key will be
              emailed after payment confirmation.
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
