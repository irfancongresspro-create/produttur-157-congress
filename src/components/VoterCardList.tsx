import React from 'react'

interface Voter {
  id?: string | null
  voter_name_english?: string | null
  voter_name_telugu?: string | null
  relative_name_english?: string | null
  relative_name_telugu?: string | null
  house_no?: string | null
  age?: number | null
  gender?: string | null
  epic_id?: string | null
  assembly_no?: number | null
  assembly_name?: string | null
  part_no?: number | null
  serial_no?: number | null
  polling_station_no?: number | null
  polling_station_name?: string | null
  house_no_normalized?: number | null
  match_type?: string | null
  match_score?: number | null
  source_pdf?: string | null
  page_no?: number | null
  [key: string]: any
}

interface VoterCardListProps {
  voters: Voter[]
  onViewFamily: (voter: Voter) => void
}

export function VoterCardList({ voters, onViewFamily }: VoterCardListProps) {
  if (!voters || voters.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '12px 16px' }}>
      {voters.map((voter, idx) => (
        <VoterCard key={voter.id || idx} voter={voter} onViewFamily={() => onViewFamily(voter)} />
      ))}
    </div>
  )
}

function VoterCard({ voter, onViewFamily }: { voter: Voter; onViewFamily: () => void }) {
  const matchType = voter.match_type || 'POSSIBLE'
  const isExact = matchType === 'EXACT'
  const isClose = matchType === 'CLOSE'
  const matchColor = isExact ? '#10b981' : isClose ? '#FF9933' : '#138808'
  const matchBg = isExact ? 'rgba(16,185,129,0.12)' : isClose ? 'rgba(255,153,51,0.12)' : 'rgba(19,136,8,0.1)'

  return (
    <div style={{
      background: 'rgba(8, 18, 35, 0.8)',
      border: '1px solid rgba(255, 153, 51, 0.12)',
      borderRadius: 16, padding: 16,
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      transition: 'all 0.2s',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>
            {voter.voter_name_english || '—'}
          </div>
          {voter.voter_name_telugu && (
            <div lang="te" className="telugu" style={{ fontSize: 14, color: '#FF9933', marginTop: 2 }}>
              {voter.voter_name_telugu}
            </div>
          )}
        </div>
        <span style={{
          background: matchBg, color: matchColor,
          border: `1px solid ${matchColor}55`,
          padding: '3px 10px', borderRadius: 12,
          fontSize: 10, fontWeight: 700, letterSpacing: '0.5px',
          textTransform: 'uppercase',
        }}>
          {matchType}
        </span>
      </div>

      {/* Details grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13, color: '#94a3b8' }}>
        <div>
          <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.5px' }}>House No</div>
          <div style={{ color: '#FF9933', fontWeight: 700 }}>{voter.house_no || '—'}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.5px' }}>Relative</div>
          <div style={{ color: '#e2e8f0' }}>{voter.relative_name_english || voter.relative_name_telugu || '—'}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.5px' }}>Age / Gender</div>
          <div style={{ color: '#e2e8f0' }}>{voter.age || '—'} / {voter.gender || '—'}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.5px' }}>EPIC ID</div>
          <div style={{ color: '#e2e8f0', fontFamily: 'monospace', fontSize: 11 }}>{voter.epic_id || '—'}</div>
        </div>
      </div>

      {/* Location */}
      <div style={{ marginTop: 10, fontSize: 12, color: '#64748b', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <span>📍 Produttur 157</span>
        <span>📋 Part {voter.part_no}</span>
        <span>🔢 S.No: {voter.serial_no}</span>
      </div>

      {/* Family button and PDF */}
      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <button
          onClick={onViewFamily}
          style={{
            flex: 1, padding: '10px',
            background: 'rgba(255,153,51,0.08)',
            border: '1px solid rgba(255,153,51,0.2)',
            color: '#FF9933', borderRadius: 10,
            fontWeight: 600, fontSize: 13, cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          👥 Family Search
        </button>
        {voter.source_pdf && (
          <a
            href={voter.source_pdf}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '10px 16px',
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.2)',
              color: '#10b981', borderRadius: 10,
              fontWeight: 600, fontSize: 13, textDecoration: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            📄 {voter.page_no ? `PDF Pg ${voter.page_no}` : 'View PDF'}
          </a>
        )}
      </div>
    </div>
  )
}
