'use client';

import { PricingPlan } from '@/lib/types/payment';

interface DurationSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PricingPlan | null;
  onSelectDuration: (duration: 'monthly' | 'quarterly' | 'yearly', price: number) => void;
}

export function DurationSelectionModal({ isOpen, onClose, plan, onSelectDuration }: DurationSelectionModalProps) {
  if (!isOpen || !plan) return null;

  const handleSelect = (duration: 'monthly' | 'quarterly' | 'yearly', price: number) => {
    onSelectDuration(duration, price);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl" style={{ border: '1px solid #ddd' }}>
        {/* Header */}
        <div className="p-6 border-b" style={{ borderColor: '#e5e7eb' }}>
          <h2 className="text-2xl font-bold" style={{ color: '#3b2a22', fontFamily: 'Playfair Display, serif' }}>
            Choose Duration
          </h2>
          <p className="text-gray-600 text-sm mt-2">
            Select your preferred subscription duration for {plan.name}
          </p>
        </div>

        {/* Duration Options */}
        <div className="p-6 space-y-4">
          {/* Monthly */}
          <button
            onClick={() => handleSelect('monthly', plan.price)}
            className="w-full p-5 rounded-xl text-left transition-all hover:shadow-lg"
            style={{ background: '#f9fafb', border: '2px solid #e5e7eb' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#6b4b3e';
              e.currentTarget.style.background = '#fef3c7';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.background = '#f9fafb';
            }}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#3b2a22' }}>Monthly Plan</div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>30 days validity</div>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#6b4b3e' }}>
                {plan.displayPrice}
              </div>
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>
              Billed monthly • Cancel anytime
            </div>
          </button>

          {/* Quarterly */}
          {plan.quarterlyPrice && (
            <button
              onClick={() => handleSelect('quarterly', plan.quarterlyPrice!)}
              className="w-full p-5 rounded-xl text-left transition-all hover:shadow-lg relative"
              style={{ background: '#fef3c7', border: '2px solid #fbbf24' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#f59e0b';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(251, 191, 36, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#fbbf24';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold" style={{ background: '#fbbf24', color: '#92400e' }}>
                SAVE 10%
              </div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#92400e' }}>Quarterly Plan</div>
                  <div style={{ fontSize: '13px', color: '#92400e' }}>90 days validity</div>
                </div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#92400e' }}>
                  ₹{plan.quarterlyPrice}
                </div>
              </div>
              <div style={{ fontSize: '13px', color: '#92400e' }}>
                Billed every 3 months • Save ₹{(plan.price * 3) - plan.quarterlyPrice}
              </div>
            </button>
          )}

          {/* Yearly */}
          {plan.yearlyPrice && (
            <button
              onClick={() => handleSelect('yearly', plan.yearlyPrice!)}
              className="w-full p-5 rounded-xl text-left transition-all hover:shadow-lg relative"
              style={{ background: '#dcfce7', border: '2px solid #22c55e' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#16a34a';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(34, 197, 94, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#22c55e';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold" style={{ background: '#22c55e', color: '#14532d' }}>
                SAVE 20% 🎉
              </div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#14532d' }}>Yearly Plan</div>
                  <div style={{ fontSize: '13px', color: '#14532d' }}>365 days validity</div>
                </div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#14532d' }}>
                  ₹{plan.yearlyPrice}
                </div>
              </div>
              <div style={{ fontSize: '13px', color: '#14532d' }}>
                Billed annually • Save ₹{(plan.price * 12) - plan.yearlyPrice}
              </div>
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl transition-colors"
            style={{ border: '1px solid #e5e7eb', color: '#6b7280' }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
