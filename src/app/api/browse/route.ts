import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const assemblyNo = '157' // Hardlocked to 157
  const partNo = searchParams.get('part_no')
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '50', 10)

  if (!partNo) {
    return NextResponse.json({ error: 'part_no is required' }, { status: 400 })
  }

  const offset = (page - 1) * limit
  const supabase = createServerSupabaseClient()

  try {
    const { data, count, error } = await supabase
      .from('voters')
      .select('*', { count: 'exact' })
      .eq('assembly_no', assemblyNo)
      .eq('part_no', partNo)
      .order('serial_no', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return NextResponse.json({
      data,
      count,
      page,
      limit,
      totalPages: count ? Math.ceil(count / limit) : 0
    })
  } catch (err: any) {
    console.error('Browse API error:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
