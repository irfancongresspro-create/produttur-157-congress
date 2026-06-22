import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Legal Disclaimer | Proddatur 157 Congress Voter Search',
  description: 'Legal disclaimer and terms of use for the independent public-service platform checkSIR.com.',
}

export default function LegalPage() {
  return (
    <div className="congress-background" style={{ minHeight: '100vh', paddingTop: 80, paddingBottom: 80 }}>
      <div className="congress-white-glow" />
      
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: '#f8fafc', marginBottom: 32, textAlign: 'center' }}>
          Disclaimer & Legal Information
        </h1>

        <div className="card-glass" style={{ padding: '40px', color: '#cbd5e1', lineHeight: 1.7, fontSize: 15 }}>
          
          <h2 style={{ fontSize: 20, color: '#FF9933', fontWeight: 700, marginBottom: 12 }}>Disclaimer</h2>
          <p style={{ marginBottom: 24 }}>
            This platform is an independent public-service platform and is not affiliated with, endorsed by, authorized by, or operated by the Election Commission of India, any State Election Commission, or any government department.
          </p>
          <p style={{ marginBottom: 24 }}>
            The purpose of this platform is to help citizens conveniently search and locate voter-related information that is already publicly available through official electoral roll publications and other publicly accessible sources.
          </p>
          <p style={{ marginBottom: 32 }}>
            This website has been created solely as a citizen-assistance initiative to simplify access to voter information and help eligible voters verify their records, locate their details, and take necessary action through the appropriate official channels where required.
          </p>

          <h2 style={{ fontSize: 20, color: '#FF9933', fontWeight: 700, marginBottom: 12 }}>Source of Information</h2>
          <p style={{ marginBottom: 24 }}>
            The information displayed on this platform is derived from publicly available electoral records and other publicly accessible sources. We do not claim ownership of such information and do not represent it as official government data.
          </p>
          <p style={{ marginBottom: 32 }}>
            Users are strongly advised to verify all information through the relevant official Election Commission portals and authorities before relying upon it for any legal, administrative, or electoral purpose.
          </p>

          <h2 style={{ fontSize: 20, color: '#FF9933', fontWeight: 700, marginBottom: 12 }}>No Official Status</h2>
          <p style={{ marginBottom: 32 }}>
            This website is not an official government portal and does not provide any government service, certification, approval, or decision-making function. Any applications, corrections, transfers, additions, deletions, or voter-related requests must be completed through the appropriate official authorities and procedures.
          </p>

          <h2 style={{ fontSize: 20, color: '#FF9933', fontWeight: 700, marginBottom: 12 }}>Public-Service Purpose</h2>
          <p style={{ marginBottom: 24 }}>
            The primary objective of this platform is to improve accessibility, usability, and public awareness by presenting publicly available information in a user-friendly format, particularly for citizens who may face difficulties navigating large documents or complex search systems.
          </p>
          <p style={{ marginBottom: 32 }}>
            No information is provided for commercial exploitation, unauthorized profiling, marketing, surveillance, discrimination, or any unlawful purpose.
          </p>

          <h2 style={{ fontSize: 20, color: '#FF9933', fontWeight: 700, marginBottom: 12 }}>Data Usage and Privacy</h2>
          <p style={{ marginBottom: 32 }}>
            We do not sell voter information, distribute bulk electoral data, or provide datasets for commercial use. Users are prohibited from using information obtained through this platform for harassment, unsolicited communication, data harvesting, identity misuse, or any activity prohibited by law.
          </p>

          <h2 style={{ fontSize: 20, color: '#FF9933', fontWeight: 700, marginBottom: 12 }}>Accuracy and Availability</h2>
          <p style={{ marginBottom: 32 }}>
            While reasonable efforts may be made to maintain accuracy, completeness, and timeliness, we make no warranties regarding the correctness or current status of any information displayed. Electoral records may be updated, revised, corrected, or modified by the relevant authorities at any time.
          </p>

          <h2 style={{ fontSize: 20, color: '#FF9933', fontWeight: 700, marginBottom: 12 }}>Government Requests and Compliance</h2>
          <p style={{ marginBottom: 32 }}>
            We respect all applicable laws and regulatory requirements. If any competent government authority, court, statutory body, or election authority determines that any content, functionality, or data access method should be modified, restricted, or removed, the platform will review and address such requests in accordance with applicable law.
          </p>

          <h2 style={{ fontSize: 20, color: '#FF9933', fontWeight: 700, marginBottom: 12 }}>Acceptance</h2>
          <p style={{ marginBottom: 12 }}>
            By using this website, users acknowledge that they understand this platform is an independent informational service and that official Election Commission records and decisions shall prevail in all circumstances.
          </p>
        </div>

        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <a href="/" style={{
            display: 'inline-block',
            padding: '12px 32px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 100,
            color: '#f8fafc',
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 600,
            transition: 'all 0.2s',
          }}>
            ← Return to Home
          </a>
        </div>
      </div>
    </div>
  )
}
