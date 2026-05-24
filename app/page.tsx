'use client';

import { useState, useEffect } from 'react';
import { PaymentMethodModal } from '@/components/PaymentMethodModal';
import { AuthModal } from '@/components/AuthModal';
import { DurationSelectionModal } from '@/components/DurationSelectionModal';
import { PricingPlan, RazorpayPaymentResponse } from '@/lib/types/payment';
import { initiateRazorpayPayment, verifyRazorpayPayment, createStripeSession } from '@/lib/payment';
import { createClient } from '@/lib/supabase/client';

const PRICING_PLANS: PricingPlan[] = [
  { 
    name: 'Junior Advocate', 
    price: 100, 
    displayPrice: '₹100', 
    quarterlyPrice: 270,  // 10% discount
    yearlyPrice: 960,     // 20% discount
    desc: '20 Cases\nIdeal for beginners' 
  },
  { 
    name: 'Solo Advocate', 
    price: 200, 
    displayPrice: '₹200', 
    quarterlyPrice: 540,
    yearlyPrice: 1920, 
    desc: '60 Cases\nIndependent practice setup' 
  },
  { 
    name: 'Advocate + Clerk', 
    price: 300, 
    displayPrice: '₹300', 
    quarterlyPrice: 810,
    yearlyPrice: 2880, 
    desc: '1 Additional User\n120 Cases\nClerk coordination workflow', 
    popular: true 
  },
  { 
    name: 'Chamber Lite', 
    price: 800, 
    displayPrice: '₹800', 
    quarterlyPrice: 2160,
    yearlyPrice: 7680, 
    desc: '3 Users\n200 Cases\nSmall chamber management' 
  },
  { 
    name: 'Chamber', 
    price: 1500, 
    displayPrice: '₹1500', 
    quarterlyPrice: 4050,
    yearlyPrice: 14400, 
    desc: '6 Users\n500 Cases\nProfessional chamber workflow' 
  },
  { 
    name: 'Chamber Pro', 
    price: 3000, 
    displayPrice: '₹3000', 
    quarterlyPrice: 8100,
    yearlyPrice: 28800, 
    desc: '9 Users\nUnlimited Cases\nAdvanced litigation management' 
  },
  { 
    name: 'Exclusive', 
    price: 5000, 
    displayPrice: '₹5000', 
    quarterlyPrice: 13500,
    yearlyPrice: 48000, 
    desc: 'Unlimited Users\nUnlimited Cases\nEnterprise legal operations' 
  },
];

type CurrentUser = { name: string; email: string; token: string };

export default function AdvoverseWebsite() {
  const [isLoading, setIsLoading] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDurationModalOpen, setIsDurationModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [selectedPrice, setSelectedPrice] = useState<number>(0);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  // Check for logged-in user on mount
  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const userName = session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User';
        setCurrentUser({
          name: userName,
          email: session.user.email!,
          token: session.access_token,
        });
      }
    };
    
    checkUser();

    // Listen for auth changes
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const userName = session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User';
        setCurrentUser({
          name: userName,
          email: session.user.email!,
          token: session.access_token,
        });
      } else {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handlePlanClick = (plan: PricingPlan) => {
    setSelectedPlan(plan);
    if (!currentUser) {
      setAuthMode('register');
      setIsAuthModalOpen(true);
    } else {
      // Show duration selection modal
      setIsDurationModalOpen(true);
    }
  };

  const handleDurationSelect = (duration: 'monthly' | 'quarterly' | 'yearly', price: number) => {
    setSelectedDuration(duration);
    setSelectedPrice(price);
    setIsPaymentModalOpen(true);
  };

  const handleAuthSuccess = (user: CurrentUser) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);
    if (selectedPlan) setIsDurationModalOpen(true);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setCurrentUser(null);
    alert('You have been signed out successfully.');
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
        selectedDuration,
        selectedPrice,
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
    <div className="min-h-screen" style={{ background: '#f7f4ef', fontFamily: 'Inter, sans-serif', color: '#2d2d2d' }}>
      
      {/* HEADER */}
      <header style={{ background: '#f5eee4', paddingTop: '18px', borderBottom: '1px solid #cbb8a4' }}>
        <div className="max-w-[1300px] mx-auto w-[90%]">
          <nav className="flex flex-col items-center gap-4">
            <div className="w-full flex justify-between items-center">
              <div className="flex-1"></div>
              <div className="flex-1 text-center" style={{ fontFamily: 'Playfair Display, serif', fontSize: '72px', fontStyle: 'italic', fontWeight: 500, color: '#2f1d16', lineHeight: 1, letterSpacing: '1px' }}>
                Advoverse ⚖
              </div>
              <div className="flex-1 flex justify-end items-center gap-4">
                {currentUser ? (
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div style={{ fontSize: '14px', color: '#6b4b3e', fontWeight: 600 }}>
                        {currentUser.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        {currentUser.email}
                      </div>
                    </div>
                    <a
                      href="/my-licenses"
                      className="px-5 py-2 rounded-lg text-white transition-colors"
                      style={{ background: '#f59e0b', fontSize: '14px', textDecoration: 'none' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#d97706'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#f59e0b'}
                    >
                      My Licenses
                    </a>
                    <button
                      onClick={handleSignOut}
                      className="px-5 py-2 rounded-lg text-white transition-colors"
                      style={{ background: '#6b4b3e', fontSize: '14px' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#7a5647'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#6b4b3e'}
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setIsAuthModalOpen(true);
                    }}
                    className="px-5 py-2 rounded-lg text-white transition-colors"
                    style={{ background: '#6b4b3e', fontSize: '14px' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#7a5647'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#6b4b3e'}
                  >
                    Sign In
                  </button>
                )}
              </div>
            </div>
            <div className="flex justify-center w-full gap-10 py-4" style={{ fontSize: '15px', color: '#f4e7d3', background: 'linear-gradient(to right, #07111d, #0f1d2e)', borderTop: '1px solid #3d2b21', borderBottom: '1px solid #3d2b21' }}>
              <a href="#features" className="transition-opacity hover:opacity-80">Features</a>
              <a href="#pricing" className="transition-opacity hover:opacity-80">Plans</a>
              <a href="#payment" className="transition-opacity hover:opacity-80">Payments</a>
              <a href="#contact" className="transition-opacity hover:opacity-80">Contact</a>
            </div>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section 
        className="min-h-[96vh] flex items-center text-white"
        style={{
          background: 'linear-gradient(rgba(24, 14, 10, 0.76), rgba(24, 14, 10, 0.76)), url(https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=2000&auto=format&fit=crop)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="max-w-[1300px] mx-auto w-[90%]">
          <div className="max-w-[760px]" style={{ padding: '45px', borderRadius: '18px', background: 'rgba(10, 7, 5, 0.42)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ marginBottom: '22px', fontSize: '18px', color: '#d8c6b7', letterSpacing: '1px' }}>
              ⚖ Professional Litigation Infrastructure
            </div>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '68px', lineHeight: 1.15, fontWeight: 700, marginBottom: '28px' }}>
              Organise. Strategize. Succeed.
            </h1>
            <p style={{ fontSize: '20px', color: '#e8dfd5', marginBottom: '35px' }}>
              Your Practice. Effortless. Secure. Intelligent.<br /><br />
              Advoverse (Caseline) is an all-in-one litigation management infrastructure for advocates and law chambers.
              Built for organised litigation practice, strategic workflow and disciplined chamber operations.
              Designed to streamline workflow, reduce operational confusion and strengthen strategic legal practice.
            </p>
            <div className="flex flex-wrap gap-7" style={{ margin: '34px 0', padding: '18px 24px', fontSize: '17px', color: '#ead7c4', background: 'rgba(0,0,0,0.18)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span>⚖ Offline-First Privacy</span>
              <span>⚖ Structured Chamber Workflow</span>
              <span>⚖ Litigation Intelligence</span>
            </div>
            <div className="flex flex-wrap gap-5">
              <a href="#pricing" className="px-9 py-4 rounded-xl text-white transition-colors" style={{ background: '#6b4b3e' }} onMouseEnter={(e) => e.currentTarget.style.background = '#7a5647'} onMouseLeave={(e) => e.currentTarget.style.background = '#6b4b3e'}>
                View Subscription Plans
              </a>
              <a href="#features" className="px-9 py-4 rounded-xl text-white transition-colors" style={{ border: '1px solid rgba(255,255,255,0.4)' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                Explore Features
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* DOWNLOAD APPLICATION */}
      <section className="py-24" style={{ background: '#f1ebe4' }}>
        <div className="max-w-[1300px] mx-auto w-[90%]">
          <h2 className="text-center mb-5" style={{ fontFamily: 'Playfair Display, serif', fontSize: '46px', color: '#3b2a22' }}>
            Download Advoverse Application
          </h2>
          <p className="max-w-[800px] mx-auto mb-16 text-center" style={{ color: '#666', fontSize: '18px' }}>
            Get started with our desktop application. 30-day free trial included. No credit card required.
          </p>
          <div className="max-w-[900px] mx-auto bg-white rounded-3xl" style={{ padding: '50px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #ddd' }}>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="mb-6" style={{ fontSize: '32px', color: '#3b2a22', fontFamily: 'Playfair Display, serif' }}>
                  Windows Desktop App
                </h3>
                <ul className="space-y-3" style={{ color: '#666' }}>
                  <li className="flex items-start gap-3">
                    <span style={{ color: '#6b4b3e', fontSize: '20px' }}>✓</span>
                    <span>Version: 1.0.0 (Coming Soon)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span style={{ color: '#6b4b3e', fontSize: '20px' }}>✓</span>
                    <span>Size: ~150 MB</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span style={{ color: '#6b4b3e', fontSize: '20px' }}>✓</span>
                    <span>Requires: Windows 10 or later</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span style={{ color: '#6b4b3e', fontSize: '20px' }}>✓</span>
                    <span>30-Day Free Trial Included</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span style={{ color: '#6b4b3e', fontSize: '20px' }}>✓</span>
                    <span>Offline-First Architecture</span>
                  </li>
                </ul>
              </div>
              <div className="text-center">
                <div className="mb-6" style={{ fontSize: '80px' }}>💻</div>
                <button 
                  disabled
                  className="w-full py-4 rounded-xl text-white font-semibold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: '#3b2a22' }}
                >
                  Download for Windows
                </button>
                <p className="mt-4" style={{ color: '#6b4b3e', fontStyle: 'italic' }}>Coming Soon</p>
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-8 mt-12 max-w-[900px] mx-auto">
            <div className="bg-white rounded-2xl text-center" style={{ padding: '35px', boxShadow: '0 10px 25px rgba(0,0,0,0.04)' }}>
              <div className="mb-4" style={{ fontSize: '48px' }}>📥</div>
              <h4 className="mb-3" style={{ fontSize: '20px', color: '#3b2a22', fontFamily: 'Playfair Display, serif' }}>1. Download</h4>
              <p style={{ color: '#666', fontSize: '15px' }}>Download the installer from our secure server</p>
            </div>
            <div className="bg-white rounded-2xl text-center" style={{ padding: '35px', boxShadow: '0 10px 25px rgba(0,0,0,0.04)' }}>
              <div className="mb-4" style={{ fontSize: '48px' }}>⚙️</div>
              <h4 className="mb-3" style={{ fontSize: '20px', color: '#3b2a22', fontFamily: 'Playfair Display, serif' }}>2. Install</h4>
              <p style={{ color: '#666', fontSize: '15px' }}>Run the installer and follow simple setup steps</p>
            </div>
            <div className="bg-white rounded-2xl text-center" style={{ padding: '35px', boxShadow: '0 10px 25px rgba(0,0,0,0.04)' }}>
              <div className="mb-4" style={{ fontSize: '48px' }}>🚀</div>
              <h4 className="mb-3" style={{ fontSize: '20px', color: '#3b2a22', fontFamily: 'Playfair Display, serif' }}>3. Start Trial</h4>
              <p style={{ color: '#666', fontSize: '15px' }}>Launch app and start your 30-day free trial</p>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEMS */}
      <section className="py-24">
        <div className="max-w-[1300px] mx-auto w-[90%]">
          <h2 className="text-center mb-5" style={{ fontFamily: 'Playfair Display, serif', fontSize: '46px', color: '#3b2a22' }}>
            Most Chambers Operate in Chaos.
          </h2>
          <p className="max-w-[800px] mx-auto mb-16 text-center" style={{ color: '#666', fontSize: '18px' }}>
            Caseline transforms scattered litigation practice into an organised, strategic and streamlined legal workflow.
          </p>
          <div className="grid gap-10" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
            <div className="bg-white rounded-2xl" style={{ padding: '40px', borderLeft: '5px solid #6b4b3e', boxShadow: '0 10px 40px rgba(0,0,0,0.06)' }}>
              <h3 className="mb-6" style={{ fontSize: '28px', color: '#3b2a22', fontFamily: 'Playfair Display, serif' }}>
                Operational Problems
              </h3>
              <ul>
                {['Scattered case files', 'Missed hearing dates', 'Unstructured client records', 'Document confusion', 'Dependency on memory', 'Clerk coordination issues', 'No centralised chamber workflow'].map((item, i) => (
                  <li key={i} className="py-2.5" style={{ color: '#555', borderBottom: '1px solid #eee' }}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl" style={{ padding: '40px', borderLeft: '5px solid #6b4b3e', boxShadow: '0 10px 40px rgba(0,0,0,0.06)' }}>
              <h3 className="mb-6" style={{ fontSize: '28px', color: '#3b2a22', fontFamily: 'Playfair Display, serif' }}>
                Caseline Solutions
              </h3>
              <ul>
                {['Organised litigation dashboard', 'Structured client management', 'Case-wise document organisation', 'Hearing and deadline tracking', 'Strategic litigation notes', 'Searchable legal records', 'Efficient chamber coordination'].map((item, i) => (
                  <li key={i} className="py-2.5" style={{ color: '#555', borderBottom: '1px solid #eee' }}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24" style={{ background: '#f1ebe4' }}>
        <div className="max-w-[1300px] mx-auto w-[90%]">
          <h2 className="text-center mb-5" style={{ fontFamily: 'Playfair Display, serif', fontSize: '46px', color: '#3b2a22' }}>
            Built for Organised Litigation Practice
          </h2>
          <p className="max-w-[800px] mx-auto mb-16 text-center" style={{ color: '#666', fontSize: '18px' }}>
            Every feature inside Caseline is designed to improve legal workflow, reduce confusion and increase operational discipline.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
              <div key={i} className="bg-white rounded-2xl transition-transform hover:-translate-y-1.5" style={{ padding: '35px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                <h3 className="mb-5" style={{ fontSize: '26px', color: '#3b2a22', fontFamily: 'Playfair Display, serif' }}>
                  {feature.title}
                </h3>
                <p style={{ color: '#666' }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QUOTES STRIP */}
      <section className="py-9" style={{ background: '#2d1d15', color: '#f0e6da', borderTop: '1px solid #4f392d', borderBottom: '1px solid #4f392d' }}>
        <div className="max-w-[1300px] mx-auto w-[90%]">
          <div className="grid gap-6 text-center" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', fontSize: '15px' }}>
            <div>"An organised chamber is an advocate's greatest procedural advantage."</div>
            <div>"Discipline in preparation creates confidence in litigation."</div>
            <div>"The strength of advocacy lies in organised thought."</div>
            <div>"Professional growth begins with operational structure."</div>
          </div>
        </div>
      </section>

      {/* QUOTE SECTION */}
      <section 
        className="text-center text-white py-24"
        style={{
          background: 'linear-gradient(rgba(40,25,18,0.90), rgba(40,25,18,0.90)), url(https://images.unsplash.com/photo-1568667256549-094345857637?q=80&w=1600&auto=format&fit=crop)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="max-w-[1300px] mx-auto w-[90%]">
          <h2 className="mb-8" style={{ fontFamily: 'Playfair Display, serif', fontSize: '58px', lineHeight: 1.3 }}>
            ⚖ An Organised Chamber Wins Time Before It Wins Cases.
          </h2>
          <p className="max-w-[850px] mx-auto" style={{ color: '#ddd', fontSize: '19px' }}>
            "Discipline is the silent strength behind every successful litigation practice."<br /><br />
            "An advocate should never waste time searching for what should already be organised."<br /><br />
            Caseline is built to reduce operational confusion inside litigation practice.
          </p>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24">
        <div className="max-w-[1300px] mx-auto w-[90%]">
          <h2 className="text-center mb-5" style={{ fontFamily: 'Playfair Display, serif', fontSize: '46px', color: '#3b2a22' }}>
            ⚖ Subscription Plans
          </h2>
          <p className="max-w-[800px] mx-auto mb-16 text-center" style={{ color: '#666', fontSize: '18px' }}>
            Monthly and yearly subscription structures for advocates and chambers.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-7">
            {PRICING_PLANS.map((plan, i) => (
              <div key={i} className="bg-white rounded-2xl transition-transform hover:-translate-y-1.5" style={{ padding: '38px', border: '1px solid #ddd', boxShadow: '0 8px 25px rgba(0,0,0,0.04)' }}>
                <h3 className="mb-2.5" style={{ fontSize: '28px', color: '#3b2a22', fontFamily: 'Playfair Display, serif' }}>
                  {plan.name}
                </h3>
                
                {/* Monthly Option */}
                <div className="mb-3 p-3 rounded-lg" style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Monthly</div>
                  <div style={{ fontSize: '32px', fontWeight: 600, color: '#6b4b3e' }}>
                    {plan.displayPrice}<span style={{ fontSize: '14px', color: '#777' }}> / month</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#999' }}>30 days validity</div>
                </div>

                {/* Quarterly Option */}
                {plan.quarterlyPrice && (
                  <div className="mb-3 p-3 rounded-lg" style={{ background: '#fef3c7', border: '1px solid #fbbf24' }}>
                    <div className="flex justify-between items-center mb-1">
                      <div style={{ fontSize: '13px', color: '#92400e' }}>Quarterly</div>
                      <div style={{ fontSize: '11px', color: '#92400e', background: '#fbbf24', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>SAVE 10%</div>
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 600, color: '#92400e' }}>
                      ₹{plan.quarterlyPrice}<span style={{ fontSize: '14px', color: '#92400e' }}> / 3 months</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#92400e' }}>90 days validity</div>
                  </div>
                )}

                {/* Yearly Option */}
                {plan.yearlyPrice && (
                  <div className="mb-4 p-3 rounded-lg" style={{ background: '#dcfce7', border: '1px solid #22c55e' }}>
                    <div className="flex justify-between items-center mb-1">
                      <div style={{ fontSize: '13px', color: '#14532d' }}>Yearly</div>
                      <div style={{ fontSize: '11px', color: '#14532d', background: '#22c55e', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>SAVE 20%</div>
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 600, color: '#14532d' }}>
                      ₹{plan.yearlyPrice}<span style={{ fontSize: '14px', color: '#14532d' }}> / year</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#14532d' }}>365 days validity</div>
                  </div>
                )}

                <ul className="mb-5">
                  {plan.desc.split('\n').map((item, j) => (
                    <li key={j} className="py-2.5" style={{ color: '#666', borderBottom: '1px solid #eee' }}>{item}</li>
                  ))}
                </ul>
                <button
                  onClick={() => handlePlanClick(plan)}
                  disabled={isLoading}
                  className="w-full mt-5 py-3.5 rounded-xl text-center text-white transition-colors disabled:opacity-50"
                  style={{ background: '#3b2a22' }}
                  onMouseEnter={(e) => !isLoading && (e.currentTarget.style.background = '#4a352b')}
                  onMouseLeave={(e) => !isLoading && (e.currentTarget.style.background = '#3b2a22')}
                >
                  {isLoading ? 'Processing...' : 'Choose Plan'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PAYMENT */}
      <section id="payment" className="text-center py-24" style={{ background: '#dce8f2' }}>
        <div className="max-w-[1300px] mx-auto w-[90%]">
          <div className="max-w-[900px] mx-auto bg-white rounded-3xl" style={{ padding: '50px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
            <h3 className="mb-5" style={{ fontSize: '38px', color: '#3b2a22', fontFamily: 'Playfair Display, serif' }}>
              Secure Subscription Payments
            </h3>
            <p className="mb-6" style={{ color: '#666', fontSize: '18px' }}>
              Subscribe securely through integrated online payment systems. Simple onboarding. Monthly access. Professional support.
            </p>
            <div className="flex justify-center flex-wrap gap-5">
              <span className="px-6 py-3 rounded-xl" style={{ background: '#f1ebe4', color: '#3b2a22' }}>Razorpay</span>
              <span className="px-6 py-3 rounded-xl" style={{ background: '#f1ebe4', color: '#3b2a22' }}>Cashfree</span>
              <span className="px-6 py-3 rounded-xl" style={{ background: '#f1ebe4', color: '#3b2a22' }}>PayU</span>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-24">
        <div className="max-w-[1300px] mx-auto w-[90%]">
          <h2 className="text-center mb-5" style={{ fontFamily: 'Playfair Display, serif', fontSize: '46px', color: '#3b2a22' }}>
            Contact Advoverse
          </h2>
          <p className="max-w-[800px] mx-auto mb-16 text-center" style={{ color: '#666', fontSize: '18px' }}>
            For subscriptions, onboarding support and chamber integration assistance.
          </p>
          <div className="grid gap-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            <div className="bg-white rounded-2xl" style={{ padding: '35px', boxShadow: '0 10px 25px rgba(0,0,0,0.04)' }}>
              <h3 className="mb-4" style={{ fontSize: '28px', color: '#3b2a22', fontFamily: 'Playfair Display, serif' }}>Email</h3>
              <p style={{ color: '#666' }}>support@advoverse.com</p>
            </div>
            <div className="bg-white rounded-2xl" style={{ padding: '35px', boxShadow: '0 10px 25px rgba(0,0,0,0.04)' }}>
              <h3 className="mb-4" style={{ fontSize: '28px', color: '#3b2a22', fontFamily: 'Playfair Display, serif' }}>Phone</h3>
              <p style={{ color: '#666' }}>+91 XXXXX XXXXX</p>
            </div>
            <div className="bg-white rounded-2xl" style={{ padding: '35px', boxShadow: '0 10px 25px rgba(0,0,0,0.04)' }}>
              <h3 className="mb-4" style={{ fontSize: '28px', color: '#3b2a22', fontFamily: 'Playfair Display, serif' }}>Support Hours</h3>
              <p style={{ color: '#666' }}>Monday to Saturday<br />10:00 AM — 7:00 PM</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER BRAND */}
      <section className="py-20 text-center" style={{ background: '#efe7dd', borderTop: '1px solid #d8cabc', borderBottom: '1px solid #d8cabc' }}>
        <div className="max-w-[1300px] mx-auto w-[90%]">
          <div className="mb-5" style={{ fontSize: '72px', fontStyle: 'italic', color: '#3b2a22', fontFamily: 'Playfair Display, serif' }}>
            ⚖ Advoverse
          </div>
          <p className="max-w-[850px] mx-auto" style={{ color: '#6b5a4d', fontSize: '18px' }}>
            Traditional Legal Style branding inspired by premium litigation chambers, law libraries, judicial discipline and organised professional advocacy.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 text-center text-white" style={{ background: '#3b2a22' }}>
        <div className="max-w-[1300px] mx-auto w-[90%]">
          <h2 className="mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>⚖ Advoverse | Caseline ⚖</h2>
          <p style={{ color: '#c9c1b8' }}>
            Professional litigation management infrastructure for advocates and chambers.
          </p>
        </div>
      </footer>

      {/* MODALS */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        mode={authMode}
        onModeChange={setAuthMode}
        onSuccess={handleAuthSuccess}
      />
      <DurationSelectionModal
        isOpen={isDurationModalOpen}
        onClose={() => setIsDurationModalOpen(false)}
        plan={selectedPlan}
        onSelectDuration={handleDurationSelect}
      />
      <PaymentMethodModal
        isOpen={isPaymentModalOpen}
        onClose={closePaymentModal}
        planName={selectedPlan?.name || ''}
        price={selectedPrice}
        onSelectRazorpay={handleRazorpayPayment}
        onSelectStripe={handleStripePayment}
        isLoading={isLoading}
      />
    </div>
  );
}
