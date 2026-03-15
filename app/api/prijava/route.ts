import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase'
import { sendVerificationEmail } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const adminSupabase = getAdminSupabase()

  // 1. Parse multipart/form-data
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Neispravan zahtjev.' }, { status: 400 })
  }

  const sn = (formData.get('sn') as string | null)?.trim() || null
  const opisProblema = (formData.get('opisProblema') as string | null)?.trim() ?? ''
  const imeOperatera = (formData.get('imeOperatera') as string | null)?.trim() ?? ''
  const prezimeOperatera = (formData.get('prezimeOperatera') as string | null)?.trim() ?? ''
  const email = (formData.get('email') as string | null)?.trim() ?? ''
  const telefon = (formData.get('telefon') as string | null)?.trim() ?? ''
  const zeljenoVrijeme = (formData.get('zeljenoVrijeme') as string | null)?.trim() || null
  const slika = formData.get('slika') as File | null

  // 2. Validacija
  if (!imeOperatera) {
    return NextResponse.json({ error: 'Ime operatera je obavezno.' }, { status: 400 })
  }
  if (!prezimeOperatera) {
    return NextResponse.json({ error: 'Prezime operatera je obavezno.' }, { status: 400 })
  }
  if (!telefon) {
    return NextResponse.json({ error: 'Broj mobitela je obavezan.' }, { status: 400 })
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Ispravna e-mail adresa je obavezna.' }, { status: 400 })
  }
  if (!slika || !slika.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Fotografija je obavezna.' }, { status: 400 })
  }
  if (slika.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'Fotografija je prevelika (max 10MB).' }, { status: 400 })
  }

  // 3. Rate limiting (max 5 prijava/IP/sat)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? 'unknown'

  if (ip !== 'unknown') {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count } = await adminSupabase
      .from('klijentske_prijave')
      .select('id', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .gte('created_at', oneHourAgo)

    if ((count ?? 0) >= 5) {
      return NextResponse.json(
        { error: 'Previše prijava s ove IP adrese. Pokušajte za sat vremena.' },
        { status: 429 }
      )
    }
  }

  // 4. Lookup uređaja po S/N
  let uredajInfo: { tip_sistema: string | null; serijski_broj: string | null; poduzece: string | null } = {
    tip_sistema: null, serijski_broj: null, poduzece: null,
  }

  if (sn) {
    const { data } = await adminSupabase
      .from('instalirani_uredaji')
      .select('"Tip pisača", "S/N pisača", "Poduzeće"')
      .eq('"S/N pisača"', sn)
      .maybeSingle()

    if (data) {
      uredajInfo = {
        tip_sistema: (data as Record<string, string | null>)['Tip pisača'] ?? null,
        serijski_broj: (data as Record<string, string | null>)['S/N pisača'] ?? null,
        poduzece: (data as Record<string, string | null>)['Poduzeće'] ?? null,
      }
    }
  }

  // 5. Upload slike u Supabase Storage
  const uuid = crypto.randomUUID()
  const timestamp = Date.now()
  const storagePath = `prijave/${uuid}/${timestamp}.jpg`
  const slikaBuffer = await slika.arrayBuffer()

  const { error: uploadError } = await adminSupabase.storage
    .from('prijave-slike')
    .upload(storagePath, slikaBuffer, {
      contentType: 'image/jpeg',
      upsert: false,
    })

  if (uploadError) {
    console.error('Storage upload error:', uploadError)
    return NextResponse.json({ error: 'Greška pri pohrani fotografije.' }, { status: 500 })
  }

  // 6. Generiranje verifikacijskog tokena
  const verificationToken = crypto.randomUUID()

  // 7. INSERT u klijentske_prijave
  const { data: insertData, error: insertError } = await adminSupabase
    .from('klijentske_prijave')
    .insert({
      sn_poslan: sn,
      tip_sistema: uredajInfo.tip_sistema,
      serijski_broj: uredajInfo.serijski_broj,
      poduzece: uredajInfo.poduzece,
      ime_operatera: imeOperatera,
      prezime_operatera: prezimeOperatera,
      email,
      telefon,
      opis_problema: opisProblema,
      zeljeno_vrijeme: zeljenoVrijeme || null,
      slika_storage_path: storagePath,
      status: 'na_cekanju',
      verification_token: verificationToken,
      ip_address: ip,
    })
    .select('id, created_at')
    .single()

  if (insertError || !insertData) {
    console.error('Insert error:', insertError)
    return NextResponse.json({ error: 'Greška pri pohrani prijave.' }, { status: 500 })
  }

  // 8. Šalji verifikacijski email (async, ne blokira response)
  after(async () => {
    try {
      await sendVerificationEmail({
        email,
        ime_operatera: imeOperatera,
        prezime_operatera: prezimeOperatera,
        tip_sistema: uredajInfo.tip_sistema,
        poduzece: uredajInfo.poduzece,
        verificationToken,
      })
    } catch (err) {
      console.error('[after] sendVerificationEmail failed:', err)
    }
  })

  return NextResponse.json({ success: true })
}
