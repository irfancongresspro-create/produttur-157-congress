import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/client'

export const runtime = 'nodejs'

// Returns parts/assemblies for assembly 157 only
export async function GET() {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('voter_parts')
    .select('assembly_no, assembly_name, part_no, polling_station_no, polling_station_name, voter_count')
    .eq('assembly_no', 157)
    .order('part_no', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Format for the search page dropdown
  const parts = data || []
  const assemblies = [
    {
      assembly_no: 157,
      assembly_name: parts[0]?.assembly_name || 'Proddatur',
      parts: parts.map(p => ({
        id: `157-${p.part_no}`,
        assembly_no: 157,
        assembly_name: p.assembly_name || 'Proddatur',
        part_no: p.part_no,
        polling_station_no: p.polling_station_no,
        polling_station_name: p.polling_station_name,
        voter_count: p.voter_count,
        created_at: new Date().toISOString(),
        source_pdf: null,
      }))
    }
  ]

  return NextResponse.json({
    assemblies,
    parts: parts.map(p => ({
      part_no: p.part_no,
      polling_station_name: p.polling_station_name,
      voter_count: p.voter_count,
    })),
    total: parts.length,
  }, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' }
  })
}
