'use client'

import Image from 'next/image'

export function CongressHero() {
  return (
    <section className="congress-hero-section" style={{ position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      {/* CSS for Animations and Mobile Responsiveness */}
      <style dangerouslySetInnerHTML={{ __html: `
        .congress-hero-section {
          padding: 48px 20px 24px;
        }
        .banner-container {
          width: 100%;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 24px 64px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255,255,255,0.15);
          background: #ffffff;
          position: relative;
          animation: subtleFloat 6s ease-in-out infinite;
        }
        
        @media (max-width: 600px) {
          .congress-hero-section {
            padding: 24px 0px 24px; /* Remove side padding on mobile so banner stretches edge-to-edge */
          }
          .banner-container {
            border-radius: 0px; /* Flat edges on mobile */
            border-top: 1px solid rgba(255,255,255,0.15);
            border-bottom: 1px solid rgba(255,255,255,0.15);
            box-shadow: 0 10px 30px rgba(0,0,0,0.6);
            /* Disable float on mobile to prevent horizontal scroll issues */
            animation: none; 
          }
        }

        @keyframes flagSlideHorizontal {
          0% { background-position: 0% 50%; }
          100% { background-position: -200% 50%; } /* Smooth seamless loop */
        }
        @keyframes subtleFloat {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0px); }
        }
      `}} />

      {/* CONTINUOUS HORIZONTAL SLIDING FLAG BACKGROUND */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        /* Perfect looping gradient: Saffron -> White -> Green -> Saffron -> White -> Green */
        background: 'linear-gradient(90deg, rgba(255,153,51,0.25) 0%, rgba(255,255,255,0.08) 16.66%, rgba(19,136,8,0.25) 33.33%, rgba(255,153,51,0.25) 50%, rgba(255,255,255,0.08) 66.66%, rgba(19,136,8,0.25) 83.33%, rgba(255,153,51,0.25) 100%)',
        backgroundSize: '200% 100%',
        animation: 'flagSlideHorizontal 15s linear infinite',
        zIndex: 0, pointerEvents: 'none',
        maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 90%)',
        WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 90%)'
      }} />

      {/* Animated shimmer top stripe */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: 'linear-gradient(90deg, #FF9933, #FFFFFF, #138808, #FF9933, #FFFFFF, #138808)',
        backgroundSize: '200% 100%',
        animation: 'flagSlideHorizontal 8s linear infinite',
        zIndex: 5,
        boxShadow: '0 0 10px rgba(255,255,255,0.5)'
      }} />

      <div style={{ maxWidth: 1100, width: '100%', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* Full Landscape Banner Showcase */}
        <div className="banner-container">
          <img 
            src="/photos/candidate.jpg" 
            alt="Congress Campaign Banner" 
            style={{ 
              width: '100%', 
              height: 'auto', 
              display: 'block',
            }} 
          />
          {/* Subtle inner shadow for depth (hidden on mobile via CSS but inline here works too) */}
          <div className="hidden sm:block" style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)', pointerEvents: 'none' }} />
        </div>

      </div>
    </section>
  )
}
