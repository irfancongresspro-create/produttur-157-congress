import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/client'
import { generateCanonicalName, nysiis } from '@/lib/extraction/tokenizer'

// @ts-ignore
import Sanscript from '@indic-transliteration/sanscript'

export const runtime = 'nodejs'

// ============================================================
// CONGRESS PRODUTTUR 157 — SEARCH API
// ✅ NO rate limiting (unlimited searches for campaign workers)
// ✅ HARD-LOCKED to assembly_no = 157
// ✅ Same AI search logic as SIR-AP parent platform
// ============================================================

const LOCKED_ASSEMBLY_NO = 157

export async function GET(req: NextRequest) {
  const supabase = createServiceClient()

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim() || ''

  // Transliterate English → Telugu for bilingual search
  let telugu_q = ''
  if (q && /^[a-zA-Z\s]+$/.test(q)) {
    const itransQuery = q.toLowerCase()
    telugu_q = Sanscript.t(itransQuery, 'itrans', 'telugu')
  }

  const canonical_q = generateCanonicalName(q)
  const nysiis_q = nysiis(q)
  const relative_name = searchParams.get('relative_name')?.trim().toLowerCase() || ''

  // Always force assembly_no = 157 regardless of what user passes
  const assembly_no = LOCKED_ASSEMBLY_NO

  const part_no = searchParams.get('part_no')
    ? parseInt(searchParams.get('part_no')!, 10) : null
  const rawFamHouseNorm = searchParams.get('family_house_no_normalized')
  const family_house_no_normalized = rawFamHouseNorm && rawFamHouseNorm !== 'null' && rawFamHouseNorm !== 'undefined'
    ? parseFloat(rawFamHouseNorm) : null

  const rawFamPart = searchParams.get('family_part_no')
  const family_part_no = rawFamPart && rawFamPart !== 'null' && rawFamPart !== 'undefined'
    ? parseInt(rawFamPart, 10) : null

  const family_assembly_no = LOCKED_ASSEMBLY_NO  // Always 157
  const family_house_no_raw = searchParams.get('family_house_no_raw') || null

  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100)

  try {
    // ============================================================
    // MODE 1: FAMILY TREE — find all residents at same house
    // ============================================================
    if ((family_house_no_normalized != null || family_house_no_raw) && family_part_no) {
      let qb = supabase
        .from('voters')
        .select('*')
        .eq('part_no', family_part_no)
        .eq('assembly_no', family_assembly_no)

      if (family_house_no_normalized != null && !Number.isNaN(family_house_no_normalized)) {
        qb = qb.eq('house_no_normalized', family_house_no_normalized)
      } else {
        qb = qb.eq('house_no', family_house_no_raw)
      }

      const { data: family, error } = await qb.order('age', { ascending: false })
      if (error) throw error

      return NextResponse.json({
        results: (family || []).map((r: any) => ({ ...r, match_type: 'EXACT', match_score: 1.0 })),
        query: 'Family Match',
        total: family?.length || 0,
        mode: 'family_tree',
      })
    }

    if (!q || q.length < 1) {
      return NextResponse.json({ results: [], query: q })
    }

    // ============================================================
    // MODE 2: FAST PATH — EPIC ID or House Number
    // ============================================================
    const isEpicId = /^[A-Za-z]{2,4}[0-9]{4,20}$/i.test(q.trim())
    const isHouseNumber = !isEpicId && /^[0-9]+[0-9\-/\s]*$/.test(q.trim())

    if (isEpicId || isHouseNumber) {
      let qb = supabase.from('voters').select('*').eq('assembly_no', assembly_no)
      if (part_no) qb = qb.eq('part_no', part_no)

      if (isEpicId) {
        qb = qb.ilike('epic_id', q.trim())
      } else {
        qb = qb.ilike('house_no', `${q}%`)
      }
      qb = qb.limit(limit)

      const { data: fastResults, error: fastError } = await qb
      if (!fastError && fastResults && fastResults.length > 0) {
        return NextResponse.json({
          results: fastResults.map((r: any) => ({ ...r, match_type: 'EXACT', match_score: 1.0 })),
          query: q, total: fastResults.length,
          mode: isEpicId ? 'epic_fast_path' : 'house_fast_path',
        })
      }

      // EPIC prefix fallback
      if (isEpicId) {
        const { data: prefixResults } = await supabase
          .from('voters').select('*')
          .ilike('epic_id', `${q.trim()}%`)
          .eq('assembly_no', assembly_no)
          .limit(limit)
        if (prefixResults && prefixResults.length > 0) {
          return NextResponse.json({
            results: prefixResults.map((r: any) => ({ ...r, match_type: 'EXACT', match_score: 1.0 })),
            query: q, total: prefixResults.length, mode: 'epic_prefix',
          })
        }
        return NextResponse.json({ results: [], query: q, total: 0, mode: 'epic_not_found' })
      }
      return NextResponse.json({ results: [], query: q, total: 0, mode: 'house_not_found' })
    }

    // ============================================================
    // MODE 3: AI NAME SEARCH — Python NLP microservice + Fallbacks
    // ============================================================
    let finalResults: any[] = []

    try {
      let pythonBaseUrl = process.env.PYTHON_SEARCH_URL || 'http://127.0.0.1:8001'
      if (!pythonBaseUrl.startsWith('http://') && !pythonBaseUrl.startsWith('https://')) {
        pythonBaseUrl = 'https://' + pythonBaseUrl
      }
      const pythonRes = await fetch(`${pythonBaseUrl}/v1/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          assembly_no: assembly_no,  // Always 157
          part_no: part_no,
          relative_name: relative_name,
          limit: limit,
        }),
        signal: AbortSignal.timeout(3000),
      })

      if (pythonRes.ok) {
        const pyData = await pythonRes.json()
        finalResults = pyData.results || []
        console.log(`[Python Search] ${finalResults.length} results for "${q}"`)
      } else {
        throw new Error('Python API: ' + pythonRes.status)
      }
    } catch (pyErr) {
      console.warn('[Python Search] Falling back to PostgreSQL:', pyErr)

      // Fallback 1: ilike name search
      let qb = supabase.from('voters').select('*')
        .eq('assembly_no', assembly_no)
        .limit(limit)
      if (q) {
        qb = qb.or(`voter_name_english.ilike.%${q}%,voter_name_telugu.ilike.%${q}%,relative_name_english.ilike.%${q}%`)
      }
      if (part_no) qb = qb.eq('part_no', part_no)

      const { data: fallback1, error: e1 } = await qb
      if (e1) throw e1
      finalResults = (fallback1 || []).map((r: any) => ({ ...r, match_type: 'CLOSE', match_score: 0.9 }))

      // Fallback 2: pg_trgm fuzzy
      if (finalResults.length === 0) {
        const { data: fuzzy } = await supabase.rpc('fuzzy_search_voters', {
          query_text: q,
          p_limit: limit,
        })
        finalResults = (fuzzy || []).map((r: any) => ({ ...r, match_type: 'POSSIBLE', match_score: 0.5 }))
      }
    }

    finalResults = finalResults.slice(0, limit)

    // Sort: EXACT → CLOSE → POSSIBLE, then by score
    const sorted = [...finalResults].sort((a, b) => {
      const order = { EXACT: 0, CLOSE: 1, POSSIBLE: 2 }
      const typeOrder = (order[a.match_type as keyof typeof order] ?? 2)
        - (order[b.match_type as keyof typeof order] ?? 2)
      if (typeOrder !== 0) return typeOrder
      if (b.match_score !== a.match_score) return b.match_score - a.match_score
      return (a.house_no_normalized ?? 9999) - (b.house_no_normalized ?? 9999)
    })

    return NextResponse.json({
      results: sorted,
      query: q,
      total: sorted.length,
      mode: 'search',
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' }
    })

  } catch (err: any) {
    console.error('Search error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
