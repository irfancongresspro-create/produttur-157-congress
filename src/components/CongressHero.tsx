'use client'

import Image from 'next/image'

export function CongressHero() {
  return (
    <section className="congress-hero" style={{ position: 'relative', overflow: 'hidden', padding: '48px 20px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      {/* Animated shimmer top stripe */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, transparent, rgba(255,153,51,0.8), rgba(255,255,255,0.8), rgba(19,136,8,0.8), transparent)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 4s infinite linear',
        zIndex: 5,
      }} />

      {/* Dynamic Glow Background */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '100%', height: '100%', background: 'radial-gradient(circle, rgba(255,153,51,0.08) 0%, rgba(19,136,8,0.03) 40%, transparent 70%)',
        zIndex: 0, pointerEvents: 'none'
      }} />

      <div style={{ maxWidth: 1100, width: '100%', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* Full Landscape Banner Showcase */}
        <div style={{ 
          width: '100%', 
          borderRadius: 24, 
          overflow: 'hidden', 
          boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255,255,255,0.15)',
          background: '#ffffff',
          position: 'relative'
        }}>
          <img 
            src="/photos/candidate.jpg" 
            alt="Congress Campaign Banner" 
            style={{ 
              width: '100%', 
              height: 'auto', 
              display: 'block',
              objectFit: 'contain'
            }} 
          />
          {/* Subtle inner shadow for depth */}
          <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)', pointerEvents: 'none', borderRadius: 24 }} />
        </div>

        {/* Text & Stats Section Below Banner */}
        <div style={{ marginTop: 40, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          {/* INC Badge */}
          <div className="inc-flag-badge" style={{ marginBottom: 16 }}>
            <div className="inc-tricolor">
              <div className="inc-tricolor-s" />
              <div className="inc-tricolor-w">
                <div className="inc-chakra-dot" />
              </div>
              <div className="inc-tricolor-g" />
            </div>
            <span style={{
              fontSize: 13, fontWeight: 800, letterSpacing: '2.5px',
              textTransform: 'uppercase', color: '#94a3b8'
            }}>
              Official Voter Directory
            </span>
          </div>

          {/* Constituency title */}
          <h1 style={{
            fontSize: 'clamp(26px, 4vw, 40px)',
            fontWeight: 900, lineHeight: 1.15,
            color: '#f8fafc', marginBottom: 20,
            textShadow: '0 4px 24px rgba(0,0,0,0.6)',
            letterSpacing: '-0.5px'
          }}>
            <span lang="te" className="telugu" style={{
              display: 'block', fontSize: 'clamp(18px, 3vw, 24px)',
              color: '#FF9933', marginBottom: 8, textShadow: '0 2px 12px rgba(255,153,51,0.3)'
            }}>
              ప్రొద్దుటూరు నియోజకవర్గం
            </span>
            Produttur Constituency 157
          </h1>

          {/* Stats Pills */}
          <div style={{
            display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center',
            marginTop: 4,
          }}>
            <span className="glass-pill" style={{ fontSize: 13, padding: '8px 20px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)' }}>🗳️ Kadapa District</span>
            <span className="glass-pill" style={{ fontSize: 13, padding: '8px 20px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)' }}>📋 Assembly No. 157</span>
            <span className="glass-pill" style={{ fontSize: 13, padding: '8px 20px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)' }}>🔍 2,14,168 Voters</span>
          </div>
          
        </div>
      </div>
    </section>
  )
}
