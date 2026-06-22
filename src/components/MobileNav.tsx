'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="md:hidden">
      <button 
        onClick={() => setIsOpen(true)}
        style={{ 
          padding: '8px', 
          fontSize: 24, 
          color: '#f8fafc', 
          background: 'transparent', 
          border: 'none', 
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center'
        }}
        aria-label="Open menu"
      >
        ☰
      </button>

      {isOpen && mounted && createPortal(
        <div 
          className="fixed inset-0 z-[200] flex flex-col"
          style={{ background: 'rgba(4,8,18,0.98)', backdropFilter: 'blur(16px)' }}
        >
          <div style={{ height: 3, background: 'linear-gradient(90deg, #FF9933 33%, #ffffff 33%, #ffffff 66%, #138808 66%)' }} />
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', borderBottom: '1px solid rgba(255,153,51,0.15)' }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#FF9933' }}>Menu</div>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ padding: '8px', fontSize: 24, color: '#f8fafc', background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', padding: '32px 24px', gap: 32 }}>
            <Link href="/" onClick={() => setIsOpen(false)} style={{ fontSize: 24, color: 'white', textDecoration: 'none', fontWeight: 600 }}>
              🏠 Home
            </Link>
            <Link href="/search" onClick={() => setIsOpen(false)} style={{ fontSize: 24, color: 'white', textDecoration: 'none', fontWeight: 600 }}>
              🔍 Search
            </Link>
            <Link href="/browse" onClick={() => setIsOpen(false)} style={{ fontSize: 24, color: 'white', textDecoration: 'none', fontWeight: 600 }}>
              📋 Directory
            </Link>
            <Link href="/blo-contacts" onClick={() => setIsOpen(false)} style={{ fontSize: 24, color: 'white', textDecoration: 'none', fontWeight: 600 }}>
              📞 BLO Contacts
            </Link>
          </div>
          
          <div style={{ marginTop: 'auto', padding: '32px 24px', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
            Indian National Congress<br/>Proddatur 157
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
