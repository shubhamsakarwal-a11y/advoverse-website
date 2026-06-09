'use client';

export default function EULAPage() {
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
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', color: '#3b2a22', marginBottom: '8px' }}>End User Licence Agreement (EULA)</h1>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '40px' }}>Last Updated: June 2026 | Version 1.0</p>

        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '14px 18px', marginBottom: '32px' }}>
          <strong style={{ color: '#991b1b' }}>⚠️ IMPORTANT — READ CAREFULLY BEFORE USING THIS SOFTWARE.</strong>
          <p style={{ color: '#555', margin: '8px 0 0' }}>By downloading, installing, activating, or using Caseline, you acknowledge that you have read, understood, and agree to be bound by the terms and conditions of this Agreement. If you do not agree, do not install or use the Software. This is a <strong>licence agreement</strong>, not a sale. You do not acquire any ownership rights in the Software.</p>
        </div>

        {/* Section 1 */}
        <Section title="1. Definitions">
          <ul>
            <li><strong>"Caseline" or "the Software"</strong> — the Caseline Chamber Management System desktop application, including all modules, features, databases, interfaces, documentation, updates, patches, and associated files provided by the Licensor.</li>
            <li><strong>"Licensor"</strong> — Shubham Sakarwal S/o Gyaneshwar Sakarwal (Date of Birth: 14 January 1991), Advocate, sole owner and author of the Software, operating under the trade name "Advoverse Technologies", having his principal place of operations in Uttarakhand, India.</li>
            <li><strong>"User" or "You"</strong> — any individual, advocate, law firm, chamber, or entity that downloads, installs, activates, or uses the Software under this Agreement.</li>
            <li><strong>"Licence"</strong> — the limited, non-exclusive, non-transferable, revocable right granted to the User to use the Software in accordance with the terms of this Agreement.</li>
            <li><strong>"Device"</strong> — a single personal computer, laptop, or workstation on which the Software is installed and operated.</li>
            <li><strong>"Machine ID"</strong> — the unique hardware fingerprint generated from a Device's hardware components, used to bind the Licence to a specific machine.</li>
            <li><strong>"Activation Key" or "Licence Key"</strong> — the alphanumeric code issued to the User upon subscription that, when combined with the Machine ID, activates the Software on a specific Device.</li>
            <li><strong>"Subscription"</strong> — the time-limited right to use the Software, commencing upon activation and expiring on the date specified in the User's subscription plan.</li>
            <li><strong>"Server"</strong> — the Licensor's remote activation, validation, and update servers used to verify licences, deliver updates, and manage user accounts.</li>
            <li><strong>"Cloud Services"</strong> — any online services provided through the Advoverse platform, including but not limited to: licence activation, subscription management, cloud backup, network features, and update delivery.</li>
          </ul>
        </Section>

        {/* Section 2 */}
        <Section title="2. Licence Grant">
          <p>Subject to the terms of this Agreement and upon valid activation, the Licensor grants You a:</p>
          <ul>
            <li><strong>Non-exclusive</strong> — the same Software is licensed to other users;</li>
            <li><strong>Non-transferable</strong> — You may not assign, sublicense, sell, rent, lease, lend, or otherwise transfer this Licence to any third party;</li>
            <li><strong>Revocable</strong> — the Licensor may terminate this Licence as per Section 8;</li>
            <li><strong>Limited</strong> — restricted to the scope, duration, and devices specified herein;</li>
          </ul>
          <p>right to install and use one (1) copy of the Software on the permitted number of Devices as defined by Your subscription plan.</p>
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '14px 18px', marginTop: '16px' }}>
            <strong style={{ color: '#991b1b' }}>⚠️ This Licence does not constitute a sale.</strong>
            <span style={{ color: '#555' }}> No title to or ownership of the Software is transferred to You. All rights not expressly granted herein are reserved by the Licensor. The Software is licensed, not sold.</span>
          </div>
        </Section>

        {/* Section 3 */}
        <Section title="3. Device Restrictions">
          <p>Each Licence permits use on <strong>one (1) Device</strong> at a time, identified by its Machine ID. The specific Device allowance depends on Your subscription plan:</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#3b2a22', color: 'white' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left' }}>Plan</th>
                <th style={{ padding: '10px 14px', textAlign: 'left' }}>Devices Allowed</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Trial', '1 Device'],
                ['Junior Advocate', '1 Device'],
                ['Solo Practitioner', '1 Device'],
                ['Advocate + Clerk', '2 Devices (same user)'],
                ['Chamber Lite', '2 Devices'],
                ['Chamber', '3 Devices'],
                ['Chamber Pro', '5 Devices'],
                ['Exclusive', 'As specified'],
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #e5e7eb', background: i % 2 === 0 ? '#fff' : '#f9f7f4' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#3b2a22' }}>{row[0]}</td>
                  <td style={{ padding: '10px 14px', color: '#555' }}>{row[1]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3 style={{ color: '#3b2a22', fontSize: '16px', marginTop: '20px', marginBottom: '8px' }}>Machine Replacement Policy</h3>
          <ul>
            <li>You may transfer Your Licence to a replacement Device up to <strong>two (2) times</strong> per calendar year through the automated transfer system.</li>
            <li>Each transfer deactivates the previous Device permanently.</li>
            <li>After exhausting the annual transfer allowance, further transfers require written approval from the Licensor's support team.</li>
            <li>The Licensor reserves the right to deny transfer requests where patterns suggest licence sharing or circumvention.</li>
          </ul>
        </Section>

        {/* Section 4 */}
        <Section title="4. Activation System">
          <p>The Software requires <strong>mandatory online activation</strong> to function. Activation binds the Licence to a specific Machine ID.</p>
          <ul>
            <li>Upon first launch, the Software generates a Machine ID from the Device's hardware characteristics. This Machine ID is transmitted to the Licensor's Server for verification.</li>
            <li>The Software may periodically contact the Server to validate the continued legitimacy of the Licence, verify that the Machine ID has not changed, check subscription status and expiry, deliver updates and security patches, and enforce device limits.</li>
            <li>If the Software cannot contact the Server for an extended period, certain features may become restricted until connectivity is restored.</li>
          </ul>
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '14px 18px', marginTop: '16px' }}>
            <strong style={{ color: '#991b1b' }}>⚠️ Tampering Prohibited:</strong>
            <span style={{ color: '#555' }}> Any attempt to tamper with, spoof, or manipulate the Machine ID; bypass, disable, or circumvent the activation system; use tools, patches, or modifications to avoid licence validation; or clone or replicate activation credentials shall constitute a material breach and grounds for immediate termination.</span>
          </div>
        </Section>

        {/* Section 5 */}
        <Section title="5. Prohibited Conduct">
          <p>You shall not, and shall not permit any third party to:</p>
          <ul>
            <li><strong>Reverse engineer</strong>, decompile, disassemble, or otherwise attempt to derive the source code, algorithms, data structures, or underlying ideas of the Software;</li>
            <li><strong>Modify</strong>, adapt, alter, translate, patch, or create derivative works based upon the Software;</li>
            <li><strong>Crack</strong>, bypass, defeat, or circumvent any technological protection measures, activation systems, licence checks, or access controls;</li>
            <li><strong>Copy</strong>, reproduce, distribute, or make available the Software, in whole or in part, to any third party;</li>
            <li><strong>Rent</strong>, lease, lend, sell, sublicense, or otherwise commercially exploit or make the Software available to third parties;</li>
            <li><strong>Remove</strong>, alter, or obscure any proprietary notices, labels, trademarks, watermarks, or copyright markings;</li>
            <li><strong>Scrape</strong>, extract, mine, or systematically access internal databases or structured content within the Software for use outside the Software;</li>
            <li><strong>Share</strong> Licence Keys, login credentials, or activation codes with any person or entity not authorised under this Licence;</li>
            <li><strong>Circumvent</strong> device restrictions by using virtual machines, hardware spoofing tools, or any other means to activate on more Devices than permitted.</li>
          </ul>
          <p style={{ marginTop: '12px' }}>Violation of any prohibition under this Section shall constitute grounds for immediate termination and may result in civil and/or criminal proceedings under applicable Indian law, including the Information Technology Act, 2000 and the Copyright Act, 1957.</p>
        </Section>

        {/* Section 6 */}
        <Section title="6. Updates">
          <ul>
            <li>During an active Subscription, the Licensor shall provide Updates (bug fixes, security patches, performance improvements, and new features) at its sole discretion.</li>
            <li>Updates are delivered automatically through the Software's built-in update mechanism. You agree to accept and install Updates as they become available.</li>
            <li>Updates may modify, add, or remove features from the Software. The Licensor is not obligated to maintain any specific feature indefinitely.</li>
            <li>Major version upgrades (e.g., Caseline 2.0 to 3.0) may or may not be included in Your current Subscription at the Licensor's sole discretion.</li>
            <li>Upon Subscription expiry or termination, the right to receive Updates ceases immediately.</li>
          </ul>
        </Section>

        {/* Section 7 */}
        <Section title="7. Intellectual Property">
          <p>The Software, including but not limited to source code, object code, database schemas, UI designs, icons, graphics, documentation, trademarks, logos, trade names ("Caseline", "Advoverse"), algorithms, methods, and processes — are and shall remain the <strong>sole and exclusive property of Shubham Sakarwal</strong> (the Licensor), protected under:</p>
          <ul>
            <li>The Copyright Act, 1957</li>
            <li>The Trade Marks Act, 1999</li>
            <li>The Information Technology Act, 2000</li>
            <li>All applicable international intellectual property treaties</li>
          </ul>
          <p style={{ marginTop: '12px' }}>Nothing in this Agreement shall be construed as granting any licence or right to use any trademark, trade name, or logo of the Licensor except as expressly authorised herein. Any feedback or suggestions submitted by You may be used by the Licensor without obligation, compensation, or attribution.</p>
        </Section>

        {/* Section 8 */}
        <Section title="8. Termination">
          <h3 style={{ color: '#dc2626', fontSize: '16px', marginTop: '8px', marginBottom: '8px' }}>Termination by Licensor</h3>
          <p>The Licensor may terminate this Agreement immediately, without notice, if You:</p>
          <ul>
            <li>Breach any term of this Agreement;</li>
            <li>Engage in piracy, licence sharing, or unauthorised distribution;</li>
            <li>Fail to pay Subscription fees within the grace period;</li>
            <li>Tamper with or circumvent the activation system;</li>
            <li>Use the Software for any unlawful purpose;</li>
            <li>Engage in conduct that damages the Licensor's reputation or interests.</li>
          </ul>
          <h3 style={{ color: '#3b2a22', fontSize: '16px', marginTop: '20px', marginBottom: '8px' }}>Effect of Termination</h3>
          <ul>
            <li>All rights granted under this Agreement cease immediately;</li>
            <li>You must immediately cease all use of the Software;</li>
            <li>You must uninstall and destroy all copies of the Software;</li>
            <li>Any data stored locally remains on Your Device but the Software may no longer access or display it;</li>
            <li>No refund of prepaid Subscription fees shall be issued (except at the Licensor's sole discretion).</li>
          </ul>
        </Section>

        {/* Section 9 */}
        <Section title="9. Disclaimer of Warranties">
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '14px 18px', marginBottom: '16px' }}>
            <strong style={{ color: '#991b1b' }}>THE SOFTWARE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTY OF ANY KIND, EXPRESS, IMPLIED, OR STATUTORY.</strong>
          </div>
          <p>The Licensor expressly disclaims all warranties, including but not limited to:</p>
          <ul>
            <li><strong>Merchantability</strong> — no warranty that the Software is fit for commercial use;</li>
            <li><strong>Fitness for a particular purpose</strong> — no warranty that the Software meets Your specific professional requirements;</li>
            <li><strong>Accuracy</strong> — no warranty that court data, dates, calculations, limitation periods, or any information processed by the Software is accurate, complete, or current;</li>
            <li><strong>Uninterrupted operation</strong> — no warranty of uptime, availability, or error-free performance;</li>
            <li><strong>Security</strong> — no warranty that the Software is free from vulnerabilities;</li>
            <li><strong>Compatibility</strong> — no warranty of compatibility with any specific hardware, software, or operating system.</li>
          </ul>
          <p style={{ marginTop: '12px' }}>Any reliance on the Software's outputs, including date calculations, case tracking, hearing reminders, and scheduled appointments, is entirely at Your own risk.</p>
        </Section>

        {/* Section 10 */}
        <Section title="10. Limitation of Liability">
          <p>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, the Licensor shall NOT be liable for:</p>
          <ul>
            <li>Any missed court dates, hearing dates, or limitation periods;</li>
            <li>Any expiry of limitation or statutory time bars;</li>
            <li>Any incorrect calculations, date errors, or data corruption;</li>
            <li>Any filing errors, procedural defaults, or missed deadlines;</li>
            <li>Any loss of legal rights, claims, or causes of action;</li>
            <li>Any adverse judgments, orders, or decrees;</li>
            <li>Any professional negligence claims brought against You by Your clients;</li>
            <li>Any loss of data, client records, or case files;</li>
            <li>Any lost profits, revenue, business, or anticipated savings;</li>
            <li>Any consequential, incidental, indirect, special, punitive, or exemplary damages;</li>
          </ul>
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '14px 18px', marginTop: '16px' }}>
            <strong style={{ color: '#991b1b' }}>Aggregate Liability Cap:</strong>
            <span style={{ color: '#555' }}> The Licensor's total cumulative liability under this Agreement, for any and all claims combined, shall not exceed the total amount actually paid by You to the Licensor during the <strong>twelve (12) months</strong> immediately preceding the event giving rise to the claim.</span>
          </div>
        </Section>

        {/* Section 11 */}
        <Section title="11. Governing Law & Dispute Resolution">
          <ul>
            <li>This Agreement shall be governed by and construed in accordance with the <strong>laws of India</strong>.</li>
            <li>Any dispute shall be subject to the exclusive jurisdiction of the courts at <strong>Dehradun, Uttarakhand, India</strong>.</li>
            <li>Prior to initiating any legal proceedings, the parties agree to attempt resolution through good-faith negotiation for a period of thirty (30) days.</li>
            <li>If negotiation fails, either party may refer the dispute to arbitration under the Arbitration and Conciliation Act, 1996, with a sole arbitrator mutually appointed, seated at Dehradun.</li>
            <li>The language of arbitration shall be English.</li>
          </ul>
        </Section>

        {/* Section 12 */}
        <Section title="12. Acknowledgment">
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '14px 18px' }}>
            <p style={{ margin: '0 0 8px', fontWeight: 600, color: '#166534' }}>BY INSTALLING, ACTIVATING, OR USING THE SOFTWARE, YOU ACKNOWLEDGE THAT:</p>
            <ol style={{ margin: 0, paddingLeft: '20px', color: '#333' }}>
              <li>You have read and understood this Agreement in its entirety;</li>
              <li>You agree to be bound by all terms and conditions herein;</li>
              <li>You understand that this is a <strong>licence</strong>, not a purchase;</li>
              <li>You understand that the Software is provided <strong>"AS IS"</strong> without warranty;</li>
              <li>You accept full responsibility for independently verifying all legal dates, deadlines, and information;</li>
              <li>You acknowledge that the Licensor's liability is limited as stated in Section 10;</li>
              <li>You are of legal age and have the authority to enter into this Agreement.</li>
            </ol>
          </div>
        </Section>

        {/* Contact */}
        <Section title="Contact Information">
          <p><strong>Licensor, Owner & Author:</strong><br/>Shubham Sakarwal S/o Gyaneshwar Sakarwal<br/>Date of Birth: 14 January 1991<br/>Advocate, Dehradun, Uttarakhand, India<br/>Operating under the trade name: Advoverse Technologies</p>
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
