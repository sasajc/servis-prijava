import { NextRequest, NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const LIMIT = 30
const WINDOW_MS = 60 * 60 * 1000
// shortcut: in-memory per instance, move to DB/Upstash if enumeration is observed
const hits = new Map<string, number[]>()

function rateLimited(ip: string): boolean {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  recent.push(now)
  hits.set(ip, recent)
  return recent.length > LIMIT
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const raw = request.nextUrl.searchParams.get('sn')?.trim() ?? ''
  const sn = raw.toUpperCase()
  if (!sn || sn.length > 64) {
    return NextResponse.json({ error: 'Unesite serijski broj.' }, { status: 400 })
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? 'unknown'
  if (rateLimited(ip)) {
    return NextResponse.json({ error: 'Previše upita. Pokušajte za sat vremena.' }, { status: 429 })
  }

  const { data } = await getAdminSupabase()
    .from('instalirani_uredaji')
    .select('"Tip pisača", "S/N pisača", "Poduzeće"')
    .in('"S/N pisača"', [raw, sn]) // baza može čuvati S/N kako je upisan ili velikim slovima
    .limit(1)
    .maybeSingle()

  if (!data) return NextResponse.json({ uredaj: null })

  const r = data as Record<string, string | null>
  return NextResponse.json({
    uredaj: {
      tip_sistema: r['Tip pisača'] ?? null,
      poduzece: r['Poduzeće'] ?? null,
      serijski_broj: r['S/N pisača'] ?? sn,
    },
  })
}
