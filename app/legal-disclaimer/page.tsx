'use client';

export default function LegalDisclaimerPage() {
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
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', color: '#3b2a22', marginBottom: '8px' }}>Legal Technology Disclaimer</h1>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '40px' }}>Last Updated: June 2026 | Version 1.0</p>

        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '14px 18px', marginBottom: '32px' }}>
          <strong style={{ color: '#991b1b' }}>⚠️ THIS IS A CRITICAL DISCLAIMER DOCUMENT. READ IN FULL.</strong>
          <p style={{ color: '#555', margin: '8px 0 0' }}>This Legal Technology Disclaimer governs the nature, limitations, and appropriate use of the Caseline software. It supplements the EULA, Subscription Agreement, and Data Processing Terms. By using Caseline, You acknowledge and accept the disclaimers stated herein.</p>
        </div>

        {/* Section 1 */}
        <Section title="1. Not Legal Advice">
          <p>Caseline is a <strong>practice management and administrative tool</strong>. It is NOT a legal advisor, legal consultant, or substitute for professional legal judgment.</p>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '14px 18px', marginTop: '12px' }}>
            <p style={{ margin: '0 0 8px', fontWeight: 600, color: '#166534' }}>The Software PROVIDES:</p>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#333' }}>
              <li>Organisational tools for case management;</li>
              <li>Administrative assistance for scheduling, tracking, and filing;</li>
              <li>Data storage and retrieval for professional records;</li>
              <li>Computational tools for dates and deadlines;</li>
              <li>Communication tools for internal chamber coordination.</li>
            </ul>
          </div>
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '14px 18px', marginTop: '12px' }}>
            <p style={{ margin: '0 0 8px', fontWeight: 600, color: '#991b1b' }}>The Software does NOT provide:</p>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#555' }}>
              <li>Legal advice or opinions;</li>
              <li>Legal strategy recommendations;</li>
              <li>Interpretation of law or statutes;</li>
              <li>Court procedure guidance;</li>
              <li>Regulatory compliance assurance;</li>
              <li>Professional conduct guidance.</li>
            </ul>
          </div>
          <p style={{ marginTop: '12px' }}>No output of the Software — whether generated automatically, calculated algorithmically, or displayed through any interface — shall be construed as legal advice, legal opinion, or professional recommendation. Caseline is a <strong>tool</strong>, analogous to a filing cabinet, diary, or calculator. It facilitates the advocate's work; it does not perform it.</p>
        </Section>

        {/* Section 2 */}
        <Section title="2. Not Court Authority">
          <p>Caseline may display, store, or process information obtained from or related to courts, tribunals, and judicial bodies, including case numbers, hearing dates, court names, bench details, case status, and eCourts data.</p>
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '18px', marginTop: '12px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '16px', color: '#991b1b' }}>THE SOFTWARE IS NOT AN OFFICIAL COURT RECORD SYSTEM.</p>
            <p style={{ margin: '8px 0 0', fontWeight: 700, fontSize: '15px', color: '#991b1b' }}>In case of ANY discrepancy — THE OFFICIAL COURT RECORD SHALL PREVAIL. ALWAYS. WITHOUT EXCEPTION.</p>
          </div>
          <p style={{ marginTop: '16px' }}>The Licensor makes <strong>no representation or warranty</strong> that:</p>
          <ul>
            <li>Court data displayed is current, accurate, or complete;</li>
            <li>Hearing dates are correctly reflected;</li>
            <li>Case status information is up-to-date;</li>
            <li>Judge or bench assignments are accurate;</li>
            <li>Order/judgment information is current.</li>
          </ul>
          <p style={{ marginTop: '12px' }}>If Caseline imports or syncs data from eCourts or other judicial portals, such data is provided on an "AS IS" and "AS AVAILABLE" basis. The User must <strong>independently verify</strong> all court information from the official source before relying upon it.</p>
        </Section>

        {/* Section 3 */}
        <Section title="3. Limitation Calculator Disclaimer">
          <p>Caseline may include features that compute, estimate, or display limitation periods, filing deadlines, or statutory time bars.</p>
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '14px 18px', marginTop: '12px' }}>
            <strong style={{ color: '#991b1b' }}>THE LIMITATION CALCULATOR IS A COMPUTATIONAL AID, NOT A DEFINITIVE LEGAL DETERMINATION.</strong>
          </div>
          <p style={{ marginTop: '16px' }}>Limitation calculations may be affected by:</p>
          <ul>
            <li>Legislative amendments not yet reflected in the Software;</li>
            <li>Judicial interpretations that modify standard computation;</li>
            <li>Extensions granted by courts (e.g., COVID-19 suo motu extensions);</li>
            <li>Section 5 of the Limitation Act, 1963 (condonation of delay);</li>
            <li>Section 12 exclusions (time spent in obtaining copies);</li>
            <li>Special limitation provisions in specific statutes;</li>
            <li>State-specific amendments;</li>
            <li>Holidays, court vacations, and non-working days that vary by jurisdiction;</li>
            <li>Errors in the User's input data.</li>
          </ul>
          <p style={{ marginTop: '12px' }}>The User <strong>MUST independently verify</strong> all limitation calculations by reading the applicable statute, consulting legal commentary, cross-referencing with the Limitation Act schedules, and confirming with the relevant court registry where necessary.</p>
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '14px 18px', marginTop: '16px' }}>
            <strong style={{ color: '#991b1b' }}>⚠️ NO LIABILITY WHATSOEVER</strong>
            <p style={{ color: '#555', margin: '8px 0 0' }}>The Licensor shall bear NO LIABILITY for missed limitation deadlines, expiry of the right to sue or appeal, rejection of applications as time-barred, or any adverse consequence arising from reliance on the Limitation Calculator. BY USING THE LIMITATION CALCULATOR, THE USER EXPRESSLY ACKNOWLEDGES THAT THEY ASSUME FULL RESPONSIBILITY.</p>
          </div>
        </Section>

        {/* Section 4 */}
        <Section title="4. Date & Deadline Disclaimer">
          <p>Caseline computes and displays various dates including next hearing dates, adjournment schedules, filing deadlines, reminder alerts, recurring appointment dates, and cause list dates.</p>
          <p>Date calculations may be inaccurate due to:</p>
          <ul>
            <li>Incorrect input by the User;</li>
            <li>Sudden adjournments or date changes by the court;</li>
            <li>Supplementary cause lists published after sync;</li>
            <li>System clock errors on the User's device;</li>
            <li>Regional holidays not configured in the system;</li>
            <li>Court-specific vacation schedules.</li>
          </ul>
          <p style={{ marginTop: '12px' }}>The User must <strong>always confirm</strong> upcoming dates directly from official cause lists, court notice boards, court websites and eCourts SMS services, and registry confirmations.</p>
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '14px 18px', marginTop: '16px' }}>
            <strong style={{ color: '#991b1b' }}>⚠️</strong>
            <span style={{ color: '#555' }}> The Licensor accepts NO LIABILITY for missed hearings, defaults, or adverse orders resulting from reliance on date displays within the Software.</span>
          </div>
        </Section>

        {/* Section 5 */}
        <Section title="5. AI & Automated Drafting Disclaimer">
          <p>Current and future versions of Caseline may incorporate artificial intelligence, machine learning, or automated text generation features for document drafting, template generation, auto-fill suggestions, summary generation, translation, and analysis tools.</p>
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '14px 18px', marginTop: '12px' }}>
            <strong style={{ color: '#991b1b' }}>ALL AI-GENERATED OR AI-ASSISTED OUTPUT IS PROVIDED "AS IS" WITHOUT ANY WARRANTY OF ACCURACY, COMPLETENESS, OR LEGAL VALIDITY.</strong>
          </div>
          <p style={{ marginTop: '16px' }}>AI-generated content may be:</p>
          <ul>
            <li>Factually incorrect;</li>
            <li>Legally inaccurate or outdated;</li>
            <li>Contextually inappropriate;</li>
            <li>Missing critical legal nuances;</li>
            <li>Based on superseded law or overruled precedents;</li>
            <li>Grammatically or structurally flawed;</li>
            <li>Unsuitable for filing without extensive human review.</li>
          </ul>
          <p style={{ marginTop: '12px' }}><strong>The User MUST:</strong></p>
          <ul>
            <li>Independently verify every factual and legal assertion in AI-generated output;</li>
            <li>Review all citations, case references, and statutory provisions for accuracy;</li>
            <li>Edit, modify, and approve all drafts before filing or submission;</li>
            <li>Never file AI-generated content without thorough professional review;</li>
            <li>Accept full professional responsibility for any document bearing their name.</li>
          </ul>
          <p style={{ marginTop: '12px' }}>The Licensor makes <strong>NO REPRESENTATION</strong> that AI features produce court-ready documents, reflect current law, comply with court formatting requirements, or substitute for professional legal drafting skill.</p>
        </Section>

        {/* Section 6 */}
        <Section title="6. No Professional Responsibility Transfer">
          <div style={{ background: '#fef2f2', border: '2px solid #fecaca', borderRadius: '8px', padding: '18px', marginBottom: '16px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '16px', color: '#991b1b' }}>THIS IS THE MOST IMPORTANT CLAUSE IN THIS DOCUMENT.</p>
            <p style={{ margin: '12px 0 0', fontWeight: 700, fontSize: '18px', color: '#991b1b' }}>"Professional responsibility for legal practice remains solely and exclusively with the advocate."</p>
          </div>
          <p>The use of Caseline does <strong>NOT</strong>:</p>
          <ul>
            <li>Reduce the advocate's duty of diligence;</li>
            <li>Excuse failure to independently verify dates, facts, or law;</li>
            <li>Transfer any professional obligation to the Licensor;</li>
            <li>Create any co-responsibility between the Licensor and the User;</li>
            <li>Provide any defence to professional misconduct proceedings;</li>
            <li>Mitigate liability for negligence in legal practice.</li>
          </ul>
          <p style={{ marginTop: '16px' }}><strong>The advocate remains fully responsible for:</strong></p>
          <ul>
            <li>The accuracy of all filings;</li>
            <li>Timely appearance in court;</li>
            <li>Meeting all deadlines and limitation periods;</li>
            <li>Client communication and confidentiality;</li>
            <li>Compliance with the Advocates Act, 1961;</li>
            <li>Compliance with Bar Council of India Rules;</li>
            <li>Compliance with applicable High Court Rules;</li>
            <li>All professional and ethical obligations.</li>
          </ul>
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '14px 18px', marginTop: '16px' }}>
            <strong style={{ color: '#991b1b' }}>⚠️ In any disciplinary proceedings, professional negligence claims, or client complaints:</strong>
            <ul style={{ color: '#555', marginTop: '8px', marginBottom: 0 }}>
              <li>The User may NOT cite reliance on Caseline as a defence;</li>
              <li>The User may NOT seek to transfer liability to the Licensor;</li>
              <li>The User may NOT claim that the Software was responsible for any professional failing.</li>
            </ul>
          </div>
        </Section>

        {/* Section 7 */}
        <Section title="7. eCourts Sync Disclaimer">
          <p>If the User enables the eCourts Sync feature, Caseline may retrieve data from official court portals including eCourts.gov.in, District Court websites, High Court case information systems, and the National Judicial Data Grid (NJDG).</p>
          <p style={{ marginTop: '12px' }}>The User acknowledges:</p>
          <ul>
            <li>eCourts data may have delays of hours or days;</li>
            <li>Court websites may experience downtime;</li>
            <li>Data may be incomplete or partially updated;</li>
            <li>Supplementary cause lists may not be captured;</li>
            <li>Urgent changes (preponed/adjourned matters) may not reflect immediately;</li>
            <li>The Licensor has no control over the accuracy or availability of eCourts data.</li>
          </ul>
          <p style={{ marginTop: '12px' }}>The eCourts Sync feature is a <strong>convenience tool</strong> that reduces manual data entry. It does NOT replace the advocate's obligation to check official cause lists daily, confirm hearing dates from court sources, monitor case status independently, and maintain independent records.</p>
          <p style={{ marginTop: '12px' }}>The Licensor bears <strong>NO LIABILITY</strong> for errors in data imported from eCourts, delays in synchronisation, failures of the eCourts portal, missed dates due to stale cached data, or any consequence of reliance on synced information.</p>
        </Section>

        {/* Section 8 */}
        <Section title="8. Governing Law">
          <p>This Disclaimer is governed by the <strong>laws of India</strong> and subject to the exclusive jurisdiction of courts at <strong>Dehradun, Uttarakhand, India</strong>.</p>
        </Section>

        {/* Acknowledgment */}
        <Section title="Acknowledgment">
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '14px 18px' }}>
            <p style={{ margin: '0 0 8px', fontWeight: 600, color: '#166534' }}>BY USING CASELINE, THE USER EXPRESSLY ACKNOWLEDGES AND AGREES THAT:</p>
            <ol style={{ margin: 0, paddingLeft: '20px', color: '#333' }}>
              <li>The Software is a practice management tool, not a legal advisor;</li>
              <li>Official court records prevail over any information displayed in the Software;</li>
              <li>All dates, deadlines, and calculations must be independently verified;</li>
              <li>AI-generated content requires thorough review before use;</li>
              <li>Professional responsibility remains solely with the advocate;</li>
              <li>The Licensor bears no liability for professional consequences of Software use;</li>
              <li>Reliance on the Software without independent verification is at the User's sole risk.</li>
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
