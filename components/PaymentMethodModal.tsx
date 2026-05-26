'use client';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  price: number;
  onSelectRazorpay: (password: string) => void;
  onSelectStripe: () => void;
  isLoading: boolean;
  userEmail?: string;
}

export function PaymentMethodModal({
  isOpen,
  onClose,
  planName,
  price,
  onSelectRazorpay,
  onSelectStripe,
  isLoading,
  userEmail,
}: PaymentModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f1720] border border-white/10 rounded-3xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">Complete Purchase</h2>
          <p className="text-gray-400 text-sm mt-2">
            {planName} &bull; &#8377;{price.toLocaleString('en-IN')}
          </p>
          {userEmail && (
            <p className="text-green-400 text-xs mt-1">Buying as: {userEmail}</p>
          )}
        </div>

        {/* Info box */}
        <div className="px-6 pt-5 pb-2">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 mb-4">
            <p className="text-blue-300 text-xs font-semibold mb-1">After payment:</p>
            <ul className="text-gray-300 text-xs space-y-1">
              <li>Your Caseline subscription will activate immediately</li>
              <li>Login to Caseline with your advoverse.com email + password</li>
              <li>Click Refresh in Settings to see your subscription</li>
            </ul>
          </div>
        </div>

        {/* Payment Options */}
        <div className="px-6 pb-4 space-y-4">
          <button
            onClick={() => onSelectRazorpay('')}
            disabled={isLoading}
            className="w-full p-4 rounded-2xl border-2 border-blue-500/50 hover:border-blue-500 bg-blue-500/10 hover:bg-blue-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                Pay
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-white">Pay with Razorpay</h3>
                <p className="text-xs text-gray-400">UPI, Cards, Net Banking, Wallets</p>
              </div>
              {isLoading && (
                <div className="ml-auto text-gray-400 text-sm animate-pulse">Processing...</div>
              )}
            </div>
          </button>
        </div>

        {/* Info */}
        <div className="px-6 pb-4">
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <p className="text-xs text-yellow-300">
              Secure payment. Your subscription activates instantly after payment confirmation.
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
