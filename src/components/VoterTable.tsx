'use client'

import { useState, useCallback } from 'react'
import { VoterRow, SearchResult } from '@/lib/supabase/client'

type VoterData = VoterRow | SearchResult

interface VoterTableProps {
  voters: VoterData[]
  isLoading?: boolean
  showMatchType?: boolean
  onSort?: (column: string, dir: 'asc' | 'desc') => void
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  onViewFamily?: (house_no_normalized: number, part_no: number, house_no_raw: string, assembly_no: number) => void
}

const COLUMNS = [
  { key: 'match_type',            label: 'Match',          width: 80,  searchOnly: true },
  { key: 'serial_no',             label: 'S.No',           width: 60  },
  { key: 'house_no',              label: 'House No',       width: 90  },
  { key: 'voter_name_telugu',     label: 'పేరు (తె)',       width: 160, telugu: true },
  { key: 'voter_name_english',    label: 'Name (En)',      width: 160 },
  { key: 'relative_name_telugu',  label: 'బంధువు (తె)',    width: 140, telugu: true },
  { key: 'relative_name_english', label: 'Relative (En)', width: 140 },
  { key: 'relation_type',         label: 'Rel',            width: 50  },
  { key: 'age',                   label: 'Age',            width: 50  },
  { key: 'gender',                label: 'Gender',         width: 90  },
  { key: 'epic_id',               label: 'EPIC ID',        width: 150, mono: true },
  { key: 'part_no',               label: 'Part',           width: 55  },
  { key: 'polling_station_name',  label: 'Polling Station',width: 140 },
  { key: 'source_pdf',            label: 'PDF',            width: 70  },
  { key: 'actions',               label: 'Actions',        width: 120, searchOnly: true },
] as const

function MatchBadge({ type }: { type: string }) {
  return <span className={`badge-${type?.toLowerCase() || 'possible'}`}>{type || 'POSSIBLE'}</span>
}

function GenderBadge({ gender }: { gender: string | null }) {
  if (!gender) return <span style={{ color: 'var(--color-text-muted)' }}>—</span>
  const isFemale = gender.includes('స్త్రీ') || gender.toLowerCase().includes('f')
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
      background: isFemale ? 'rgba(236,72,153,0.12)' : 'rgba(255,153,51,0.12)',
      color: isFemale ? '#ec4899' : '#FF9933',
      border: `1px solid ${isFemale ? 'rgba(236,72,153,0.3)' : 'rgba(255,153,51,0.3)'}`,
    }}>
      {isFemale ? '♀ Female' : '♂ Male'}
    </span>
  )
}

function isValidHouseNo(h: string | null | undefined) {
  if (!h) return false
  const c = h.trim()
  return c !== '-' && c !== '0' && c.toUpperCase() !== 'NA' && c !== ''
}

export function VoterTable({ voters, isLoading, showMatchType, onSort, sortBy, sortDir, onViewFamily }: VoterTableProps) {
  const [internalSort, setInternalSort] = useState<{ col: string; dir: 'asc' | 'desc' }>({ col: 'house_no_normalized', dir: 'asc' })

  const handleSort = useCallback((col: string) => {
    if (col === 'actions') return
    if (onSort) {
      const newDir = sortBy === col && sortDir === 'asc' ? 'desc' : 'asc'
      onSort(col, newDir)
    } else {
      setInternalSort(prev => ({ col, dir: prev.col === col && prev.dir === 'asc' ? 'desc' : 'asc' }))
    }
  }, [onSort, sortBy, sortDir])

  const activeSort = onSort ? { col: sortBy || '', dir: sortDir || 'asc' } : internalSort

  const displayedVoters = onSort ? voters : [...voters].sort((a, b) => {
    const ak = (a as any)[activeSort.col]
    const bk = (b as any)[activeSort.col]
    if (ak == null) return 1
    if (bk == null) return -1
    const cmp = ak < bk ? -1 : ak > bk ? 1 : 0
    return activeSort.dir === 'asc' ? cmp : -cmp
  })

  const visibleColumns = COLUMNS.filter(c => showMatchType || !('searchOnly' in c && c.searchOnly))

  if (isLoading) {
    return (
      <div style={{ padding: 32 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 44, marginBottom: 8 }} />
        ))}
      </div>
    )
  }

  if (!voters.length) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
        <div style={{ fontSize: 16, color: 'var(--color-text-secondary)' }}>No voters found</div>
        <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
          Try a different name, EPIC ID, or house number
        </div>
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table" style={{ minWidth: 1100 }}>
        <thead>
          <tr>
            {visibleColumns.map(col => (
              <th
                key={col.key}
                onClick={() => !('searchOnly' in col && col.searchOnly) && handleSort(col.key)}
                style={{ width: col.width, minWidth: col.width, cursor: ('searchOnly' in col && col.searchOnly) ? 'default' : 'pointer' }}
              >
                {col.label}
                {!('searchOnly' in col && col.searchOnly) && activeSort.col === col.key && (
                  <span style={{ marginLeft: 4, opacity: 0.7 }}>{activeSort.dir === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayedVoters.map((voter, i) => {
            const v = voter as any
            return (
              <tr key={v.id || i} className="animate-fade-in" style={{ animationDelay: `${Math.min(i * 20, 400)}ms` }}>
                {showMatchType && <td><MatchBadge type={v.match_type} /></td>}
                <td style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>{v.serial_no}</td>
                <td style={{ fontWeight: 700, color: '#FF9933' }}>{v.house_no || '—'}</td>
                <td lang="te" className="telugu">{v.voter_name_telugu || '—'}</td>
                <td style={{ fontWeight: 500 }}>{v.voter_name_english || '—'}</td>
                <td lang="te" className="telugu" style={{ color: 'var(--color-text-secondary)' }}>{v.relative_name_telugu || '—'}</td>
                <td style={{ color: 'var(--color-text-secondary)' }}>{v.relative_name_english || '—'}</td>
                <td style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>{v.relation_type || '—'}</td>
                <td style={{ textAlign: 'center' }}>{v.age || '—'}</td>
                <td><GenderBadge gender={v.gender} /></td>
                <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--color-text-muted)', letterSpacing: '0.5px' }}>
                  {v.epic_id || '—'}
                </td>
                <td style={{ textAlign: 'center', color: '#FF9933' }}>{v.part_no}</td>
                <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{v.polling_station_name || '—'}</td>
                <td style={{ textAlign: 'center' }}>
                  {v.source_pdf ? (
                    <a href={v.source_pdf} target="_blank" rel="noopener noreferrer" className="btn-ghost"
                       style={{ fontSize: 11, padding: '4px 8px', color: '#10b981', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
                      📄 
                      <span style={{ fontSize: 9, opacity: 0.8 }}>{v.page_no ? `Pg ${v.page_no}` : 'View PDF'}</span>
                    </a>
                  ) : '—'}
                </td>
                {onViewFamily && (
                  <td style={{ textAlign: 'right' }}>
                    {(v.house_no_normalized != null || v.house_no) && v.part_no && isValidHouseNo(v.house_no) && (
                      <button
                        className="btn-ghost"
                        style={{ fontSize: 11, padding: '4px 10px', color: '#FF9933', borderColor: 'rgba(255,153,51,0.3)' }}
                        onClick={e => {
                          e.stopPropagation()
                          onViewFamily(v.house_no_normalized, v.part_no, v.house_no, v.assembly_no)
                        }}
                      >
                        👥 Family
                      </button>
                    )}
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
