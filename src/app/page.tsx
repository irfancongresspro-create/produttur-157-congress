import { Metadata } from 'next'
import { CongressHero } from '@/components/CongressHero'
import HomeSearchClient from './HomeSearchClient'

export const metadata: Metadata = {
  title: 'Produttur 157 Congress Voter Search | ప్రొద్దుటూరు నియోజకవర్గం',
  description: 'Search 2,14,168 registered voters in Produttur Assembly Constituency 157, Kadapa District, Andhra Pradesh. Indian National Congress official voter portal.',
}

export default function HomePage() {
  return (
    <div className="congress-background" style={{ minHeight: '100vh', paddingTop: 67 }}>
      <div className="congress-white-glow" />

      {/* Political Photo Banner */}
      <CongressHero />

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Title Section */}
        <div style={{ textAlign: 'center', marginTop: -32, marginBottom: 24, position: 'relative', zIndex: 10 }}>
          <span lang="te" className="telugu" style={{
            display: 'block', fontSize: 'clamp(20px, 4vw, 28px)',
            fontWeight: 900, color: '#FF9933', 
            textShadow: '0 2px 12px rgba(255,153,51,0.4)',
            letterSpacing: '0.5px',
            marginBottom: 8
          }}>
            ప్రొద్దుటూరు నియోజకవర్గం
          </span>

          <h1 style={{
            fontSize: 'clamp(22px, 3vw, 32px)',
            fontWeight: 900, lineHeight: 1.15,
            color: '#f8fafc', marginBottom: 12,
            textShadow: '0 4px 24px rgba(0,0,0,0.6)',
            letterSpacing: '-0.5px'
          }}>
            Produttur Constituency
          </h1>

          <div className="inc-flag-badge" style={{ marginBottom: 20, display: 'inline-flex' }}>
            <div className="inc-tricolor">
              <div className="inc-tricolor-s" />
              <div className="inc-tricolor-w"><div className="inc-chakra-dot" /></div>
              <div className="inc-tricolor-g" />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#94a3b8' }}>
              Voter Search Engine — <span style={{ color: '#FF9933' }}>2002 Voter List for SIR 2026</span>
            </span>
          </div>

          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, lineHeight: 1.15,
            color: '#f8fafc', marginBottom: 20,
            textShadow: '0 4px 20px rgba(0,0,0,0.5)',
          }}>
            2002 ఓటరును వెతకండి
          </h2>
        </div>

        {/* Search Form */}
        <div style={{ marginBottom: 32, position: 'relative', zIndex: 10 }}>
          <HomeSearchClient />
        </div>

        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <p style={{ fontSize: 'clamp(14px, 1.5vw, 18px)', color: '#94a3b8', maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
            Find any voter in Produttur 157 by name, EPIC ID, or door number — supports Telugu & English
          </p>
        </div>

        {/* Stats Bar */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16, marginBottom: 56,
        }}>
          <StatCard icon="🗳️" value="2,14,168" label="Total Voters" sublabel="ఓటర్లు" />
          <StatCard icon="📋" value="239" label="Booth Parts" sublabel="పోలింగ్ కేంద్రాలు" />
          <StatCard icon="⚡" value="< 1s" label="Search Speed" sublabel="వేగవంతమైన శోధన" />
        </div>

        {/* Feature Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          <FeatureCard
            emoji="🔍"
            title="Smart Name Search"
            titleTe="స్మార్ట్ పేరు శోధన"
            desc="Search in Telugu or English — misspellings handled automatically with AI phonetic matching"
          />
          <FeatureCard
            emoji="🏠"
            title="Door-to-Door Search"
            titleTe="ఇంటింటి శోధన"
            desc="Search by house number to find all registered voters at the same address. Perfect for family searches."
          />
          <FeatureCard
            emoji="🪪"
            title="EPIC ID Lookup"
            titleTe="ఎపిక్ ID శోధన"
            desc="Enter any EPIC voter ID (e.g. AP22152000030568) for instant exact match results"
          />
          <FeatureCard
            emoji="👥"
            title="Relative Name Filter"
            titleTe="బంధువు పేరు ఫిల్టర్"
            desc="Filter by father's or husband's name alongside the voter name for pinpoint accuracy"
          />
          <FeatureCard
            emoji="📍"
            title="Part-wise Browsing"
            titleTe="భాగాల వారీగా"
            desc="Browse by booth part number (1–239) to see all voters in a specific polling station area"
          />
          <FeatureCard
            emoji="♾️"
            title="Unlimited Searches"
            titleTe="అపరిమిత శోధనలు"
            desc="No search limits. Search as many times as you need — built for ground-level campaign workers"
          />
        </div>

        {/* Bottom CTA */}
        <div style={{
          marginTop: 56, padding: '40px 48px',
          background: 'linear-gradient(135deg, rgba(255,153,51,0.08) 0%, rgba(0,0,0,0) 50%, rgba(19,136,8,0.08) 100%)',
          border: '1px solid rgba(255,153,51,0.15)',
          borderRadius: 24,
          textAlign: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Decorative tricolor line */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 3,
            background: 'linear-gradient(90deg, #FF9933 33%, #ffffff 33%, #ffffff 66%, #138808 66%)',
          }} />
          <h3 style={{ fontSize: 24, fontWeight: 800, color: '#f8fafc', marginBottom: 12 }}>
            జై కాంగ్రెస్! 🇮🇳
          </h3>
          <p style={{ color: '#94a3b8', fontSize: 15, marginBottom: 24 }}>
            Produttur Constituency 157 — Serving every voter, building a stronger democracy
          </p>
          <a href="/search" style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: 'linear-gradient(90deg, #FF9933, #138808)',
            color: 'white', textDecoration: 'none',
            padding: '14px 40px', borderRadius: 100,
            fontWeight: 700, fontSize: 16,
            boxShadow: '0 4px 20px rgba(255,153,51,0.35)',
            transition: 'all 0.2s',
          }}>
            🔍 Start Searching Now
          </a>
        </div>

      </div>
    </div>
  )
}

function StatCard({ icon, value, label, sublabel }: { icon: string; value: string; label: string; sublabel: string }) {
  return (
    <div className="card-glass" style={{ padding: '20px 16px', textAlign: 'center' }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 900, color: '#FF9933', marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#f8fafc' }}>{label}</div>
      <div lang="te" className="telugu" style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{sublabel}</div>
    </div>
  )
}

function FeatureCard({ emoji, title, titleTe, desc }: { emoji: string; title: string; titleTe: string; desc: string }) {
  return (
    <div className="feature-card">
      <div style={{ fontSize: 32, marginBottom: 16 }}>{emoji}</div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>{title}</h3>
      <div lang="te" className="telugu" style={{ fontSize: 13, color: '#FF9933', marginBottom: 10 }}>{titleTe}</div>
      <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6 }}>{desc}</p>
    </div>
  )
}
