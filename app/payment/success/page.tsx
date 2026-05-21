import Link from 'next/link';

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-[#0f1720] text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {/* Success icon */}
        <div className="w-24 h-24 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center mx-auto mb-8 text-5xl">
          ✅
        </div>

        <h1 className="text-3xl font-bold mb-4">Payment Successful!</h1>
        <p className="text-gray-400 mb-8 leading-relaxed">
          Your payment has been confirmed. Your license key has been generated and
          sent to your registered email address.
        </p>

        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6 mb-8">
          <p className="text-yellow-300 text-sm">
            📧 Check your inbox for an email from{' '}
            <strong>support@advoverse.in</strong> with your license key and
            activation instructions.
          </p>
          <p className="text-gray-400 text-xs mt-2">
            (Also check your spam/junk folder if not received within 5 minutes)
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/#download"
            className="block w-full py-4 rounded-2xl bg-yellow-500 text-black font-semibold hover:bg-yellow-400 transition"
          >
            Download Advoverse
          </Link>
          <Link
            href="/"
            className="block w-full py-4 rounded-2xl border border-white/20 text-white hover:bg-white/10 transition"
          >
            Back to Home
          </Link>
        </div>

        <p className="mt-8 text-xs text-gray-500">
          Need help?{' '}
          <a href="mailto:support@advoverse.in" className="text-yellow-400 hover:underline">
            support@advoverse.in
          </a>
        </p>
      </div>
    </div>
  );
}
