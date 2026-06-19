'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomeSearchClient() {
  const [query, setQuery] = useState('')
  const [partNo, setPartNo] = useState('')
  const [parts, setParts] = useState<{ part_no: number; polling_station_name: string | null }[]>([])
  const router = useRouter()

  useEffect(() => {
    fetch('/api/parts')
      .then(res => res.json())
      .then(data => {
        if (data.parts) setParts(data.parts)
      })
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    let url = '/search?assembly_no=157&'
    if (query.trim()) url += `q=${encodeURIComponent(query.trim())}&`
    if (partNo) url += `part_no=${partNo}&`
    router.push(url.replace(/&$/, ''))
  }

  return (
    <form onSubmit={handleSearch} style={{ maxWidth: 820, margin: '0 auto' }}>

      {/* Search Input Row */}
      <div className="search-glow" style={{ marginBottom: 16 }}>
        <div style={{
          position: 'relative',
          borderRadius: 100,
          border: '1.5px solid rgba(255,153,51,0.35)',
          background: 'rgba(5,12,22,0.7)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          overflow: 'hidden',
        }}>
          {/* Left search icon */}
          <div style={{
            position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)',
            fontSize: 20, zIndex: 2,
          }}>
            🔍
          </div>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="పేరు, ఇంటి నంబర్, EPIC ID వ్రాయండి..."
            className="search-input-congress"
            style={{ paddingRight: 140 }}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="submit"
            style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'linear-gradient(90deg, #FF9933, #138808)',
              border: 'none', color: 'white',
              padding: '10px 24px', borderRadius: 100,
              fontWeight: 700, fontSize: 14,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(255,153,51,0.35)',
              transition: 'all 0.2s',
            }}
          >
            Search
          </button>
        </div>
      </div>

      {/* Part number filter */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <select
          value={partNo}
          onChange={e => setPartNo(e.target.value)}
          style={{
            background: 'rgba(5,12,22,0.7)',
            border: '1px solid rgba(255,153,51,0.2)',
            color: partNo ? '#FF9933' : '#64748b',
            padding: '10px 20px', borderRadius: 100,
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            outline: 'none', appearance: 'auto',
            minWidth: 180,
          }}
        >
          <option value="">📋 All Booths (1-239)</option>
          {parts.map(p => (
            <option key={p.part_no} value={p.part_no}>
              Part {p.part_no}{p.polling_station_name ? ` — ${p.polling_station_name}` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Hint pills */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 28 }}>
        {[
          { label: '⚡ Telugu Names', hint: '' },
          { label: '🪪 EPIC IDs', hint: '' },
          { label: '🏠 Door Numbers', hint: '' },
          { label: '♾️ Unlimited Searches', hint: '' },
        ].map(({ label }) => (
          <div key={label} className="glass-pill" style={{ cursor: 'default' }}>{label}</div>
        ))}
      </div>

      {/* Search button large */}
      <div style={{ textAlign: 'center' }}>
        <button type="submit" className="btn-congress-search" style={{ minWidth: 240 }}>
          🔍 ఓటర్ శోధన చేయండి
        </button>
      </div>
    </form>
  )
}
