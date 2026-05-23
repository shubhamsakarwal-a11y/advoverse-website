'use client';

import { useState } from 'react';
import { PaymentMethodModal } from '@/components/PaymentMethodModal';
import { AuthModal } from '@/components/AuthModal';
import { PricingPlan, RazorpayPaymentResponse } from '@/lib/types/payment';
import { initiateRazorpayPayment, verifyRazorpayPayment, createStripeSession } from '@/lib/payment';

const PRICING_PLANS: PricingPlan[] = [
  { name: 'Junior Advocate', price: 100, displayPrice: '₹100/month', yearlyPrice: 1000, desc: '0 Additional Users\n20 Cases\nIdeal for beginners' },
  { name: 'Solo Advocate', price: 200, displayPrice: '₹200/month', yearlyPrice: 2000, desc: '0 Additional Users\n60 Cases\nIndependent practice setup' },
  { name: 'Advocate + Clerk', price: 300, displayPrice: '₹300/month', yearlyPrice: 3000, desc: '1 Additional User\n120 Cases\nClerk coordination workflow', popular: true },
  { name: 'Chamber Lite', price: 800, displayPrice: '₹800/month', yearlyPrice: 8000, desc: '3 Users\n200 Cases\nSmall chamber management' },
  { name: 'Chamber', price: 1500, displayPrice: '₹1500/month', yearlyPrice: 15000, desc: '6 Users\n500 Cases\nProfessional chamber workflow' },
  { name: 'Chamber Pro', price: 3000, displayPrice: '₹3000/month', yearlyPrice: 30000, desc: '9 Users\nUnlimited Cases\nAdvanced litigation management' },
  { name: 'Exclusive', price: 5000, displayPrice: '₹5000/month', yearlyPrice: 50000, desc: 'Unlimited Users\nUnlimited Cases\nEnterprise legal operations' },
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
            alert(err instanceof Error ? err.message : 'Verification failed. Contact support@advoverse.com');
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
    <div className="min-h-screen bg-[#e8e3d8]">
      
      {/* ══════════════════════════════════════════════════════════════════════════════ */}
      {/* HEADER - Beige background with centered branding */}
      {/* ══════════════════════════════════════════════════════════════════════════════ */}
      <header className="bg-[#e8e3d8] border-b border-[#c4b5a0]">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center">
          <h1 className="text-5xl md:text-6xl font-serif italic text-[#2c2416] mb-2">
            Advoverse ⚖
          </h1>
          <p className="text-xs uppercase tracking-[0.3em] text-[#6b5d4f]">
            Traditional Legal Style
          </p>
        </div>

        {/* Dark Navigation Bar */}
        <nav className="bg-[#1a1f2e] text-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-center gap-12 py-4">
              <a href="#features" className="text-sm hover:text-[#d4a574] transition">Features</a>
              <a href="#plans" className="text-sm hover:text-[#d4a574] transition">Plans</a>
              <a href="#payments" className="text-sm hover:text-[#d4a574] transition">Payments</a>
              <a href="#contact" className="text-sm hover:text-[#d4a574] transition">Contact</a>
            </div>
          </div>
        </nav>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════════════ */}
      {/* HERO SECTION - Background image with dark overlay and content box */}
      {/* ══════════════════════════════════════════════════════════════════════════════ */}
      <section 
        className="relative min-h-[600px] bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=2070&auto=format&fit=crop')`
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="max-w-2xl">
            {/* Content Box with dark semi-transparent background */}
            <div className="bg-black/60 backdrop-blur-sm p-10 rounded-lg">
              <div className="flex items-center gap-2 text-white/80 text-sm mb-6">
                <span>⚖</span>
                <span>Professional Litigation Infrastructure</span>
              </div>

              <h2 className="text-5xl md:text-6xl font-serif font-bold text-white leading-tight mb-6">
                Organise. Strategize.<br />Succeed.
              </h2>

              <p className="text-lg text-white/90 mb-6">
                Your Practice. Effortless. Secure. Intelligent.
              </p>

              <p className="text-base text-white/80 leading-relaxed mb-8">
                Advoverse (Caseline) is an all‑in‑one litigation management infrastructure for advocates and law chambers. 
                Built for organised litigation practice, strategic workflow and disciplined chamber operations. 
                Designed to streamline workflow, reduce operational confusion and strengthen strategic legal practice.
              </p>

              <div className="flex flex-wrap gap-6 text-sm text-white/80 mb-8">
                <div className="flex items-center gap-2">
                  <span>⚖</span>
                  <span>Offline-First Privacy</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>⚖</span>
                  <span>Structured Chamber Workflow</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>⚖</span>
                  <span>Litigation Intelligence</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <a 
                  href="#plans"
                  className="px-8 py-3 bg-[#8b7355] text-white font-medium hover:bg-[#6d5a43] transition"
                >
                  View Subscription Plans
                </a>
                <a 
                  href="#features"
                  className="px-8 py-3 border-2 border-white/30 text-white font-medium hover:bg-white/10 transition"
                >
                  Explore Features
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════════════ */}
      {/* DOWNLOAD APPLICATION SECTION */}
      {/* ══════════════════════════════════════════════════════════════════════════════ */}
      <section className="bg-gradient-to-b from-[#f5f1eb] to-[#faf8f5] border-b-2 border-[#8b7355]">
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <div className="mb-8">
            <span className="text-5xl">💻</span>
          </div>
          <h2 className="text-4xl font-serif font-bold mb-6 text-[#2c2416]">
            Download Advoverse Application
          </h2>
          <p className="text-lg text-[#5a4a3a] mb-8 max-w-2xl mx-auto">
            Get started with our desktop application. 30-day free trial included. No credit card required.
          </p>
          
          <div className="bg-white rounded-2xl shadow-xl p-10 mb-8 max-w-3xl mx-auto border-2 border-[#d4a574]">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-left flex-1">
                <h3 className="text-2xl font-serif font-bold mb-3 text-[#2c2416]">Windows Desktop App</h3>
                <ul className="space-y-2 text-[#5a4a3a]">
                  <li className="flex items-center gap-2">
                    <span className="text-[#8b7355]">✓</span>
                    <span>Version: 1.0.0 (Coming Soon)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#8b7355]">✓</span>
                    <span>Size: ~150 MB</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#8b7355]">✓</span>
                    <span>Requires: Windows 10 or later</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#8b7355]">✓</span>
                    <span>30-Day Free Trial Included</span>
                  </li>
                </ul>
              </div>
              <div className="flex flex-col gap-4">
                <button 
                  className="px-10 py-4 bg-[#8b7355] text-white font-bold text-lg hover:bg-[#6d5a43] transition shadow-lg rounded-lg"
                  disabled
                >
                  Download for Windows
                </button>
                <p className="text-sm text-[#8b7355] italic">Coming Soon</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto text-sm text-[#5a4a3a]">
            <div className="bg-white rounded-lg shadow-md p-6 border border-[#d4a574]">
              <div className="text-3xl mb-3">📥</div>
              <h4 className="font-bold mb-2 text-[#2c2416]">1. Download</h4>
              <p>Download the installer from our secure server</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 border border-[#d4a574]">
              <div className="text-3xl mb-3">⚙️</div>
              <h4 className="font-bold mb-2 text-[#2c2416]">2. Install</h4>
              <p>Run the installer and follow simple setup steps</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 border border-[#d4a574]">
              <div className="text-3xl mb-3">🚀</div>
              <h4 className="font-bold mb-2 text-[#2c2416]">3. Start Trial</h4>
              <p>Launch app and start your 30-day free trial</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════════════ */}
      {/* PROBLEMS VS SOLUTIONS */}
      {/* ══════════════════════════════════════════════════════════════════════════════ */}
      <section className="bg-white border-b-2 border-[#8b7355]">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-4xl font-serif font-bold text-center mb-6 text-[#2c2416]">
            Most Chambers Operate in Chaos.
          </h2>
          <p className="text-center text-lg text-[#5a4a3a] mb-16 max-w-3xl mx-auto">
            Caseline transforms scattered litigation practice into an organised,
            strategic and streamlined legal workflow.
          </p>
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-[#d4a574]">
              <h3 className="text-2xl font-serif font-bold mb-6 text-[#2c2416]">Operational Problems</h3>
              <ul className="space-y-3 text-[#5a4a3a]">
                {[
                  'Scattered case files',
                  'Missed hearing dates',
                  'Unstructured client records',
                  'Document confusion',
                  'Dependency on memory',
                  'Clerk coordination issues',
                  'No centralised chamber workflow'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-[#8b4513] mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-[#8b7355]">
              <h3 className="text-2xl font-serif font-bold mb-6 text-[#2c2416]">Caseline Solutions</h3>
              <ul className="space-y-3 text-[#5a4a3a]">
                {[
                  'Organised litigation dashboard',
                  'Structured client management',
                  'Case-wise document organisation',
                  'Hearing and deadline tracking',
                  'Strategic litigation notes',
                  'Searchable legal records',
                  'Efficient chamber coordination'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-[#8b7355] mt-1">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════════════ */}
      {/* FEATURES */}
      {/* ══════════════════════════════════════════════════════════════════════════════ */}
      <section id="features" className="bg-[#faf8f5] border-b-2 border-[#8b7355]">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-4xl font-serif font-bold text-center mb-6 text-[#2c2416]">
            Built for Organised Litigation Practice
          </h2>
          <p className="text-center text-lg text-[#5a4a3a] mb-16 max-w-3xl mx-auto">
            Every feature inside Caseline is designed to improve legal workflow,
            reduce confusion and increase operational discipline.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Case Dashboard', desc: 'Track every matter with structured case data, hearing stages, court details, procedural progress and advocate notes.' },
              { title: 'Client Management', desc: 'Maintain organised client profiles with associated matters, contact information, payment tracking and communication records.' },
              { title: 'Litigation Strategy Notes', desc: 'Build structured legal thinking through issue framing, argument preparation, evidence tracking and procedural planning.' },
              { title: 'Document Organisation', desc: 'Centralise pleadings, annexures, applications and drafting references for instant retrieval and reduced clerical confusion.' },
              { title: 'Forms & Drafting System', desc: 'Maintain organised legal forms, procedural templates, drafting structures and reusable litigation formats.' },
              { title: 'Case Compendium', desc: 'Build matter-wise compendiums containing pleadings, evidence, judgments, notes, authorities and indexed references.' },
              { title: 'Study Material Organisation', desc: 'Organise legal research material, landmark judgments, bare acts, procedural references and subject-wise legal study resources.' },
              { title: 'Appointments Diary', desc: 'Maintain professional scheduling for conferences, consultations, hearings, drafting sessions and office appointments.' },
              { title: 'Internal Chamber Chatroom', desc: 'Coordinate securely between advocates, clerks, office staff and agents through an inbuilt internal communication system.' },
              { title: 'Hindi Translation Support', desc: 'Improve accessibility and workflow through integrated Hindi translation support for litigation drafting and office coordination.' },
              { title: 'Offline Privacy Architecture', desc: 'Designed with offline-first functionality to reduce dependency on cloud exposure, helping advocates maintain greater confidentiality.' },
              { title: 'Chamber Workflow', desc: 'Coordinate effectively between advocates, juniors, clerks and office staff within one operational ecosystem.' },
              { title: 'Calendar & Hearings', desc: 'Monitor hearings, limitation periods, filing deadlines and procedural timelines without depending on manual memory.' },
            ].map((feature, i) => (
              <div key={i} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition border border-[#e8e3d8]">
                <h3 className="text-lg font-serif font-bold mb-3 text-[#2c2416]">{feature.title}</h3>
                <p className="text-sm text-[#5a4a3a] leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════════════ */}
      {/* QUOTES */}
      {/* ══════════════════════════════════════════════════════════════════════════════ */}
      <section className="bg-[#f5f1eb] border-b-2 border-[#8b7355]">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <div className="space-y-12">
            {[
              '"An organised chamber is an advocate\'s greatest procedural advantage."',
              '"Discipline in preparation creates confidence in litigation."',
              '"The strength of advocacy lies in organised thought."',
              '"Professional growth begins with operational structure."'
            ].map((quote, i) => (
              <blockquote key={i} className="text-2xl md:text-3xl font-serif italic text-center text-[#2c2416] border-l-4 border-[#8b7355] pl-6">
                {quote}
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════════════ */}
      {/* PHILOSOPHY - Dark background with library aesthetic */}
      {/* ══════════════════════════════════════════════════════════════════════════════ */}
      <section 
        className="relative bg-cover bg-center border-b-2 border-[#8b7355]"
        style={{
          backgroundImage: `linear-gradient(rgba(30, 20, 10, 0.92), rgba(30, 20, 10, 0.92)), url('https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=2070&auto=format&fit=crop')`,
          backgroundColor: '#3d2817'
        }}
      >
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <div className="mb-8">
            <span className="text-5xl">⚖</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-8 text-white">
            An Organised Chamber Wins Time Before It Wins Cases.
          </h2>
          <div className="space-y-6 text-lg text-white/90 leading-relaxed max-w-3xl mx-auto">
            <p className="italic text-xl">
              "Discipline is the silent strength behind every successful litigation practice."
            </p>
            <p className="italic text-xl">
              "An advocate should never waste time searching for what should already be organised."
            </p>
            <p className="text-white/80">
              Caseline is built to reduce operational confusion inside litigation practice.
              It helps advocates think strategically, retrieve information instantly,
              coordinate efficiently and maintain professional discipline.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════════════ */}
      {/* PRICING PLANS */}
      {/* ══════════════════════════════════════════════════════════════════════════════ */}
      <section id="plans" className="bg-[#faf8f5] border-b-2 border-[#8b7355]">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <div className="mb-6">
              <span className="text-4xl">⚖</span>
            </div>
            <h2 className="text-4xl font-serif font-bold mb-4 text-[#2c2416]">Subscription Plans</h2>
            <p className="text-[#5a4a3a]">Monthly and yearly subscription structures for advocates, chambers and expanding litigation practices.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PRICING_PLANS.map((plan, i) => (
              <div key={i} className={`bg-white rounded-xl shadow-lg p-6 flex flex-col relative border ${plan.popular ? 'border-[#8b7355] ring-2 ring-[#8b7355]' : 'border-[#e8e3d8]'}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#8b7355] text-white text-xs font-bold px-3 py-1 rounded-full">
                    POPULAR
                  </div>
                )}
                <h3 className="text-xl font-serif font-bold mb-4 text-[#2c2416]">{plan.name}</h3>
                <div className="text-3xl font-bold text-[#2c2416] mb-1">{plan.displayPrice}</div>
                <div className="text-sm text-[#8b7355] mb-6">₹{plan.yearlyPrice} per year</div>
                <div className="text-sm text-[#5a4a3a] mb-6 flex-1 leading-relaxed whitespace-pre-line">{plan.desc}</div>
                <button
                  onClick={() => handlePlanClick(plan)}
                  disabled={isLoading}
                  className={`w-full py-3 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed rounded-lg ${plan.popular ? 'bg-[#2c2416] text-white hover:bg-[#1a1410]' : 'bg-[#2c2416] text-white hover:bg-[#1a1410]'}`}
                >
                  {isLoading ? 'Processing...' : 'Choose Plan'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════════════ */}
      {/* PAYMENTS */}
      {/* ══════════════════════════════════════════════════════════════════════════════ */}
      <section id="payments" className="bg-gradient-to-b from-[#e8f4f8] to-[#d4e8f0] border-b-2 border-[#8b7355]">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center border-2 border-[#d4a574]">
            <div className="mb-6">
              <span className="text-5xl">💳</span>
            </div>
            <h2 className="text-4xl font-serif font-bold mb-6 text-[#2c2416]">
              Secure Subscription Payments
            </h2>
            <p className="text-lg text-[#5a4a3a] mb-12 max-w-2xl mx-auto">
              Subscribe securely through integrated online payment systems.
              Simple onboarding. Monthly access. Professional support.
            </p>
            <div className="flex flex-wrap justify-center gap-12 items-center">
              <div className="text-3xl font-bold text-[#5374f8]">Razorpay</div>
              <div className="text-3xl font-bold text-[#00bfa5]">Cashfree</div>
              <div className="text-3xl font-bold text-[#3c8dbc]">PayU</div>
            </div>
            <div className="mt-10 pt-8 border-t border-[#e8e3d8]">
              <p className="text-sm text-[#5a4a3a]">
                All transactions are encrypted and secure. Your payment information is never stored on our servers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════════════ */}
      {/* CONTACT */}
      {/* ══════════════════════════════════════════════════════════════════════════════ */}
      <section id="contact" className="bg-[#faf8f5] border-b-2 border-[#8b7355]">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <div className="mb-8 text-center">
            <span className="text-5xl">📞</span>
          </div>
          <h2 className="text-4xl font-serif font-bold text-center mb-6 text-[#2c2416]">
            Contact Advoverse
          </h2>
          <p className="text-center text-lg text-[#5a4a3a] mb-16">
            For subscriptions, onboarding support and chamber integration assistance.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-[#e8e3d8] hover:shadow-xl transition">
              <div className="text-4xl mb-4">📧</div>
              <h3 className="text-xl font-serif font-bold mb-3 text-[#2c2416]">Email</h3>
              <a href="mailto:support@advoverse.com" className="text-[#8b7355] hover:underline font-medium">
                support@advoverse.com
              </a>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-[#e8e3d8] hover:shadow-xl transition">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-xl font-serif font-bold mb-3 text-[#2c2416]">Phone</h3>
              <p className="text-[#5a4a3a] font-medium">+91 XXXXX XXXXX</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-[#e8e3d8] hover:shadow-xl transition">
              <div className="text-4xl mb-4">🕐</div>
              <h3 className="text-xl font-serif font-bold mb-3 text-[#2c2416]">Support Hours</h3>
              <p className="text-[#5a4a3a] font-medium">Monday to Saturday</p>
              <p className="text-[#5a4a3a] font-medium">10:00 AM — 7:00 PM</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════════════ */}
      {/* FOOTER */}
      {/* ══════════════════════════════════════════════════════════════════════════════ */}
      <footer className="bg-gradient-to-b from-[#2c2416] to-[#1a1410] text-white border-t-4 border-[#8b7355]">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="text-4xl">⚖</span>
              <h3 className="text-3xl font-serif font-bold italic">Advoverse</h3>
            </div>
            <p className="text-base text-gray-300 max-w-2xl mx-auto leading-relaxed mb-6">
              Traditional Legal Style branding inspired by premium litigation chambers,
              law libraries, judicial discipline and organised professional advocacy.
            </p>
            <div className="flex justify-center gap-8 text-sm text-gray-400 mb-6">
              <a href="#features" className="hover:text-[#d4a574] transition">Features</a>
              <a href="#plans" className="hover:text-[#d4a574] transition">Plans</a>
              <a href="#payments" className="hover:text-[#d4a574] transition">Payments</a>
              <a href="#contact" className="hover:text-[#d4a574] transition">Contact</a>
            </div>
          </div>
          <div className="text-center pt-8 border-t border-gray-700">
            <p className="text-base text-gray-300 font-serif mb-2">⚖ Advoverse | Caseline ⚖</p>
            <p className="text-sm text-gray-400 mt-3">
              Professional litigation management infrastructure for advocates and chambers.
            </p>
            <p className="text-sm text-gray-500 mt-6 italic font-serif">
              "Organisation in litigation is not convenience — it is professional strength."
            </p>
            <p className="text-xs text-gray-600 mt-8">
              © 2026 Advoverse. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* ══════════════════════════════════════════════════════════════════════════════ */}
      {/* MODALS */}
      {/* ══════════════════════════════════════════════════════════════════════════════ */}
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
