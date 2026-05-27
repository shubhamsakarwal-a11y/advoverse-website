'use client';

interface InvoicePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  onPay: () => void;
  isLoading: boolean;
  userName: string;
  userEmail: string;
  planName: string;
  duration: string;
  baseAmount: number;       // in rupees
  discountAmount: number;   // in rupees
  referralCode: string | null;
  gatewayFeePercent: number; // 2.5
}

export function InvoicePreviewModal({
  isOpen, onClose, onPay, isLoading,
  userName, userEmail, planName, duration,
  baseAmount, discountAmount, referralCode, gatewayFeePercent
}: InvoicePreviewProps) {
  if (!isOpen) return null;

  const subtotal = baseAmount - discountAmount;
  const gatewayFee = Math.max(1, Math.ceil(subtotal * gatewayFeePercent / 100));
  const total = subtotal + gatewayFee;
  const invoiceDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const invoiceNo = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">

        {/* Header */}
        <div style={{ background: '#0f1720', padding: '24px 28px' }}>
          <h2 style={{ color: 'white', fontSize: '22px', fontWeight: 700, margin: 0 }}>Invoice Preview</h2>
          <p style={{ color: '#9ca3af', fontSize: '13px', margin: '4px 0 0' }}>Review before payment</p>
        </div>

        {/* Invoice Body */}
        <div style={{ padding: '28px' }}>

          {/* Customer Info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '13px', color: '#555' }}>
            <div>
              <div style={{ fontWeight: 600, color: '#1f2937', fontSize: '15px' }}>{userName}</div>
              <div>{userEmail}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600, color: '#1f2937' }}>{invoiceNo}</div>
              <div>{invoiceDate}</div>
            </div>
          </div>

          {/* Line Items */}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Description</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#374151' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px 16px', color: '#1f2937' }}>
                    {planName}
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{duration} subscription</div>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#1f2937' }}>₹{baseAmount}</td>
                </tr>
                {discountAmount > 0 && (
                  <tr style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px 16px', color: '#16a34a' }}>
                      Referral Discount
                      {referralCode && <span style={{ fontSize: '12px', color: '#6b7280' }}> ({referralCode})</span>}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#16a34a' }}>-₹{discountAmount}</td>
                  </tr>
                )}
                <tr style={{ borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>
                  <td style={{ padding: '12px 16px', color: '#374151', fontWeight: 600 }}>Subtotal</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#374151' }}>₹{subtotal}</td>
                </tr>
                <tr style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: '13px' }}>
                    Payment Gateway Fee ({gatewayFeePercent}%)
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: '#6b7280', fontSize: '13px' }}>₹{gatewayFee}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: '#0f1720', borderRadius: '12px', marginBottom: '20px' }}>
            <span style={{ color: '#9ca3af', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Total Payable</span>
            <span style={{ color: '#f59e0b', fontSize: '28px', fontWeight: 700, fontFamily: 'monospace' }}>₹{total}</span>
          </div>

          {/* Pay Button */}
          <button
            onClick={onPay}
            disabled={isLoading}
            style={{
              width: '100%', padding: '16px', background: isLoading ? '#6b7280' : '#16a34a',
              color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px',
              fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}
          >
            {isLoading ? 'Processing...' : `Pay ₹${total} with Razorpay`}
          </button>

          {/* Security note */}
          <div style={{ marginTop: '12px', padding: '10px 14px', background: '#fef9f0', border: '1px solid #fde68a', borderRadius: '8px', fontSize: '12px', color: '#92400e', textAlign: 'center' }}>
            🔒 Secure payment via Razorpay. UPI, Cards, Net Banking, Wallets accepted.
          </div>

          {/* Cancel */}
          <button
            onClick={onClose}
            disabled={isLoading}
            style={{ width: '100%', marginTop: '10px', padding: '12px', background: 'none', border: '1px solid #e5e7eb', borderRadius: '10px', color: '#6b7280', fontSize: '14px', cursor: 'pointer' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
