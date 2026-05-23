'use client';

import { useState } from 'react';
import { PaymentMethodModal } from '@/components/PaymentMethodModal';
import { AuthModal } from '@/components/AuthModal';
import { PricingPlan, RazorpayPaymentResponse } from '@/lib/types/payment';
import { initiateRazorpayPayment, verifyRazorpayPayment, createStripeSession } from '@/lib/payment';

const PRICING_PLANS: PricingPlan[] = [
  { name: 'Junior Advocate', price: 100, displayPrice: '₹100/month', yearlyPrice: 1000, desc: '0 Additional Users • 20 Cases • Ideal for beginners' },
  { name: 'Solo Advocate', price: 200, displayPrice: '₹200/month', yearlyPrice: 2000, desc: '0 Additional Users • 60 Cases • Independent practice setup' },
  { name: 'Advocate + Clerk', price: 300, displayPrice: '₹300/month', yearlyPrice: 3000, desc: '1 Additional User • 120 Cases • Clerk coordination workflow', popular: true },
  { name: 'Chamber Lite', price: 800, displayPrice: '₹800/month', yearlyPrice: 8000, desc: '3 Users • 200 Cases • Small chamber management' },
  { name: 'Chamber', price: 1500, displayPrice: '₹1500/month', yearlyPrice: 15000, desc: '6 Users • 500 Cases • Professional chamber workflow' },
  { name: 'Chamber Pro', price: 3000, displayPrice: '₹3000/month', yearlyPrice: 30000, desc: '9 Users • Unlimited Cases • Advanced litigation management' },
  { name: 'Exclusive', price: 5000, displayPrice: '₹5000/month', yearlyPrice: 50000, desc: 'Unlimited Users • Unlimited Cases • Enterprise legal operations' },
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
    <div className="min-h-screen bg-[#faf8f5] text-[#2c2416] font-serif">

      {/* ── HEADER ── */}
      <header className="w-full border-b border-[#8b7355] sticky top-0 z-50 bg-[#faf8f5]">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center border-b border-gray-200">
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-4xl font-bold tracking-wide text-[#2c2416] italic">Advoverse ⚖</h1>
            <p className="text-xs text-[#8b7355] uppercase tracking-[0.3em]">Traditional Legal Style</p>
          </div>
        </div>
        <nav className="bg-[#1a1a2e] text-white">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="hidden md:flex gap-8 text-sm font-medium mx-auto">
              <a href="#features" className="hover:text-[#d4a574] transition">Features</a>
              <a href="#plans" className="hover:text-[#d4a574] transition">Plans</a>
              <a href="#payments" className="hover:text-[#d4a574] transition">Payments</a>
              <a href="#contact" className="hover:text-[#d4a574] transition">Contact</a>
            </div>
            <div className="flex gap-3 text-sm ml-auto">
              {currentUser ? (
                <div className="flex items-center gap-3">
                  <span className="text-white text-sm font-medium">{currentUser.name.split(' ')[0]}</span>
                  <button onClick={() => setCurrentUser(null)}
                    className="px-4 py-2 border border-white/30 hover:bg-white/10 transition font-medium">
                    Logout
                  </button>
                </div>
              ) : (
                <>
                  <button onClick={() => { setAuthMode('login'); setIsAuthModalOpen(true); }}
                    className="px-4 py-2 border border-white/30 hover:bg-white/10 transition font-medium">
                    Login
                  </button>
                  <button onClick={() => { setAuthMode('register'); setIsAuthModalOpen(true); }}
                    className="px-4 py-2 bg-[#8b7355] text-white font-medium hover:bg-[#6d5a43] transition">
                    Register
                  </button>
                </>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* ── HERO ── */}
      <section className="relative bg-gradient-to-br from-[#2c2416] via-[#3d3428] to-[#2c2416] text-white border-b-2 border-[#8b7355] overflow-hidden">
        {/* Background pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'}}></div>
        
        <div className="max-w-6xl mx-auto px-6 py-24 relative z-10">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-2xl">⚖</span>
              <span className="text-sm uppercase tracking-wider text-[#d4a574]">Professional Litigation Infrastructure</span>
            </div>
            
            <h2 className="text-5xl md:text-6xl font-bold leading-tight mb-8">
              Organise. Strategize.<br />Succeed.
            </h2>
            
            <p className="text-xl text-gray-300 mb-6">
              Your Practice. Effortless. Secure. Intelligent.
            </p>
            
            <p className="text-base text-gray-400 leading-relaxed mb-10 max-w-2xl">
              Advoverse (Caseline) is an all‑in‑one litigation management infrastructure for advocates and law chambers. 
              Built for organised litigation practice, strategic workflow and disciplined chamber operations. 
              Designed to streamline workflow, reduce operational confusion and strengthen strategic legal practice.
            </p>
            
            <div className="flex flex-wrap gap-6 mb-10 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-[#d4a574]">⚖</span>
                <span>Offline-First Privacy</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#d4a574]">⚖</span>
                <span>Structured Chamber Workflow</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#d4a574]">⚖</span>
                <span>Litigation Intelligence</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <a href="#plans"
                className="px-8 py-4 bg-[#8b7355] text-white font-semibold hover:bg-[#6d5a43] transition shadow-lg">
                View Subscription Plans
              </a>
              <a href="#features"
                className="px-8 py-4 border-2 border-white/30 text-white font-semibold hover:bg-white/10 transition">
                Explore Features
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROBLEMS VS SOLUTIONS ── */}
      <section className="bg-white border-b-2 border-[#8b7355]">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-4xl font-bold text-center mb-6 text-[#2c2416]">
            Most Chambers Operate in Chaos.
          </h2>
          <p className="text-center text-lg text-[#5a4a3a] mb-16 max-w-3xl mx-auto">
            Caseline transforms scattered litigation practice into an organised,
            strategic and streamlined legal workflow.
          </p>
          <div className="grid md:grid-cols-2 gap-12">
            <div className="border-2 border-[#d4a574] bg-[#fef9f3] p-8">
              <h3 className="text-2xl font-bold mb-6 text-[#8b4513]">Operational Problems</h3>
              <ul className="space-y-3 text-[#5a4a3a]">
                <li className="flex items-start gap-3">
                  <span className="text-[#8b4513] mt-1">•</span>
                  <span>Scattered case files</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#8b4513] mt-1">•</span>
                  <span>Missed hearing dates</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#8b4513] mt-1">•</span>
                  <span>Unstructured client records</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#8b4513] mt-1">•</span>
                  <span>Document confusion</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#8b4513] mt-1">•</span>
                  <span>Dependency on memory</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#8b4513] mt-1">•</span>
                  <span>Clerk coordination issues</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#8b4513] mt-1">•</span>
                  <span>No centralised chamber workflow</span>
                </li>
              </ul>
            </div>
            <div className="border-2 border-[#8b7355] bg-[#f5f1eb] p-8">
              <h3 className="text-2xl font-bold mb-6 text-[#2c2416]">Caseline Solutions</h3>
              <ul className="space-y-3 text-[#5a4a3a]">
                <li className="flex items-start gap-3">
                  <span className="text-[#8b7355] mt-1">✓</span>
                  <span>Organised litigation dashboard</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#8b7355] mt-1">✓</span>
                  <span>Structured client management</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#8b7355] mt-1">✓</span>
                  <span>Case-wise document organisation</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#8b7355] mt-1">✓</span>
                  <span>Hearing and deadline tracking</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#8b7355] mt-1">✓</span>
                  <span>Strategic litigation notes</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#8b7355] mt-1">✓</span>
                  <span>Searchable legal records</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#8b7355] mt-1">✓</span>
                  <span>Efficient chamber coordination</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="bg-[#faf8f5] border-b-2 border-[#8b7355]">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-4xl font-bold text-center mb-6 text-[#2c2416]">
            Built for Organised Litigation Practice
          </h2>
          <p className="text-center text-lg text-[#5a4a3a] mb-16 max-w-3xl mx-auto">
            Every feature inside Caseline is designed to improve legal workflow,
            reduce confusion and increase operational discipline.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: 'Case Dashboard', desc: 'Track every matter with structured case data, hearing stages, court details, procedural progress and advocate notes.' },
              { title: 'Client Management', desc: 'Maintain organised client profiles with associated matters, contact information, payment tracking and communication records.' },
              { title: 'Litigation Strategy Notes', desc: 'Build structured legal thinking through issue framing, argument preparation, evidence tracking and procedural planning.' },
              { title: 'Document Organisation', desc: 'Centralise pleadings, annexures, applications and drafting references for instant retrieval and reduced clerical confusion.' },
              { title: 'Forms & Drafting System', desc: 'Maintain organised legal forms, procedural templates, drafting structures and reusable litigation formats for faster and more disciplined drafting workflow.' },
              { title: 'Case Compendium', desc: 'Build matter-wise compendiums containing pleadings, evidence, judgments, notes, authorities and indexed references in one centralised structure.' },
              { title: 'Study Material Organisation', desc: 'Organise legal research material, landmark judgments, bare acts, procedural references and subject-wise legal study resources.' },
              { title: 'Appointments Diary', desc: 'Maintain professional scheduling for conferences, consultations, hearings, drafting sessions and office appointments through one structured diary system.' },
              { title: 'Internal Chamber Chatroom', desc: 'Coordinate securely between advocates, clerks, office staff and agents through an inbuilt internal communication system.' },
              { title: 'Hindi Translation Support', desc: 'Improve accessibility and workflow through integrated Hindi translation support for litigation drafting and office coordination.' },
              { title: 'Offline Privacy Architecture', desc: 'Designed with offline-first functionality to reduce dependency on cloud exposure, helping advocates maintain greater confidentiality, privacy and data security.' },
              { title: 'Chamber Workflow', desc: 'Coordinate effectively between advocates, juniors, clerks and office staff within one operational ecosystem.' },
              { title: 'Calendar & Hearings', desc: 'Monitor hearings, limitation periods, filing deadlines and procedural timelines without depending on manual memory.' },
            ].map((feature, i) => (
              <div key={i} className="border-2 border-[#d4a574] bg-white p-6 hover:shadow-lg transition">
                <h3 className="text-xl font-bold mb-3 text-[#2c2416]">{feature.title}</h3>
                <p className="text-sm text-[#5a4a3a] leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUOTES ── */}
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

      {/* ── PHILOSOPHY ── */}
      <section className="bg-white border-b-2 border-[#8b7355]">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <div className="mb-8">
            <span className="text-5xl">⚖</span>
          </div>
          <h2 className="text-4xl font-bold mb-8 text-[#2c2416]">
            An Organised Chamber Wins Time Before It Wins Cases.
          </h2>
          <div className="space-y-6 text-lg text-[#5a4a3a] leading-relaxed">
            <p className="italic">
              "Discipline is the silent strength behind every successful litigation practice."
            </p>
            <p className="italic">
              "An advocate should never waste time searching for what should already be organised."
            </p>
            <p>
              Caseline is built to reduce operational confusion inside litigation practice.
              It helps advocates think strategically, retrieve information instantly,
              coordinate efficiently and maintain professional discipline.
            </p>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="plans" className="bg-[#faf8f5] border-b-2 border-[#8b7355]">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <div className="mb-6">
              <span className="text-4xl">⚖</span>
            </div>
            <h2 className="text-4xl font-bold mb-4 text-[#2c2416]">Subscription Plans</h2>
            <p className="text-[#5a4a3a]">Monthly and yearly subscription structures for advocates, chambers and expanding litigation practices.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {PRICING_PLANS.map((plan, i) => (
              <div key={i} className={`border-2 p-6 flex flex-col relative ${plan.popular ? 'border-[#8b7355] bg-[#f5f1eb] shadow-lg' : 'border-[#d4a574] bg-white'}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#8b7355] text-white text-xs font-bold px-3 py-1">
                    POPULAR
                  </div>
                )}
                <h3 className="text-xl font-bold mb-4 text-[#2c2416]">{plan.name}</h3>
                <div className="text-3xl font-bold text-[#8b7355] mb-2">{plan.displayPrice}</div>
                <div className="text-sm text-[#5a4a3a] mb-6">₹{plan.yearlyPrice} per year</div>
                <div className="text-sm text-[#5a4a3a] mb-6 flex-1 leading-relaxed whitespace-pre-line">{plan.desc}</div>
                <button
                  onClick={() => handlePlanClick(plan)}
                  disabled={isLoading}
                  className={`w-full py-3 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${plan.popular ? 'bg-[#8b7355] text-white hover:bg-[#6d5a43]' : 'border-2 border-[#8b7355] text-[#2c2416] hover:bg-[#8b7355] hover:text-white'}`}
                >
                  {isLoading ? 'Processing...' : 'Choose Plan'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PAYMENTS ── */}
      <section id="payments" className="bg-white border-b-2 border-[#8b7355]">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h2 className="text-4xl font-bold mb-6 text-[#2c2416]">
            Secure Subscription Payments
          </h2>
          <p className="text-lg text-[#5a4a3a] mb-12 max-w-2xl mx-auto">
            Subscribe securely through integrated online payment systems.
            Simple onboarding. Monthly access. Professional support.
          </p>
          <div className="flex flex-wrap justify-center gap-8 items-center">
            <div className="text-2xl font-bold text-[#2c2416]">Razorpay</div>
            <div className="text-2xl font-bold text-[#2c2416]">Cashfree</div>
            <div className="text-2xl font-bold text-[#2c2416]">PayU</div>
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="bg-[#faf8f5] border-b-2 border-[#8b7355]">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <h2 className="text-4xl font-bold text-center mb-6 text-[#2c2416]">
            Contact Advoverse
          </h2>
          <p className="text-center text-lg text-[#5a4a3a] mb-16">
            For subscriptions, onboarding support and chamber integration assistance.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="border-2 border-[#d4a574] bg-white p-6 text-center">
              <h3 className="text-xl font-bold mb-3 text-[#2c2416]">Email</h3>
              <a href="mailto:support@advoverse.com" className="text-[#8b7355] hover:underline">
                support@advoverse.com
              </a>
            </div>
            <div className="border-2 border-[#d4a574] bg-white p-6 text-center">
              <h3 className="text-xl font-bold mb-3 text-[#2c2416]">Phone</h3>
              <p className="text-[#5a4a3a]">+91 XXXXX XXXXX</p>
            </div>
            <div className="border-2 border-[#d4a574] bg-white p-6 text-center">
              <h3 className="text-xl font-bold mb-3 text-[#2c2416]">Support Hours</h3>
              <p className="text-[#5a4a3a]">Monday to Saturday</p>
              <p className="text-[#5a4a3a]">10:00 AM — 7:00 PM</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#2c2416] text-white border-t-2 border-[#8b7355]">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-3xl">⚖</span>
              <h3 className="text-2xl font-bold">Advoverse</h3>
            </div>
            <p className="text-sm text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Traditional Legal Style branding inspired by premium litigation chambers,
              law libraries, judicial discipline and organised professional advocacy.
            </p>
          </div>
          <div className="text-center pt-6 border-t border-gray-700">
            <p className="text-sm text-gray-400">⚖ Advoverse | Caseline ⚖</p>
            <p className="text-sm text-gray-400 mt-2">
              Professional litigation management infrastructure for advocates and chambers.
            </p>
            <p className="text-xs text-gray-500 mt-4 italic">
              "Organisation in litigation is not convenience — it is professional strength."
            </p>
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
