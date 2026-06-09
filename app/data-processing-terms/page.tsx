'use client';

export default function DataProcessingTermsPage() {
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
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', color: '#3b2a22', marginBottom: '8px' }}>Data Processing Terms</h1>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '40px' }}>Last Updated: June 2026 | Version 1.0</p>

        <Section title="1. About This Document">
          <p>These Data Processing Terms govern how <strong>Caseline — Chamber Management System</strong> handles, stores, and protects your data. This document supplements the EULA and Subscription Agreement.</p>
          <p><strong>Data Controller & Processor:</strong> Shubham Sakarwal S/o Gyaneshwar Sakarwal, Date of Birth: 14 January 1991, Advocate, Dehradun, Uttarakhand, India. Operating under the trade name: Advoverse Technologies.</p>
        </Section>

        <Section title="2. Offline-First Architecture">
          <p>Caseline is designed with an <strong>offline-first architecture</strong>. The vast majority of your data resides locally on your device and is <strong>never transmitted</strong> to our servers unless you explicitly enable cloud features.</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#3b2a22', color: 'white' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left' }}>Data Type</th>
                <th style={{ padding: '10px 14px', textAlign: 'left' }}>Stored Where</th>
                <th style={{ padding: '10px 14px', textAlign: 'center' }}>Sent to Server?</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Case files, party names, case numbers', 'Your Device', '❌ NO'],
                ['Client names, addresses, contacts', 'Your Device', '❌ NO'],
                ['Pleadings, notes, evidence', 'Your Device', '❌ NO'],
                ['Hearing dates, court info', 'Your Device', '❌ NO'],
                ['Financial records, invoices', 'Your Device', '❌ NO'],
                ['Todo lists, planner, appointments', 'Your Device', '❌ NO'],
                ['Account credentials (email, password hash)', 'Server', '✅ YES'],
                ['Machine ID, licence key', 'Server', '✅ YES'],
                ['Subscription status', 'Server', '✅ YES'],
                ['Cloud backup (if enabled by you)', 'Server', '✅ (opt-in)'],
                ['Error/crash reports (anonymised)', 'Server', '✅ YES'],
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #e5e7eb', background: i % 2 === 0 ? '#fff' : '#f9f7f4' }}>
                  <td style={{ padding: '8px 14px' }}>{row[0]}</td>
                  <td style={{ padding: '8px 14px', fontWeight: 500 }}>{row[1]}</td>
                  <td style={{ padding: '8px 14px', textAlign: 'center' }}>{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="3. What We Collect">
          <h3 style={{ color: '#3b2a22', fontSize: '16px', marginTop: '16px' }}>Account Data (Mandatory)</h3>
          <ul>
            <li>Email address — account identification, communication</li>
            <li>Full name — identification, invoicing</li>
            <li>Phone number (if provided) — support, recovery</li>
            <li>Password — stored as bcrypt hash only, never in plain text</li>
          </ul>

          <h3 style={{ color: '#3b2a22', fontSize: '16px', marginTop: '16px' }}>Licence & Activation Data (Mandatory)</h3>
          <ul>
            <li>Machine ID (hardware fingerprint) — device binding, piracy prevention</li>
            <li>Activation Key — licence validation</li>
            <li>IP address at activation — security, fraud detection</li>
            <li>Activation/deactivation timestamps — audit trail</li>
            <li>Device name, OS version — compatibility support</li>
          </ul>

          <h3 style={{ color: '#3b2a22', fontSize: '16px', marginTop: '16px' }}>Payment Data</h3>
          <ul>
            <li>Transaction ID, amount, date, invoice number — tax compliance</li>
            <li>Payment method type (UPI/Card/Net Banking) — records</li>
            <li><strong>We do NOT store</strong> card numbers, CVVs, or full UPI IDs — payments are handled by Razorpay/Stripe</li>
          </ul>

          <h3 style={{ color: '#3b2a22', fontSize: '16px', marginTop: '16px' }}>Usage Analytics (Anonymised)</h3>
          <ul>
            <li>Feature usage frequency — product improvement</li>
            <li>Session duration — performance analysis</li>
            <li>Error logs, crash reports — bug fixing</li>
          </ul>
        </Section>

        <Section title="4. What We Do NOT Access">
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '16px 20px', marginTop: '8px' }}>
            <p style={{ fontWeight: 600, color: '#166534', marginBottom: '8px' }}>Caseline does NOT routinely review, access, or analyse your case files.</p>
            <p style={{ margin: 0, color: '#333' }}>We explicitly affirm that we do NOT:</p>
            <ul style={{ marginTop: '8px' }}>
              <li>Read, access, or analyse your case files, client data, or pleadings</li>
              <li>Monitor your appointments, todos, notes, or financial records</li>
              <li>Store credit card numbers, CVVs, or bank details</li>
              <li>Track your geographic location or GPS</li>
              <li>Record keystrokes, screen captures, or browsing history</li>
              <li>Scan your device for files outside the Caseline directory</li>
              <li>Share, sell, or trade any data with third parties for marketing</li>
              <li>Use your Case Data for AI training or data mining</li>
            </ul>
          </div>
        </Section>

        <Section title="5. Data Retention">
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#3b2a22', color: 'white' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left' }}>Data Type</th>
                <th style={{ padding: '10px 14px', textAlign: 'left' }}>Retention Period</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Active account data', 'Duration of subscription'],
                ['Post-cancellation data', '12 months, then deleted'],
                ['Machine ID records', 'Licence duration + 24 months'],
                ['Activation logs', '24 months from event'],
                ['Payment/transaction records', '7 years (Income Tax Act)'],
                ['Error logs & crash reports', '12 months'],
                ['Usage analytics (aggregated)', '24 months'],
                ['Cloud backup data', '90 days rolling (auto-deleted)'],
                ['Network messages', '12 months'],
                ['Support correspondence', '24 months from resolution'],
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #e5e7eb', background: i % 2 === 0 ? '#fff' : '#f9f7f4' }}>
                  <td style={{ padding: '10px 14px' }}>{row[0]}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 500 }}>{row[1]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="6. Security Measures">
          <h3 style={{ color: '#3b2a22', fontSize: '16px', marginTop: '16px' }}>Encryption</h3>
          <ul>
            <li><strong>Data at rest:</strong> AES-256 encryption of sensitive fields</li>
            <li><strong>Data in transit:</strong> TLS 1.2 / HTTPS for all server communications</li>
            <li><strong>Cloud backups:</strong> AES-256 encrypted before upload</li>
            <li><strong>Passwords:</strong> bcrypt with salt (cost factor 12)</li>
          </ul>

          <h3 style={{ color: '#3b2a22', fontSize: '16px', marginTop: '16px' }}>Authentication & Access Control</h3>
          <ul>
            <li>JWT tokens with expiry (24-hour access, 7-day refresh)</li>
            <li>Admin access requires separate credentials + PIN</li>
            <li>Machine binding via hardware fingerprint verification</li>
            <li>API rate limiting against brute-force attacks</li>
          </ul>

          <h3 style={{ color: '#3b2a22', fontSize: '16px', marginTop: '16px' }}>Infrastructure</h3>
          <ul>
            <li>Hosted on Supabase (AWS infrastructure, SOC 2 compliant)</li>
            <li>PostgreSQL with Row-Level Security (RLS)</li>
            <li>Parameterised queries (SQL injection prevention)</li>
            <li>Daily automated server backups (30-day rolling)</li>
          </ul>
        </Section>

        <Section title="7. Data Breach Procedures">
          <p>In the event of a data breach affecting our servers:</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#dc2626', color: 'white' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left' }}>Phase</th>
                <th style={{ padding: '10px 14px', textAlign: 'left' }}>Timeline</th>
                <th style={{ padding: '10px 14px', textAlign: 'left' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Containment', 'Within 4 hours', 'Affected systems isolated, access revoked'],
                ['Assessment', 'Within 24 hours', 'Scope determined, attack vector identified'],
                ['User Notification', 'Within 72 hours', 'Email to affected users with details and remedial steps'],
                ['CERT-In Report', 'Within 6 hours', 'Report filed as mandated by IT Act'],
                ['Remediation', 'Within 7 days', 'Full fix deployed, vulnerabilities addressed'],
                ['Post-mortem', 'Within 30 days', 'Root cause analysis, preventive measures implemented'],
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #e5e7eb', background: i % 2 === 0 ? '#fff' : '#fef2f2' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 600 }}>{row[0]}</td>
                  <td style={{ padding: '10px 14px', color: '#991b1b' }}>{row[1]}</td>
                  <td style={{ padding: '10px 14px' }}>{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ marginTop: '12px', fontSize: '13px', color: '#6b7280' }}>Note: We cannot detect breaches of locally stored data on your device. Local security is your responsibility.</p>
        </Section>

        <Section title="8. Third-Party Processors">
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#3b2a22', color: 'white' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left' }}>Third Party</th>
                <th style={{ padding: '10px 14px', textAlign: 'left' }}>Data Shared</th>
                <th style={{ padding: '10px 14px', textAlign: 'left' }}>Purpose</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Razorpay / Stripe', 'Email, name, amount, transaction', 'Payment processing'],
                ['Supabase (AWS)', 'Account data, licence data, backups', 'Infrastructure hosting'],
                ['Email service', 'Email address, name', 'Invoices, reminders, password resets'],
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #e5e7eb', background: i % 2 === 0 ? '#fff' : '#f9f7f4' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 500 }}>{row[0]}</td>
                  <td style={{ padding: '10px 14px' }}>{row[1]}</td>
                  <td style={{ padding: '10px 14px' }}>{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ marginTop: '12px' }}>We do <strong>NOT</strong> share data with advertising networks, data brokers, or marketing platforms.</p>
        </Section>

        <Section title="9. Your Rights">
          <p>You have the right to:</p>
          <ul>
            <li><strong>Access</strong> — Request a copy of personal data we hold</li>
            <li><strong>Correction</strong> — Request correction of inaccurate data</li>
            <li><strong>Deletion</strong> — Request deletion (subject to legal retention requirements)</li>
            <li><strong>Withdraw consent</strong> — Disable optional features (cloud backup, analytics)</li>
            <li><strong>Grievance</strong> — Lodge a complaint regarding data handling</li>
          </ul>
          <p>To exercise these rights, email: <strong>support@advoverse.com</strong> with subject "DATA PRIVACY REQUEST". Response within 30 days.</p>
        </Section>

        <Section title="10. User Responsibilities">
          <p>As the <strong>Data Controller</strong> for all Case Data, you are responsible for:</p>
          <ul>
            <li>Obtaining consent from clients before entering their data</li>
            <li>Complying with Advocates Act, 1961 and Bar Council confidentiality rules</li>
            <li>Maintaining device security (passwords, encryption, physical access)</li>
            <li>Regularly backing up local data</li>
            <li>Informing clients about use of digital practice management tools</li>
            <li>Deleting client data when no longer needed</li>
          </ul>
        </Section>

        <Section title="11. Grievance Officer">
          <p><strong>Name:</strong> Shubham Sakarwal</p>
          <p><strong>Designation:</strong> Proprietor & Grievance Officer</p>
          <p><strong>Email:</strong> support@advoverse.com</p>
          <p><strong>Address:</strong> Dehradun, Uttarakhand, India</p>
          <p><strong>Response Time:</strong> Within 30 days of receipt</p>
        </Section>

        <Section title="12. Governing Law">
          <p>These terms are governed by Indian law, including the Information Technology Act, 2000 and the IT (Reasonable Security Practices) Rules, 2011. Disputes subject to exclusive jurisdiction of courts at Dehradun, Uttarakhand.</p>
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
