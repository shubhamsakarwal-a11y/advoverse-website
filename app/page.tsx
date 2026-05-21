'use client';

import { useState } from 'react';
import { PaymentMethodModal } from '@/components/PaymentMethodModal';
import { AuthModal } from '@/components/AuthModal';
import { PricingPlan, RazorpayPaymentResponse } from '@/lib/types/payment';
import { initiateRazorpayPayment, verifyRazorpayPayment, createStripeSession } from '@/lib/payment';

const FEATURES = [
  'Case & Chamber Management',
  'Court Diary & Hearing Tracking',
  'Document & Forms Library',
  'Role-Based Team Management',
  'Calendar Heatmap',
  'Offline-First Architecture',
  '30-Day Trial System',
  'Secure License Activation',
];

const FEATURE_ICONS = ['⚖️', '📅', '📁', '👥', '🗓️', '💻', '🕐', '🔐'];

const PRICING_PLANS: PricingPlan[] = [
  { name: 'Solo Advocate', price: 999, displayPrice: '₹999/month', desc: 'Ideal for individual advocates and independent practice.' },
  { name: 'Chamber Pro', price: 2999, displayPrice: '₹2999/month', desc: 'For growing chambers with staff and juniors.', popular: true },
  { name: 'Lifetime License', price: 24999, displayPrice: '₹24,999 one-time', desc: 'One-time activation with lifetime usage rights.' },
];

type CurrentUser = { name: string; email: string; token: string };

export default function AdvoverseWebsite() {
  const [isLoading, setIsLoading] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const handlePlanClick = (plan: PricingPlan) => {
    setSelectedPlan(plan);
    if (!currentUser) {
      setAuthMode('register');
      setIsAuthModalOpen(true);
    } else {
      setIsPaymentModalOpen(true);
    }
  };

  const handleAuthSuccess = (user: CurrentUser) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);
    if (selectedPlan) setIsPaymentModalOpen(true);
  };

  const closePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setSelectedPlan(null);
  };

  const handleRazorpayPayment = async () => {
    if (!selectedPlan || !currentUser) return;
    setIsLoading(true);
    closePaymentModal();
    try {
      await initiateRazorpayPayment(
        selectedPlan.name,
        currentUser.token,
        currentUser.name,
        currentUser.email,
        async (response: RazorpayPaymentResponse, dbOrderId: number) => {
          try {
            await verifyRazorpayPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
              dbOrderId,
              currentUser.token
            );
            alert(`✅ Payment Successful!\n\nYour license key has been sent to ${currentUser.email}.\nPlease check your inbox (and spam folder).`);
          } catch (err) {
            alert(err instanceof Error ? err.message : 'Verification failed. Contact support@advoverse.in');
          }
        }
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStripePayment = async () => {
    if (!selectedPlan || !currentUser) return;
    setIsLoading(true);
    closePaymentModal();
    try {
      const { url } = await createStripeSession(selectedPlan.name, currentUser.token);
      if (url) window.location.href = url;
      else throw new Error('No checkout URL returned');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Stripe payment failed.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1720] text-white font-sans">

      {/* ── HEADER ── */}
      <header className="w-full border-b border-white/10 sticky top-0 z-50 bg-[#0f1720]/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-wide">ADVOVERSE</h1>
            <p className="text-xs text-gray-400">Digital Chamber Management System</p>
          </div>
          <nav className="hidden md:flex gap-8 text-sm text-gray-300">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#pricing" className="hover:text-white transition">Pricing</a>
            <a href="#activation" className="hover:text-white transition">Activation</a>
            <a href="#download" className="hover:text-white transition">Download</a>
            <a href="#contact" className="hover:text-white transition">Contact</a>
          </nav>
          <div className="flex gap-3 text-sm">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <span className="text-gray-300 text-sm">👋 {currentUser.name.split(' ')[0]}</span>
                <button onClick={() => setCurrentUser(null)}
                  className="px-4 py-2 rounded-xl border border-white/20 hover:bg-white/10 transition text-sm">
                  Logout
                </button>
              </div>
            ) : (
              <>
                <button onClick={() => { setAuthMode('login'); setIsAuthModalOpen(true); }}
                  className="px-4 py-2 rounded-xl border border-white/20 hover:bg-white/10 transition">
                  Login
                </button>
                <button onClick={() => { setAuthMode('register'); setIsAuthModalOpen(true); }}
                  className="px-4 py-2 rounded-xl bg-yellow-500 text-black font-semibold hover:bg-yellow-400 transition">
                  Register
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <div className="inline-flex items-center rounded-full border border-yellow-700/30 bg-yellow-500/10 px-4 py-2 text-sm text-yellow-300 mb-6">
            Built for Advocates, Chambers &amp; Law Firms
          </div>
          <h2 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
            Manage Your Entire Chamber From One System.
          </h2>
          <p className="text-lg text-gray-300 leading-relaxed mb-8 max-w-2xl">
            Advoverse is a professional offline-first chamber management system designed for advocates and law firms across India.
          </p>
          <div className="flex flex-wrap gap-4">
            <a href="#download"
              className="px-8 py-4 rounded-2xl bg-yellow-500 text-black font-semibold hover:scale-105 transition shadow-2xl">
              Download Application
            </a>
            <a href="#pricing"
              className="px-8 py-4 rounded-2xl border border-white/20 hover:bg-white/10 transition">
              View Pricing
            </a>
          </div>
          <div className="mt-10 flex flex-wrap gap-6 text-sm text-gray-400">
            <span>✔ 30-Day Free Trial</span>
            <span>✔ Offline First</span>
            <span>✔ Secure License Activation</span>
          </div>
        </div>

        {/* Mock UI card */}
        <div className="rounded-3xl bg-gradient-to-br from-[#1f2937] to-[#111827] border border-white/10 shadow-2xl p-6">
          <div className="flex gap-2 mb-6">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {[["Today's Cases", "14"], ["Pending Drafts", "7"], ["Next Hearings", "29"]].map(([label, val]) => (
              <div key={label} className="rounded-2xl bg-[#0f1720] p-4 border border-white/5">
                <p className="text-xs text-gray-400 mb-2">{label}</p>
                <h3 className="text-3xl font-bold">{val}</h3>
              </div>
            ))}
          </div>
          <div className="rounded-2xl bg-[#0f1720] p-4 border border-white/5">
            <p className="text-xs text-gray-400 mb-3">Recent Cases</p>
            {['Sharma vs State', 'Kumar vs Kumar', 'Patel Property Matter'].map((c) => (
              <div key={c} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                <span className="text-sm">{c}</span>
                <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-full">Active</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24">
        <div className="mb-16 text-center">
          <p className="text-yellow-400 uppercase tracking-[0.3em] text-sm mb-4">Features</p>
          <h2 className="text-4xl font-bold mb-4">Built Around Real Legal Workflow</h2>
          <p className="text-gray-400 max-w-xl mx-auto">Every feature is designed based on how advocates actually work — from managing cause lists to handling client documents.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((feature, i) => (
            <div key={i} className="rounded-3xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 hover:border-yellow-500/30 transition">
              <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mb-6 text-xl">
                {FEATURE_ICONS[i]}
              </div>
              <h3 className="text-lg font-semibold mb-3">{feature}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">Optimised for practical chamber operations.</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ACTIVATION STEPS ── */}
      <section id="activation" className="bg-gradient-to-b from-[#101827] to-[#0f1720] border-y border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-yellow-400 uppercase tracking-[0.3em] text-sm mb-4">Secure Licensing</p>
            <h2 className="text-4xl font-bold mb-6">Minimal &amp; Secure Activation Architecture</h2>
            <div className="space-y-5 text-gray-300 leading-relaxed">
              <p>Every installation generates a unique encrypted device ID.</p>
              <p>Users activate the software using digitally signed license keys.</p>
              <p>The software remains offline-first while periodically validating subscriptions securely.</p>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-[#111827] p-8 shadow-2xl">
            <div className="space-y-4">
              {['Install Advoverse', '30-Day Trial Starts', 'Purchase Subscription', 'License Key Generated & Emailed', 'Enter Activation Key', 'Software Activated ✅'].map((step, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-yellow-500 text-black flex items-center justify-center font-bold flex-shrink-0 text-sm">
                    {i + 1}
                  </div>
                  <div className="flex-1 rounded-2xl border border-white/10 px-5 py-3 bg-white/5 text-sm">
                    {step}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <p className="text-yellow-400 uppercase tracking-[0.3em] text-sm mb-4">Pricing</p>
          <h2 className="text-4xl font-bold mb-4">Flexible Plans For Every Practice</h2>
          <p className="text-gray-400">Start with a 30-day free trial. No credit card required.</p>
        </div>
        <div className="grid lg:grid-cols-3 gap-8">
          {PRICING_PLANS.map((plan, i) => (
            <div key={i} className={`rounded-3xl border p-8 flex flex-col relative ${plan.popular ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-white/10 bg-white/5'}`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-xs font-bold px-4 py-1 rounded-full">
                  MOST POPULAR
                </div>
              )}
              <h3 className="text-2xl font-bold mb-3">{plan.name}</h3>
              <div className="text-4xl font-bold text-yellow-400 mb-4">{plan.displayPrice}</div>
              <p className="text-gray-400 mb-6 flex-1 leading-relaxed">{plan.desc}</p>
              <ul className="mb-8 space-y-2 text-sm text-gray-300">
                <li>✔ Full feature access</li>
                <li>✔ Email support</li>
                {plan.name === 'Chamber Pro' && <li>✔ Multi-user access</li>}
                {plan.name === 'Lifetime License' && <><li>✔ Free future updates</li><li>✔ Priority support</li></>}
              </ul>
              <button
                onClick={() => handlePlanClick(plan)}
                disabled={isLoading}
                className={`w-full py-4 rounded-2xl font-semibold hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed ${plan.popular ? 'bg-yellow-500 text-black' : 'bg-white/10 border border-white/20 hover:bg-white/20'}`}
              >
                {isLoading ? 'Processing...' : 'Subscribe Now'}
              </button>
            </div>
          ))}
        </div>
        <p className="text-center text-gray-500 text-sm mt-8">All prices in INR. 30-day free trial available for all plans.</p>
      </section>

      {/* ── DOWNLOAD ── */}
      <section id="download" className="border-y border-white/10 bg-[#101827]">
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">
          <p className="text-yellow-400 uppercase tracking-[0.3em] text-sm mb-4">Download</p>
          <h2 className="text-4xl font-bold mb-4">Get Advoverse For Windows</h2>
          <p className="text-gray-400 mb-10 max-w-xl mx-auto">
            Download the desktop app. The 30-day free trial starts on first launch — no registration needed to try.
          </p>
          <a href="/api/download"
            className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-yellow-500 text-black font-semibold hover:scale-105 transition shadow-2xl">
            <span>🪟</span><span>Download for Windows</span>
          </a>
          <p className="mt-6 text-xs text-gray-500">Requires Windows 10 or later</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer id="contact" className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold">ADVOVERSE</h3>
            <p className="text-gray-400 text-sm mt-2">Professional Chamber Management System for Advocates.</p>
          </div>
          <div className="text-sm text-gray-400 text-center md:text-right">
            <p>Email: <a href="mailto:support@advoverse.in" className="hover:text-yellow-400 transition">support@advoverse.in</a></p>
            <p className="mt-1">© 2026 Advoverse. All Rights Reserved.</p>
          </div>
        </div>
      </footer>

      {/* ── MODALS ── */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        mode={authMode}
        onModeChange={setAuthMode}
        onSuccess={handleAuthSuccess}
      />
      <PaymentMethodModal
        isOpen={isPaymentModalOpen}
        onClose={closePaymentModal}
        planName={selectedPlan?.name || ''}
        price={selectedPlan?.price || 0}
        onSelectRazorpay={handleRazorpayPayment}
        onSelectStripe={handleStripePayment}
        isLoading={isLoading}
      />
    </div>
  );
}
