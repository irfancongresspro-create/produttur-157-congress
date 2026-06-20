'use client'

import { useState, useEffect, useCallback, useRef, Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { SearchBar } from '@/components/SearchBar'
import { VoterTable } from '@/components/VoterTable'
import { VoterCardList } from '@/components/VoterCardList'
import { SearchResult, VoterPart, supabase } from '@/lib/supabase/client'

function SearchPageInner() {
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [currentLimit, setCurrentLimit] = useState(20)
  const [totalAvailable, setTotalAvailable] = useState(0)
  const [filterPartNo, setFilterPartNo] = useState(searchParams.get('part_no') || '')
  const [filterRelativeName, setFilterRelativeName] = useState('')
  const [familyView, setFamilyView] = useState<{ house_no_normalized: number; part_no: number; house_no_raw: string; assembly_no: number } | null>(null)
  const [matchFilter, setMatchFilter] = useState<'ALL' | 'EXACT' | 'CLOSE' | 'POSSIBLE'>('ALL')
  const [metadata, setMetadata] = useState<VoterPart[]>([])
  // Always use assembly 157
  const ASSEMBLY_NO = '157'

  useEffect(() => {
    fetch('/api/parts')
      .then(res => res.json())
      .then(data => {
        if (data.assemblies) {
          setMetadata(data.assemblies.flatMap((a: any) => a.parts))
        }
      })
  }, [])

  const availableParts = useMemo(() =>
    metadata.map(m => m.part_no).sort((a, b) => a - b),
    [metadata]
  )

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const doSearch = useCallback(async (
    q: string,
    partNo?: string,
    relName?: string,
    famHouseNormalized?: number,
    famPart?: number,
    famAssembly?: number,
    famHouseRaw?: string,
    limit = 20,
    append = false,
  ) => {
    if (!famHouseNormalized && !q.trim()) {
      setResults([]); setHasSearched(false); setTotalAvailable(0); return
    }
    if (append) setIsLoadingMore(true)
    else setIsLoading(true)
    setHasSearched(true)

    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      params.set('limit', String(limit))
      params.set('assembly_no', ASSEMBLY_NO) // Always 157
      if (partNo) params.set('part_no', partNo)
      if (relName) params.set('relative_name', relName)
      if (famHouseNormalized != null && famPart) {
        params.set('family_house_no_normalized', famHouseNormalized.toString())
        params.set('family_part_no', famPart.toString())
        if (famAssembly) params.set('family_assembly_no', famAssembly.toString())
        if (famHouseRaw) params.set('family_house_no_raw', famHouseRaw)
      }

      const res = await fetch(`/api/search?${params}`)
      const data = await res.json()

      const sorted = (data.results || []).sort((a: SearchResult, b: SearchResult) => {
        const order = { EXACT: 1, CLOSE: 2, POSSIBLE: 3 }
        const av = order[a.match_type] || 4
        const bv = order[b.match_type] || 4
        if (av !== bv) return av - bv
        return (b.match_score || 0) - (a.match_score || 0)
      })

      setTotalAvailable(data.total || sorted.length)

      if (append) {
        setResults(prev => {
          const existingIds = new Set(prev.map((r: any) => r.id))
          return [...prev, ...sorted.filter((r: any) => !existingIds.has(r.id))]
        })
      } else {
        setResults(sorted)
        setCurrentLimit(limit)
      }
      setMatchFilter('ALL')
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [])

  // Debounced filter changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (familyView) {
        doSearch('', '', '', familyView.house_no_normalized, familyView.part_no, familyView.assembly_no, familyView.house_no_raw)
      } else {
        doSearch(query, filterPartNo, filterRelativeName)
      }
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [filterPartNo, filterRelativeName, familyView])

  // Auto-search on page load if ?q= is present
  useEffect(() => {
    const initialQ = searchParams.get('q')
    const initialPart = searchParams.get('part_no')
    if (initialQ) {
      doSearch(initialQ, initialPart || '', '', undefined, undefined, undefined, undefined, 20, false)
    }
  }, [])

  const handleSearchSubmit = useCallback(() => {
    if (familyView) return
    setCurrentLimit(20)
    doSearch(query, filterPartNo, filterRelativeName, undefined, undefined, undefined, undefined, 20, false)
  }, [query, filterPartNo, filterRelativeName, familyView, doSearch])

  const handleLoadMore = useCallback(() => {
    const newLimit = currentLimit + 20
    setCurrentLimit(newLimit)
    doSearch(query, filterPartNo, filterRelativeName, undefined, undefined, undefined, undefined, newLimit, false)
  }, [query, filterPartNo, filterRelativeName, currentLimit, doSearch])

  const exactCount = results.filter(r => r.match_type === 'EXACT').length
  const closeCount = results.filter(r => r.match_type === 'CLOSE').length
  const possibleCount = results.filter(r => r.match_type === 'POSSIBLE').length
  const filteredResults = matchFilter === 'ALL' ? results : results.filter(r => r.match_type === matchFilter)

  return (
    <div className="congress-background search-page-container" style={{
      maxWidth: 1500, margin: '0 auto',
      padding: '24px 20px 100px', paddingTop: 90,
    }}>

      {/* Page Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
          {familyView ? '👨‍👩‍👧 Family View' : '🔍 ప్రొద్దుటూరు 157 — Voter Search'}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
          {familyView
            ? `All voters at House No. ${familyView.house_no_raw}, Part ${familyView.part_no}`
            : 'Search by name (Telugu/English), EPIC ID, or door number. Unlimited searches.'}
        </p>
      </div>

      {/* Search Input */}
      {!familyView && (
        <div style={{ marginBottom: 16 }}>
          <SearchBar
            value={query}
            onChange={setQuery}
            onSubmit={handleSearchSubmit}
            isLoading={isLoading}
            resultCount={hasSearched ? results.length : undefined}
            autoFocus
          />
        </div>
      )}

      {/* Filters */}
      {!familyView && (
        <>
          {/* Unified Inline Filters */}
          <div className="flex flex-col md:flex-row" style={{ gap: 12, marginBottom: 16, alignItems: 'stretch' }}>
            <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>బంధువు (Relative Name):</label>
              <input
                className="input"
                type="text"
                value={filterRelativeName}
                onChange={e => setFilterRelativeName(e.target.value)}
                placeholder="Father/Husband name..."
                style={{ width: '100%', padding: '10px 12px', fontSize: 14, borderRadius: 8 }}
              />
            </div>
            <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>Part No:</label>
              <select
                className="input"
                value={filterPartNo}
                onChange={e => setFilterPartNo(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', appearance: 'auto', fontSize: 14, borderRadius: 8 }}
              >
                <option value="">All Parts</option>
                {availableParts.map(p => <option key={p} value={p}>Part {p}</option>)}
              </select>
            </div>
            
            <div className="md:flex md:items-end md:mb-[2px] hidden">
               {(filterPartNo || filterRelativeName) && (
                <button className="btn-ghost" onClick={() => { setFilterPartNo(''); setFilterRelativeName('') }}
                  style={{ padding: '10px 16px', fontSize: 13, borderRadius: 8 }}>
                  ✕ Clear
                </button>
              )}
            </div>
          </div>
          
          {/* Mobile Clear Button */}
          <div className="md:hidden">
            {(filterPartNo || filterRelativeName) && (
              <button className="btn-ghost" onClick={() => { setFilterPartNo(''); setFilterRelativeName('') }}
                style={{ padding: '10px 16px', fontSize: 13, borderRadius: 8, width: '100%', marginBottom: 16 }}>
                ✕ Clear Filters
              </button>
            )}
          </div>
        </>
      )}

      {/* Family View Header */}
      {familyView && (
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <button className="btn-primary" onClick={() => setFamilyView(null)}
            style={{ padding: '8px 16px', fontSize: 13 }}>
            ← Back to Results
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            <span className="glass-pill" style={{ background: 'rgba(255,153,51,0.1)', color: '#FF9933', border: '1px solid rgba(255,153,51,0.3)' }}>
              🏠 House: {familyView.house_no_raw} — Part {familyView.part_no}
            </span>
            <span className="glass-pill" style={{ background: 'rgba(255,153,51,0.1)', color: '#FF9933', border: '1px solid rgba(255,153,51,0.3)' }}>
              👥 {results.length} Members
            </span>
          </div>
        </div>
      )}

      {/* Match Filter Chips */}
      {hasSearched && results.length > 0 && (
        <div className="animate-fade-in" style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          {exactCount > 0 && (
            <button onClick={() => setMatchFilter(matchFilter === 'EXACT' ? 'ALL' : 'EXACT')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                background: 'var(--color-exact-bg)', borderRadius: 10, cursor: 'pointer',
                border: matchFilter === 'EXACT' ? '2px solid var(--color-exact)' : '1px solid rgba(16,185,129,0.3)',
                opacity: matchFilter === 'ALL' || matchFilter === 'EXACT' ? 1 : 0.4 }}>
              <span className="badge-exact">EXACT</span>
              <span style={{ fontWeight: 700, color: 'var(--color-exact)' }}>{exactCount}</span>
            </button>
          )}
          {closeCount > 0 && (
            <button onClick={() => setMatchFilter(matchFilter === 'CLOSE' ? 'ALL' : 'CLOSE')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                background: 'var(--color-close-bg)', borderRadius: 10, cursor: 'pointer',
                border: matchFilter === 'CLOSE' ? '2px solid #FF9933' : '1px solid rgba(255,153,51,0.3)',
                opacity: matchFilter === 'ALL' || matchFilter === 'CLOSE' ? 1 : 0.4 }}>
              <span className="badge-close">CLOSE</span>
              <span style={{ fontWeight: 700, color: '#FF9933' }}>{closeCount}</span>
            </button>
          )}
          {possibleCount > 0 && (
            <button onClick={() => setMatchFilter(matchFilter === 'POSSIBLE' ? 'ALL' : 'POSSIBLE')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                background: 'var(--color-possible-bg)', borderRadius: 10, cursor: 'pointer',
                border: matchFilter === 'POSSIBLE' ? '2px solid #138808' : '1px solid rgba(19,136,8,0.3)',
                opacity: matchFilter === 'ALL' || matchFilter === 'POSSIBLE' ? 1 : 0.4 }}>
              <span className="badge-possible">POSSIBLE</span>
              <span style={{ fontWeight: 700, color: '#138808' }}>{possibleCount}</span>
            </button>
          )}
          <div style={{ marginLeft: 'auto', fontSize: 12, color: '#64748b' }}>
            {matchFilter === 'ALL' ? results.length : filteredResults.length} of {totalAvailable} results
          </div>
        </div>
      )}

      {/* Results Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {hasSearched && results.length > 0 && (
          <div style={{
            display: 'flex', gap: 14, padding: '10px 18px',
            borderBottom: '1px solid var(--color-border)',
            background: 'var(--color-bg-elevated)', flexWrap: 'wrap',
          }}>
            <LegendItem badge="badge-exact" label="EXACT — Direct match" />
            <LegendItem badge="badge-close" label="CLOSE — High similarity" />
            <LegendItem badge="badge-possible" label="POSSIBLE — Phonetic match" />
          </div>
        )}

        {/* Desktop Table */}
        <div className="hidden md:block">
          <VoterTable
            voters={filteredResults}
            isLoading={isLoading}
            showMatchType={hasSearched && !familyView}
            onViewFamily={(house_no_normalized, part_no, house_no_raw) =>
              setFamilyView({ house_no_normalized, part_no, house_no_raw, assembly_no: 157 })}
          />
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden">
          <VoterCardList
            voters={filteredResults}
            onViewFamily={(voter) => setFamilyView({
              house_no_normalized: voter.house_no_normalized as number,
              part_no: voter.part_no as number,
              house_no_raw: voter.house_no as string,
              assembly_no: 157,
            })}
          />
        </div>

        {/* Load More */}
        {hasSearched && !isLoading && !familyView && results.length > 0 && results.length >= currentLimit && (
          <div style={{ padding: 20, textAlign: 'center', borderTop: '1px solid var(--color-border)' }}>
            <button
              id="load-more-results"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              style={{
                padding: '12px 36px',
                background: isLoadingMore ? 'rgba(255,153,51,0.2)' : 'rgba(255,153,51,0.1)',
                border: '1px solid rgba(255,153,51,0.4)',
                borderRadius: 10, color: '#FF9933',
                fontWeight: 700, fontSize: 14, cursor: isLoadingMore ? 'not-allowed' : 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 8,
              }}
            >
              {isLoadingMore
                ? <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #FF9933', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Loading...</>
                : <>📋 Show More ({results.length} shown)</>}
            </button>
          </div>
        )}

        {/* Empty State */}
        {hasSearched && !isLoading && results.length === 0 && query && (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🤔</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No results for "{query}"</h3>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 16 }}>
              Try a shorter name, different spelling, or EPIC ID
            </p>
            <button className="btn-ghost" onClick={() => setQuery('')} style={{ fontSize: 13 }}>
              Clear Search
            </button>
          </div>
        )}

        {/* Initial State */}
        {!hasSearched && !isLoading && (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🗳️</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: '#FF9933' }}>
              ప్రొద్దుటూరు 157 శోధన
            </h2>
            <p style={{ color: '#64748b', fontSize: 14, maxWidth: 400, margin: '0 auto' }}>
              Type any voter name in Telugu (రాజు) or English (Raju), EPIC ID, or house number above.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchPageInner />
    </Suspense>
  )
}

function LegendItem({ badge, label }: { badge: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748b' }}>
      <span className={badge}>{badge.replace('badge-', '').toUpperCase()}</span>
      {label}
    </div>
  )
}
