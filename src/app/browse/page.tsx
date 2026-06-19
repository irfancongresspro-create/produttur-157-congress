'use client'

import { useState, useEffect } from 'react'
import { VoterTable } from '@/components/VoterTable'
import { VoterCardList } from '@/components/VoterCardList'
import { VoterPart } from '@/lib/supabase/client'

export default function BrowsePage() {
  const [metadata, setMetadata] = useState<VoterPart[]>([])
  const [selectedPart, setSelectedPart] = useState<string>('')
  const [voters, setVoters] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  // Fetch available parts
  useEffect(() => {
    fetch('/api/parts')
      .then(res => res.json())
      .then(data => {
        if (data.assemblies) {
          const parts = data.assemblies.flatMap((a: any) => a.parts)
          setMetadata(parts)
          if (parts.length > 0) {
            setSelectedPart(String(parts[0].part_no))
          }
        }
      })
  }, [])

  // Fetch voters when part or page changes
  useEffect(() => {
    if (!selectedPart) return
    setIsLoading(true)
    fetch(`/api/browse?part_no=${selectedPart}&page=${page}&limit=50`)
      .then(res => res.json())
      .then(data => {
        setVoters(data.data || [])
        setTotalPages(data.totalPages || 0)
        setTotalCount(data.count || 0)
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [selectedPart, page])

  const availableParts = [...metadata].sort((a, b) => a.part_no - b.part_no)

  return (
    <div className="congress-background" style={{ minHeight: '100vh', padding: '90px 20px 100px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f8fafc', marginBottom: 4 }}>
              📋 Voter Directory
            </h1>
            <p style={{ color: '#94a3b8', fontSize: 14 }}>
              Browse the complete electoral roll for Produttur 157 by Part Number.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ color: '#94a3b8', fontSize: 14, fontWeight: 600 }}>Select Part:</label>
            <select
              className="input"
              value={selectedPart}
              onChange={(e) => {
                setSelectedPart(e.target.value)
                setPage(1)
              }}
              style={{ padding: '10px 16px', borderRadius: 8, fontSize: 15, width: 140 }}
            >
              {availableParts.map(p => (
                <option key={p.part_no} value={p.part_no}>Part {p.part_no}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Info */}
        {!isLoading && totalCount > 0 && (
          <div style={{ marginBottom: 16, fontSize: 14, color: '#FF9933', fontWeight: 600 }}>
            Showing {voters.length} of {totalCount.toLocaleString()} voters in Part {selectedPart}
          </div>
        )}

        {/* Data View */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="hidden md:block">
            <VoterTable voters={voters} isLoading={isLoading} showMatchType={false} />
          </div>
          <div className="md:hidden">
            {isLoading ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>Loading...</div>
            ) : (
              <VoterCardList voters={voters} onViewFamily={() => {}} />
            )}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 24 }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
              className="btn-ghost"
              style={{ padding: '8px 16px', borderRadius: 8, opacity: page === 1 ? 0.5 : 1 }}
            >
              ← Previous
            </button>
            <span style={{ color: '#94a3b8', fontSize: 14 }}>
              Page <span style={{ color: '#FF9933', fontWeight: 700 }}>{page}</span> of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || isLoading}
              className="btn-ghost"
              style={{ padding: '8px 16px', borderRadius: 8, opacity: page === totalPages ? 0.5 : 1 }}
            >
              Next →
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
