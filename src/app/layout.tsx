import type { Metadata, Viewport } from 'next'
import './globals.css'

export const viewport: Viewport = {
  themeColor: '#FF9933',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: 'Produttur 157 Congress — Voter Search | ప్రొద్దుటూరు నియోజకవర్గం',
  description: 'Search voter lists for Produttur Assembly Constituency 157, Kadapa District. Find any voter by name, EPIC ID, or house number. Powered by Indian National Congress.',
  keywords: 'Produttur, 157, voter list, Congress, Kadapa, ప్రొద్దుటూరు, voter search, APCC',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="te" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body>
        <div id="app-root" className="min-h-screen flex flex-col">
          <CongressTopNav />
          <main className="flex-1">{children}</main>
          <CongressFooter />
        </div>
      </body>
    </html>
  )
}

function CongressTopNav() {
  return (
    <header style={{
      background: 'rgba(4,8,18,0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      position: 'fixed',
      width: '100%',
      top: 0,
      zIndex: 100,
      borderBottom: '1px solid rgba(255,153,51,0.15)',
    }}>
      {/* Tricolor stripe at top of nav */}
      <div style={{
        height: 3,
        background: 'linear-gradient(90deg, #FF9933 33%, #ffffff 33%, #ffffff 66%, #138808 66%)',
      }} />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

          {/* Logo */}
          <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* INC Tricolor Flag */}
            <div style={{
              display: 'flex', flexDirection: 'column', width: 36, height: 24,
              borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            }}>
              <div style={{ background: '#FF9933', flex: 1 }} />
              <div style={{ background: '#ffffff', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 10, height: 10, border: '1.5px solid #000080', borderRadius: '50%' }} />
              </div>
              <div style={{ background: '#138808', flex: 1 }} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#FF9933', letterSpacing: '-0.3px' }}>
                Congress Voter Search
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>
                ప్రొద్దుటూరు 157 నియోజకవర్గం
              </div>
            </div>
          </a>

          {/* Nav links */}
          <nav style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <NavLink href="/" label="Home" />
            <NavLink href="/search" label="Search" />
            <NavLink href="/browse" label="Directory" />
            <a
              href="/search"
              style={{
                background: 'linear-gradient(90deg, #FF9933, #138808)',
                color: 'white', textDecoration: 'none',
                padding: '8px 20px', borderRadius: 100,
                fontWeight: 700, fontSize: 13,
                boxShadow: '0 2px 12px rgba(255,153,51,0.3)',
                transition: 'all 0.2s',
              }}
            >
              🔍 Voter Search
            </a>
          </nav>
        </div>
      </div>
    </header>
  )
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} className="nav-link" style={{
      textDecoration: 'none', fontSize: 14, fontWeight: 500,
      transition: 'color 0.2s', padding: '4px 8px',
    }}>
      {label}
    </a>
  )
}

function CongressFooter() {
  return (
    <footer style={{
      background: 'rgba(4,8,18,0.95)',
      borderTop: '1px solid rgba(255,153,51,0.12)',
      padding: '32px 24px',
      color: '#64748b',
      textAlign: 'center',
    }}>
      {/* Tricolor bottom bar */}
      <div style={{
        height: 3,
        background: 'linear-gradient(90deg, #FF9933 33%, #ffffff 33%, #ffffff 66%, #138808 66%)',
        marginBottom: 24, borderRadius: 2,
        maxWidth: 400, margin: '0 auto 24px',
      }} />

      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#FF9933', marginBottom: 6 }}>
          Indian National Congress
        </div>
        <div lang="te" className="telugu" style={{ fontSize: 14, color: '#94a3b8', marginBottom: 16 }}>
          ప్రొద్దుటూరు నియోజకవర్గం 157 — అధికారిక ఓటర్ శోధన
        </div>

        <div style={{ height: 1, background: 'rgba(255,153,51,0.1)', margin: '16px 0' }} />

        <p style={{ fontSize: 11, color: '#475569', lineHeight: 1.6 }}>
          <strong style={{ color: '#64748b' }}>Legal Disclaimer:</strong> All voter data indexed on this platform is extracted via AI (OCR) from publicly available historical electoral rolls published by the Government of India. This platform is NOT affiliated with or endorsed by the Election Commission of India. Data accuracy is not guaranteed — please verify at{' '}
          <a href="https://voters.eci.gov.in" target="_blank" rel="noopener noreferrer" style={{ color: '#FF9933' }}>
            voters.eci.gov.in
          </a>.
        </p>
      </div>
    </footer>
  )
}
