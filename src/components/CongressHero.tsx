'use client'

import Image from 'next/image'

export function CongressHero() {
  return (
    <section className="congress-hero" style={{ position: 'relative', overflow: 'hidden' }}>

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
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '80%', height: '80%', background: 'radial-gradient(circle, rgba(255,153,51,0.05) 0%, rgba(19,136,8,0.02) 50%, transparent 80%)',
        zIndex: 0, pointerEvents: 'none'
      }} />

      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'center', 
        padding: '48px 24px', maxWidth: 1000, margin: '0 auto', flexWrap: 'wrap', gap: '48px',
        position: 'relative', zIndex: 1
      }}>
        
        {/* LEFT: Text Content */}
        <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
          
          {/* INC Badge */}
          <div className="inc-flag-badge" style={{ marginBottom: 20 }}>
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
              Indian National Congress
            </span>
          </div>

          {/* Constituency title */}
          <h1 style={{
            fontSize: 'clamp(28px, 4vw, 42px)',
            fontWeight: 900, lineHeight: 1.15,
            color: '#f8fafc', marginBottom: 16,
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

          <div style={{
            display: 'flex', gap: 12, flexWrap: 'wrap',
            marginTop: 8,
          }}>
            <span className="glass-pill" style={{ fontSize: 13, padding: '6px 16px', border: '1px solid rgba(255,255,255,0.1)' }}>🗳️ Kadapa District</span>
            <span className="glass-pill" style={{ fontSize: 13, padding: '6px 16px', border: '1px solid rgba(255,255,255,0.1)' }}>📋 Assembly No. 157</span>
            <span className="glass-pill" style={{ fontSize: 13, padding: '6px 16px', border: '1px solid rgba(255,255,255,0.1)' }}>🔍 2.14 Lakh Voters</span>
          </div>
          
        </div>

        {/* RIGHT: Single Candidate Photo (Premium Circular Ring) */}
        <div style={{ flex: '1 1 300px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ 
            position: 'relative', width: 280, height: 280, 
            borderRadius: '50%', padding: 6, 
            background: 'linear-gradient(135deg, #FF9933 0%, #FFFFFF 50%, #138808 100%)', 
            boxShadow: '0 16px 48px rgba(0,0,0,0.6), inset 0 0 0 2px rgba(255,255,255,0.2)' 
          }}>
            <img 
              src="/photos/candidate.jpg" 
              alt="Shaik Irfan Basha" 
              style={{ 
                width: '100%', height: '100%', borderRadius: '50%', 
                objectFit: 'cover', objectPosition: 'top center',
                border: '6px solid #0f172a' 
              }} 
            />
            
            {/* Candidate Name Plate overlay */}
            <div style={{ 
              position: 'absolute', bottom: -20, left: '50%', transform: 'translateX(-50%)', 
              background: 'linear-gradient(to bottom, #1e293b, #0f172a)', 
              border: '1px solid rgba(255,255,255,0.15)', 
              padding: '10px 28px', borderRadius: 32, 
              boxShadow: '0 12px 32px rgba(0,0,0,0.8), 0 2px 4px rgba(255,255,255,0.05)', 
              whiteSpace: 'nowrap', textAlign: 'center',
              backdropFilter: 'blur(8px)'
            }}>
              <div style={{ color: '#FF9933', fontSize: 14, fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }} className="telugu" lang="te">షేక్ ఇర్ఫాన్ బాషా</div>
              <div style={{ color: '#ffffff', fontSize: 18, fontWeight: 800, marginTop: 2, letterSpacing: '0.5px' }}>Shaik Irfan Basha</div>
              <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: 4 }}>INC Candidate</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
