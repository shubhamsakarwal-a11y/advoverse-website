'use client';

export default function AcceptableUsePolicyPage() {
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
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', color: '#3b2a22', marginBottom: '8px' }}>Acceptable Use Policy</h1>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '40px' }}>Last Updated: June 2026 | Version 1.0</p>

        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '14px 18px', marginBottom: '32px' }}>
          <strong style={{ color: '#991b1b' }}>⚠️ THIS POLICY DEFINES WHAT YOU MAY AND MAY NOT DO WITH CASELINE.</strong>
          <p style={{ color: '#555', margin: '8px 0 0' }}>This Acceptable Use Policy is incorporated by reference into the EULA. Violation constitutes a material breach and grounds for immediate termination of all licences without refund.</p>
        </div>

        {/* Section 1 */}
        <Section title="1. Permitted Use">
          <p>Caseline is licensed exclusively for:</p>
          <ul>
            <li>Legitimate legal practice management by advocates enrolled under the Advocates Act, 1961;</li>
            <li>Chamber administration by authorised staff under an advocate's supervision;</li>
            <li>Case tracking, scheduling, documentation, and professional record-keeping;</li>
            <li>Any lawful purpose directly related to the practice of law in India.</li>
          </ul>
          <p style={{ marginTop: '12px' }}><strong>Authorised Users:</strong></p>
          <ul>
            <li>Enrolled advocates;</li>
            <li>Articled clerks and junior advocates working under a supervising advocate;</li>
            <li>Authorised chamber staff (clerks, typists, office managers) with a valid multi-user licence;</li>
            <li>Law firms and legal entities with appropriate subscription plans.</li>
          </ul>
        </Section>

        {/* Section 2 */}
        <Section title="2. Prohibited Conduct">
          <p>The User shall NOT use Caseline for, in connection with, or to facilitate:</p>

          <h3 style={{ color: '#3b2a22', fontSize: '16px', marginTop: '20px', marginBottom: '8px' }}>A. Illegal Activities</h3>
          <ul>
            <li>Any activity that violates applicable Indian law, including the Indian Penal Code, Information Technology Act, Copyright Act, or any state legislation;</li>
            <li>Storage, processing, or dissemination of content that is obscene, defamatory, seditious, or otherwise unlawful;</li>
            <li>Facilitating, planning, or coordinating criminal activity;</li>
            <li>Money laundering, fraud, or financial crimes;</li>
            <li>Violation of court orders, suppression of evidence, or obstruction of justice;</li>
            <li>Impersonation of advocates, judges, or court officials.</li>
          </ul>

          <h3 style={{ color: '#3b2a22', fontSize: '16px', marginTop: '20px', marginBottom: '8px' }}>B. Software Piracy & Licence Abuse</h3>
          <ul>
            <li><strong>Piracy</strong> — Copying, distributing, sharing, uploading, or making available the Software or any part thereof to unauthorised persons;</li>
            <li><strong>Credential Sharing</strong> — Sharing login credentials, Licence Keys, Activation Keys, or account access with any unauthorised person or entity;</li>
            <li><strong>Key Generation</strong> — Creating, distributing, or using unauthorised licence keys, serial numbers, or activation codes;</li>
            <li><strong>Circumvention</strong> — Bypassing, defeating, or disabling any copy protection, activation system, machine binding, subscription check, or access control;</li>
            <li><strong>Resale</strong> — Selling, renting, leasing, sublicensing, or commercially redistributing licences or access to the Software.</li>
          </ul>

          <h3 style={{ color: '#3b2a22', fontSize: '16px', marginTop: '20px', marginBottom: '8px' }}>C. Technical Abuse</h3>
          <ul>
            <li><strong>Reverse Engineering</strong> — Decompiling, disassembling, or attempting to derive source code, algorithms, or data structures from the Software;</li>
            <li><strong>Modification</strong> — Patching, modifying, altering, or creating derivative works from the Software's code, databases, or interfaces;</li>
            <li><strong>Malware</strong> — Uploading, transmitting, or introducing viruses, trojans, worms, ransomware, or any malicious code into or through the Software;</li>
            <li><strong>Automated Scraping</strong> — Using bots, scripts, crawlers, or automated tools to extract data from the Software's internal databases, interfaces, or APIs beyond normal use;</li>
            <li><strong>Server Abuse</strong> — Deliberately overwhelming, flooding, or attacking the Licensor's servers through excessive requests, denial-of-service attempts, or exploitation of vulnerabilities;</li>
            <li><strong>Interception</strong> — Intercepting, monitoring, or capturing network traffic between the Software and the Licensor's servers.</li>
          </ul>

          <h3 style={{ color: '#3b2a22', fontSize: '16px', marginTop: '20px', marginBottom: '8px' }}>D. Court Website Abuse</h3>
          <ul>
            <li><strong>Excessive Scraping</strong> — Using Caseline's eCourts sync features to place excessive, automated, or aggressive requests on official court websites beyond normal professional use;</li>
            <li><strong>Captcha Bypass</strong> — Bypassing CAPTCHA or other access controls on court portals through the Software or any associated tools;</li>
            <li><strong>Data Harvesting</strong> — Bulk downloading court records, cause lists, or case data for commercial resale, data mining, or purposes unrelated to the User's active legal practice;</li>
            <li><strong>API Abuse</strong> — Exploiting any official or unofficial court API beyond the rate limits and fair use intended for individual professional access;</li>
            <li><strong>Impersonation</strong> — Accessing court portals using credentials belonging to other advocates or parties.</li>
          </ul>
          <p style={{ marginTop: '8px', fontSize: '13px', color: '#6b7280' }}>The User acknowledges that court websites are public resources maintained by the judiciary. Any abuse may constitute contempt of court, violation of the IT Act, or breach of judicial portal terms.</p>

          <h3 style={{ color: '#3b2a22', fontSize: '16px', marginTop: '20px', marginBottom: '8px' }}>E. Professional Misconduct</h3>
          <ul>
            <li>Using Caseline to fabricate, forge, or manipulate court documents, vakalatnamas, or judicial orders;</li>
            <li>Creating false case records, fictitious clients, or fabricated hearing dates;</li>
            <li>Using the Software's features to mislead courts, clients, or opposing parties;</li>
            <li>Using the Software in any manner that would constitute professional misconduct under the Bar Council of India Rules, 1975.</li>
          </ul>

          <h3 style={{ color: '#3b2a22', fontSize: '16px', marginTop: '20px', marginBottom: '8px' }}>F. Network & Community Abuse</h3>
          <ul>
            <li>Sending spam, unsolicited bulk messages, or commercial advertisements through the network;</li>
            <li>Harassing, threatening, or abusing other users;</li>
            <li>Creating fake profiles or impersonating other advocates;</li>
            <li>Soliciting work in violation of Bar Council advertising rules;</li>
            <li>Sharing confidential case information through network messages without client consent.</li>
          </ul>
        </Section>

        {/* Section 3 */}
        <Section title="3. Enforcement & Consequences">
          <p>Upon discovery or report of an AUP violation, the Licensor may take action based on severity:</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#3b2a22', color: 'white' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left' }}>Severity</th>
                <th style={{ padding: '10px 14px', textAlign: 'left' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Minor (first offence, unintentional)', 'Written warning, 7-day remediation window'],
                ['Moderate (repeated or negligent)', 'Temporary suspension (7–30 days), mandatory acknowledgment'],
                ['Severe (intentional, malicious, or illegal)', 'Immediate permanent termination, no refund, permanent ban'],
                ['Criminal (piracy, fraud, hacking)', 'Immediate termination + referral to law enforcement'],
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #e5e7eb', background: i % 2 === 0 ? '#fff' : '#f9f7f4' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#3b2a22' }}>{row[0]}</td>
                  <td style={{ padding: '10px 14px', color: '#555' }}>{row[1]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ marginTop: '12px' }}>Termination for AUP violation results in forfeiture of all prepaid subscription fees, permanent ban from all Advoverse services, and does not preclude civil or criminal proceedings against the violator.</p>
        </Section>

        {/* Section 4 */}
        <Section title="4. Fair Use of Resources">
          <p>The Software and associated services are intended for reasonable professional use. "Reasonable" means:</p>
          <ul>
            <li><strong>Activation/validation requests:</strong> normal frequency (startup + periodic checks);</li>
            <li><strong>Cloud backup:</strong> within the storage limits of the subscription plan;</li>
            <li><strong>eCourts sync:</strong> limited to the User's own cases and matters;</li>
            <li><strong>API calls:</strong> within normal application behaviour (not programmatic bulk access);</li>
            <li><strong>Network messaging:</strong> individual professional communication (not bulk distribution).</li>
          </ul>
          <p style={{ marginTop: '12px' }}>The Licensor reserves the right to throttle, restrict, or suspend access for any User whose usage patterns significantly exceed normal professional use, after reasonable notice.</p>
        </Section>

        {/* Section 5 */}
        <Section title="5. User Responsibility">
          <p>The User is responsible for:</p>
          <ul>
            <li>All activity occurring under their account and credentials;</li>
            <li>Maintaining the security of their login credentials;</li>
            <li>Supervising use by authorised staff under multi-user plans;</li>
            <li>Ensuring that no unauthorised person gains access to the Software through their credentials or devices;</li>
            <li>Promptly reporting any security breach or unauthorised access.</li>
          </ul>
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '14px 18px', marginTop: '16px' }}>
            <strong style={{ color: '#991b1b' }}>⚠️ "I didn't know" is not a defence.</strong>
            <span style={{ color: '#555' }}> The User is liable for violations committed through their account regardless of whether they personally performed the prohibited action.</span>
          </div>
        </Section>

        {/* Section 6 */}
        <Section title="6. Governing Law">
          <p>This Acceptable Use Policy is governed by the <strong>laws of India</strong> and subject to the exclusive jurisdiction of courts at <strong>Dehradun, Uttarakhand, India</strong>.</p>
        </Section>

        {/* Acknowledgment */}
        <Section title="Acknowledgment">
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '14px 18px' }}>
            <p style={{ margin: '0 0 8px', fontWeight: 600, color: '#166534' }}>BY USING CASELINE, YOU CONFIRM THAT:</p>
            <ol style={{ margin: 0, paddingLeft: '20px', color: '#333' }}>
              <li>You have read and understood this Acceptable Use Policy;</li>
              <li>You agree to use the Software only for lawful, professional purposes;</li>
              <li>You accept that violations may result in immediate termination without refund;</li>
              <li>You understand that piracy, credential sharing, and reverse engineering are prohibited;</li>
              <li>You will not abuse court website access through the Software;</li>
              <li>You accept responsibility for all activity under your account.</li>
            </ol>
          </div>
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
