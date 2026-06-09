'use client';

export default function SubscriptionPolicyPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f7f4ef', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <header style={{ background: '#3b2a22', padding: '24px 0', borderBottom: '3px solid #f59e0b' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '24px', color: '#f59e0b', margin: 0 }}>⚖ Advoverse</h1>
          </a>
          <a href="/" style={{ padding: '8px 18px', background: '#6b4b3e', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '14px' }}>← Back to Home</a>
        </div>
      </header>

      {/* Content */}
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', color: '#3b2a22', marginBottom: '8px' }}>Subscription & Refund Policy</h1>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '40px' }}>Last Updated: June 2026 | Version 1.0</p>

        {/* Section 1 */}
        <Section title="1. About This Policy">
          <p>This document governs the commercial terms of your subscription to <strong>Caseline — Chamber Management System</strong>. It operates alongside our End User Licence Agreement (EULA). By subscribing, making payment, or continuing use beyond a Trial period, you agree to these terms.</p>
          <p><strong>Licensor, Owner & Author:</strong> Shubham Sakarwal S/o Gyaneshwar Sakarwal, Date of Birth: 14 January 1991, Advocate, Dehradun, Uttarakhand, India. Operating under the trade name: Advoverse Technologies.</p>
        </Section>

        {/* Section 2 */}
        <Section title="2. Subscription Plans">
          <p>Caseline offers the following subscription tiers (subject to change):</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#3b2a22', color: 'white' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left' }}>Plan</th>
                <th style={{ padding: '10px 14px', textAlign: 'left' }}>Billing Options</th>
                <th style={{ padding: '10px 14px', textAlign: 'left' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Junior Advocate', 'Monthly / Quarterly / Half-Yearly / Annual', 'Basic case management for individual advocates'],
                ['Solo Practitioner', 'Monthly / Quarterly / Half-Yearly / Annual', 'Full features for solo practice'],
                ['Advocate + Clerk', 'Monthly / Quarterly / Half-Yearly / Annual', 'Two-user access for advocate and clerk'],
                ['Chamber Lite', 'Monthly / Quarterly / Half-Yearly / Annual', 'Multi-user chamber, essential features'],
                ['Chamber', 'Monthly / Quarterly / Half-Yearly / Annual', 'Full-featured chamber management'],
                ['Chamber Pro', 'Monthly / Quarterly / Half-Yearly / Annual', 'All features, maximum devices'],
                ['Exclusive', 'Custom', 'Enterprise plans with bespoke terms'],
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #e5e7eb', background: i % 2 === 0 ? '#fff' : '#f9f7f4' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#3b2a22' }}>{row[0]}</td>
                  <td style={{ padding: '10px 14px', color: '#555' }}>{row[1]}</td>
                  <td style={{ padding: '10px 14px', color: '#555' }}>{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ marginTop: '12px', fontSize: '13px', color: '#6b7280' }}>Features, device limits, and pricing for each plan are published at <a href="/" style={{ color: '#6b4b3e' }}>advoverse.com</a> and may be updated.</p>
        </Section>

        {/* Section 3 */}
        <Section title="3. Billing & Payment">
          <ul>
            <li><strong>Advance Payment:</strong> Subscriptions are billed in advance. You pay for the upcoming period, not in arrears.</li>
            <li><strong>Currency:</strong> All prices are in Indian Rupees (₹ / INR).</li>
            <li><strong>GST:</strong> All listed prices are <strong>exclusive of GST</strong> (currently 18% for SaaS). GST is charged additionally.</li>
            <li><strong>Due Date:</strong> Payment is due on or before the Renewal Date.</li>
            <li><strong>Invoice:</strong> A GST-compliant tax invoice is generated within 48 hours of payment and available in your dashboard.</li>
            <li><strong>Payment Methods:</strong> UPI, Credit/Debit Card, Net Banking, Razorpay, or bank transfer (for annual plans).</li>
            <li><strong>No Auto-Renewal:</strong> Subscriptions do not auto-renew unless you explicitly opt in. Reminders are sent 7 days before expiry.</li>
          </ul>
        </Section>

        {/* Section 4 */}
        <Section title="4. Payment Failure & Grace Period">
          <p>If payment is not received by the Renewal Date:</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#dc2626', color: 'white' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left' }}>Timeline</th>
                <th style={{ padding: '10px 14px', textAlign: 'left' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Day 0 (Expiry)', 'Subscription expires. Reminder sent.'],
                ['Day 1–3', 'Grace period. Full access continues. Daily reminders.'],
                ['Day 4–7', 'Restricted mode. Core features only. Cloud/sync suspended.'],
                ['Day 8+', 'Licence suspended. Read-only mode. No new entries.'],
                ['Day 30+', 'Licence terminated. Software ceases to function. Data remains on device.'],
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #e5e7eb', background: i % 2 === 0 ? '#fff' : '#fef2f2' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#991b1b' }}>{row[0]}</td>
                  <td style={{ padding: '10px 14px', color: '#555' }}>{row[1]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ marginTop: '12px' }}>Payment at any point during grace/restricted period restores full access immediately.</p>
        </Section>

        {/* Section 5 */}
        <Section title="5. Refund Policy">
          <h3 style={{ color: '#16a34a', fontSize: '16px', marginTop: '16px', marginBottom: '8px' }}>✅ When Refund IS Available</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#dcfce7' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: '#166534' }}>Circumstance</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: '#166534' }}>Eligibility</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: '#166534' }}>Conditions</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '10px 14px' }}>First-time purchase, within 3 days of Activation</td>
                <td style={{ padding: '10px 14px' }}>Up to 100%</td>
                <td style={{ padding: '10px 14px' }}>Software uninstalled, Licence Key surrendered, no data exported</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                <td style={{ padding: '10px 14px' }}>Technical inability to activate (proven incompatibility)</td>
                <td style={{ padding: '10px 14px' }}>Full refund</td>
                <td style={{ padding: '10px 14px' }}>Must demonstrate inability despite troubleshooting</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '10px 14px' }}>Duplicate/accidental payment</td>
                <td style={{ padding: '10px 14px' }}>Full refund of duplicate</td>
                <td style={{ padding: '10px 14px' }}>Report within 7 days with payment proof</td>
              </tr>
            </tbody>
          </table>

          <h3 style={{ color: '#dc2626', fontSize: '16px', marginTop: '24px', marginBottom: '8px' }}>❌ When Refund IS NOT Available</h3>
          <ul>
            <li>After the 3-day window from initial Activation has elapsed</li>
            <li>For any renewal payment (monthly, quarterly, half-yearly, or annual)</li>
            <li>Where the Software has been activated and used (data entered, cases created)</li>
            <li>Where the Licence was terminated for breach of EULA or this Agreement</li>
            <li>Where the Subscriber simply changes their mind or finds an alternative</li>
            <li>Where dissatisfaction is with features clearly described before purchase</li>
            <li>For any Add-on purchases once activated</li>
            <li>Where system requirements (published on website) were not met</li>
          </ul>

          <h3 style={{ color: '#3b2a22', fontSize: '16px', marginTop: '24px', marginBottom: '8px' }}>📋 Refund Process</h3>
          <ol>
            <li>Submit request to <strong>support@advoverse.com</strong> within the applicable window</li>
            <li>Include: Order ID, email address, reason, and confirmation of uninstall</li>
            <li>Eligible refunds processed within <strong>15 business days</strong> to original payment method</li>
            <li>Gateway/processing fees may be deducted</li>
          </ol>

          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '14px 18px', marginTop: '16px' }}>
            <strong style={{ color: '#991b1b' }}>⚠️ Chargebacks:</strong>
            <span style={{ color: '#555' }}> Initiating a bank chargeback without contacting us first will result in immediate permanent termination of your licence and a ban from all Advoverse services.</span>
          </div>
        </Section>

        {/* Section 6 */}
        <Section title="6. Price Changes">
          <ul>
            <li>The Licensor reserves the right to modify subscription fees, add-on pricing, and support charges at any time.</li>
            <li><strong>30 days' advance notice</strong> will be provided before any price increase (via email and/or in-app notification).</li>
            <li>Price changes do <strong>not</strong> affect your current active period. New pricing applies only at your next Renewal Date.</li>
            <li>If you disagree with new pricing, simply do not renew. Access continues until your current period expires.</li>
            <li>Promotional/introductory rates are valid only for the stated period and do not guarantee future pricing.</li>
          </ul>
        </Section>

        {/* Section 7 */}
        <Section title="7. Upgrades & Downgrades">
          <ul>
            <li><strong>Upgrades:</strong> Available anytime. Pro-rated price difference charged immediately. Features activate instantly.</li>
            <li><strong>Downgrades:</strong> Take effect at next Renewal Date only. Cannot be applied mid-cycle. Features from higher plan become read-only.</li>
            <li>No refund or credit for unused portions upon downgrade.</li>
          </ul>
        </Section>

        {/* Section 8 */}
        <Section title="8. Trial Period">
          <ul>
            <li>Trial periods (if offered) are limited to one per individual/entity</li>
            <li>Trials provide restricted functionality and expire automatically</li>
            <li>No payment required during trial</li>
            <li>Trials do not convert to paid plans without your explicit action</li>
          </ul>
        </Section>

        {/* Section 9 */}
        <Section title="9. Support">
          <ul>
            <li><strong>Email:</strong> support@advoverse.com</li>
            <li><strong>Hours:</strong> Monday–Saturday, 10:00 AM – 6:00 PM IST (excluding holidays)</li>
            <li>Support covers: technical issues, activation, billing, bug reports</li>
            <li>Support does NOT cover: legal advice, hardware issues, third-party conflicts, data entry</li>
          </ul>
        </Section>

        {/* Section 10 */}
        <Section title="10. Governing Law">
          <p>This policy is governed by the laws of India. Disputes are subject to the exclusive jurisdiction of courts at <strong>Dehradun, Uttarakhand, India</strong>.</p>
          <p>This policy is subject to the Consumer Protection Act, 2019 and applicable regulations. Mandatory statutory rights are not overridden by this document.</p>
        </Section>

        {/* Section 11 */}
        <Section title="11. Contact">
          <p><strong>Shubham Sakarwal</strong><br/>Advocate, Dehradun, Uttarakhand, India<br/>Operating as: Advoverse Technologies</p>
          <p><strong>Email:</strong> support@advoverse.com<br/><strong>Website:</strong> <a href="/" style={{ color: '#6b4b3e' }}>advoverse.com</a></p>
        </Section>

        <div style={{ borderTop: '2px solid #e5e7eb', marginTop: '48px', paddingTop: '24px', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>
          <p>© 2026 Shubham Sakarwal. All rights reserved.</p>
          <p>Caseline® is a trademark of Shubham Sakarwal, operating as Advoverse Technologies.</p>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '36px' }}>
      <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', color: '#3b2a22', marginBottom: '12px', paddingBottom: '8px', borderBottom: '2px solid #f59e0b' }}>{title}</h2>
      <div style={{ color: '#333', fontSize: '15px', lineHeight: '1.7' }}>{children}</div>
    </section>
  );
}
