'use client'

import Image from 'next/image'
import { useState } from 'react'

/**
 * CongressHero — 3-Politician Political Banner
 *
 * Layout:
 *   LEFT:   Rahul Gandhi (INC National President)
 *   CENTER: Local Politician (Produttur 157 Candidate) — LARGER
 *   RIGHT:  YS Sharmila (APCC President)
 *
 * Photo placement:
 *   Put photos in /public/photos/
 *   - rahul-gandhi.jpg
 *   - local-politician.jpg
 *   - sharmila.jpg
 *
 * If photos are missing, colored placeholder silhouettes are shown.
 */

interface PoliticianProps {
  src: string
  name: string
  nameTelugu?: string
  title: string
  isCenter?: boolean
  fallbackColor?: string
}

function PoliticianCard({ src, name, nameTelugu, title, isCenter, fallbackColor }: PoliticianProps) {
  const [imgError, setImgError] = useState(false)

  return (
    <div className={`politician-card ${isCenter ? 'center' : ''}`}>
      <div className="politician-img-wrap" style={{
        ...(isCenter ? { border: '2px solid rgba(255,153,51,0.5)' } : {})
      }}>
        {!imgError ? (
          <img
            src={src}
            alt={name}
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
          />
        ) : (
          /* Placeholder silhouette when photo not found */
          <div style={{
            width: '100%', height: '100%',
            background: `linear-gradient(180deg, ${fallbackColor || '#FF9933'}22 0%, ${fallbackColor || '#FF9933'}44 100%)`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
            paddingBottom: 12,
          }}>
            {/* Silhouette SVG */}
            <svg viewBox="0 0 100 130" style={{ width: '75%', opacity: 0.4 }} fill={fallbackColor || '#FF9933'}>
              <circle cx="50" cy="35" r="22" />
              <path d="M10,120 Q10,70 50,70 Q90,70 90,120 Z" />
            </svg>
          </div>
        )}
        {/* Gradient overlay at bottom */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%',
          background: 'linear-gradient(to top, rgba(4,11,20,0.85) 0%, transparent 100%)',
        }} />
      </div>
      <div className="politician-label">
        {nameTelugu && (
          <div lang="te" className="telugu" style={{
            fontSize: isCenter ? 15 : 12, fontWeight: 700,
            color: '#FF9933', whiteSpace: 'nowrap', overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {nameTelugu}
          </div>
        )}
        <div className="politician-name" style={{ fontSize: isCenter ? 15 : 12 }}>{name}</div>
        <div className="politician-title">{title}</div>
      </div>
    </div>
  )
}

export function CongressHero() {
  return (
    <section className="congress-hero">

      {/* Animated shimmer top stripe */}
      <div style={{
        position: 'absolute', top: 4, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(255,153,51,0.4), rgba(255,255,255,0.3), rgba(19,136,8,0.4), transparent)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 4s infinite linear',
        zIndex: 5,
      }} />

      <div className="politician-banner">

        {/* LEFT: Rahul Gandhi */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: 16, paddingBottom: 0, alignSelf: 'flex-end' }}>
          <PoliticianCard
            src="/photos/rahul-gandhi.jpg"
            name="Rahul Gandhi"
            nameTelugu="రాహుల్ గాంధీ"
            title="INC National President"
            fallbackColor="#FF9933"
          />
        </div>

        {/* CENTER: Hero content + Local Politician */}
        <div className="congress-hero-center">
          {/* INC Badge */}
          <div className="inc-flag-badge">
            <div className="inc-tricolor">
              <div className="inc-tricolor-s" />
              <div className="inc-tricolor-w">
                <div className="inc-chakra-dot" />
              </div>
              <div className="inc-tricolor-g" />
            </div>
            <span style={{
              fontSize: 12, fontWeight: 700, letterSpacing: '2px',
              textTransform: 'uppercase', color: '#94a3b8'
            }}>
              Indian National Congress
            </span>
          </div>

          {/* Constituency title */}
          <h1 style={{
            fontSize: 'clamp(18px, 3.5vw, 32px)',
            fontWeight: 900, lineHeight: 1.2,
            color: '#f8fafc', marginBottom: 6,
            textShadow: '0 2px 12px rgba(0,0,0,0.5)',
          }}>
            <span lang="te" className="telugu" style={{
              display: 'block', fontSize: 'clamp(16px, 2.5vw, 22px)',
              color: '#FF9933', marginBottom: 4,
            }}>
              ప్రొద్దుటూరు నియోజకవర్గం
            </span>
            Produttur Constituency 157
          </h1>

          <div style={{
            display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap',
            marginBottom: 16, marginTop: 8,
          }}>
            <span className="glass-pill" style={{ fontSize: 11, padding: '4px 12px' }}>🗳️ Kadapa District</span>
            <span className="glass-pill" style={{ fontSize: 11, padding: '4px 12px' }}>📋 Assembly No. 157</span>
            <span className="glass-pill" style={{ fontSize: 11, padding: '4px 12px' }}>🔍 2,14,168 Voters</span>
          </div>

          {/* Local politician */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
            <PoliticianCard
              src="/photos/local-politician.jpg"
              name="Congress Candidate"
              nameTelugu="కాంగ్రెస్ అభ్యర్థి"
              title="Produttur 157 Candidate"
              isCenter
              fallbackColor="#138808"
            />
          </div>
        </div>

        {/* RIGHT: YS Sharmila */}
        <div style={{ display: 'flex', justifyContent: 'flex-start', paddingLeft: 16, alignSelf: 'flex-end' }}>
          <PoliticianCard
            src="/photos/sharmila.jpg"
            name="YS Sharmila"
            nameTelugu="వైఎస్ షర్మిల"
            title="APCC President"
            fallbackColor="#138808"
          />
        </div>
      </div>
    </section>
  )
}
