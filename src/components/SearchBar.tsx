'use client'

import { useEffect, useRef, useState } from 'react'

interface SearchBarProps {
  value: string
  onChange: (val: string) => void
  onSubmit?: () => void
  placeholder?: string
  autoFocus?: boolean
  isLoading?: boolean
  resultCount?: number
}

export function SearchBar({
  value, onChange, onSubmit,
  placeholder = 'పేరు, EPIC ID, ఇంటి నంబర్ వ్రాయండి...',
  autoFocus, isLoading, resultCount,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  return (
    <div className="search-glow" style={{ width: '100%' }}>
      <form
        onSubmit={e => { e.preventDefault(); onSubmit?.() }}
        style={{
          position: 'relative', borderRadius: 100,
          border: `1.5px solid ${isFocused ? '#FF9933' : 'rgba(255,153,51,0.3)'}`,
          background: 'rgba(5,12,22,0.75)',
          transition: 'all 0.25s ease',
          boxShadow: isFocused
            ? '0 0 0 4px rgba(255,153,51,0.12), 0 4px 24px rgba(0,0,0,0.4)'
            : '0 4px 24px rgba(0,0,0,0.3)',
          width: '100%',
        }}
      >
        {/* Search icon */}
        <div style={{
          position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)',
          fontSize: 20, opacity: 0.7,
        }}>
          {isLoading
            ? <span className="animate-spin-slow" style={{ display: 'inline-block' }}>⚙️</span>
            : '🔍'}
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          id="voter-search-input"
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '18px 160px 18px 56px',
            background: 'transparent', border: 'none', outline: 'none',
            fontSize: 17, color: '#f8fafc',
            fontFamily: value.match(/[\u0C00-\u0C7F]/) ? 'var(--font-telugu)' : 'var(--font-sans)',
          }}
          aria-label="Search voters"
          autoComplete="off"
          spellCheck={false}
        />

        {/* Right controls */}
        <div style={{
          position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          {resultCount !== undefined && value && !isLoading && (
            <span className="hidden sm:inline-block" style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
              {resultCount} results
            </span>
          )}
          {value && !isLoading && (
            <button
              type="button"
              onClick={() => { onChange(''); onSubmit?.() }}
              style={{
                background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer',
                color: '#64748b', fontSize: 14, width: 28, height: 28,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '50%', transition: 'all 0.2s',
              }}
              aria-label="Clear"
            >
              ✕
            </button>
          )}
          <button
            type="submit"
            style={{
              background: 'linear-gradient(90deg, #FF9933, #138808)',
              border: 'none', color: 'white',
              padding: '10px 22px', borderRadius: 100,
              fontWeight: 700, fontSize: 14, cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(255,153,51,0.3)',
              transition: 'all 0.15s', opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {/* AI hint chips */}
      {isFocused && !value && (
        <div className="animate-fade-in" style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            'Try: "రాజు"', 'Try: "AP22152..."', 'Try: "44-2"',
            'Try: "Raju"', 'Try: "Laxmi" (relative)',
          ].map(hint => (
            <button
              key={hint}
              onClick={() => {
                onChange(hint.replace(/Try: "/, '').replace(/".*/, ''))
              }}
              style={{
                padding: '4px 14px', borderRadius: 20, fontSize: 12,
                background: 'rgba(255,153,51,0.08)', color: '#ffb366',
                border: '1px solid rgba(255,153,51,0.2)',
                cursor: 'pointer', transition: 'all 0.15s',
                fontFamily: hint.includes('రాజు') ? 'var(--font-telugu)' : 'inherit',
              }}
            >
              {hint}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
