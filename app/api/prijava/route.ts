import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

// ─── Telegram ────────────────────────────────────────────────────────────────

async function sendTelegram(payload: {
  poduzece: string | null
  tip_sistema: string | null
  serijski_broj: string | null
  ime_operatera: string
  prezime_operatera: string
  opis_problema: string
  zeljeno_vrijeme: string | null
  created_at: string
  prijavaId: string
  slikaUrl: string | null
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) {
    console.error('[Telegram] missing env vars', { hasToken: !!token, hasChatId: !!chatId })
    return
  }

  const { poduzece, tip_sistema, serijski_broj, ime_operatera, prezime_operatera, opis_problema, zeljeno_vrijeme, created_at, prijavaId, slikaUrl } = payload

  const kreiranoStr = new Date(created_at).toLocaleString('hr-HR', { dateStyle: 'short', timeStyle: 'short' })
  const terminStr = zeljeno_vrijeme
    ? new Date(zeljeno_vrijeme).toLocaleString('hr-HR', { dateStyle: 'short', timeStyle: 'short' })
    : null

  const tekst = [
    '🚨 NOVA PRIJAVA SERVISA',
    '',
    `🕐 Kreirano: ${kreiranoStr}`,
    `🏭 Poduzeće: ${poduzece ?? 'Nepoznato'}`,
    `🖨️ Uređaj: ${tip_sistema ?? '—'} / ${serijski_broj ?? '—'}`,
    `👤 Operater: ${[ime_operatera, prezime_operatera].filter(Boolean).join(' ')}`,
    `📝 Opis: ${opis_problema || '(bez opisa)'}`,
    terminStr ? `📅 Željeni termin: ${terminStr}` : null,
    `🆔 ID: ${prijavaId}`,
  ].filter(Boolean).join('\n')

  const base = `https://api.telegram.org/bot${token}`

  if (slikaUrl) {
    const photoRes = await fetch(`${base}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, photo: slikaUrl, caption: tekst }),
    })
    const photoJson = await photoRes.json()
    console.log('[Telegram] sendPhoto response:', JSON.stringify(photoJson))
    if (!photoJson.ok) {
      // Fallback: pošalji tekst + link na sliku
      const tekstSLinkom = `${tekst}\n📷 Slika: ${slikaUrl}`
      const msgRes = await fetch(`${base}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: tekstSLinkom }),
      })
      const msgJson = await msgRes.json()
      console.log('[Telegram] sendMessage fallback response:', JSON.stringify(msgJson))
    }
  } else {
    const msgRes = await fetch(`${base}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: tekst }),
    })
    const msgJson = await msgRes.json()
    console.log('[Telegram] sendMessage response:', JSON.stringify(msgJson))
  }
}

// ─── Email ────────────────────────────────────────────────────────────────────

async function sendEmail(payload: {
  poduzece: string | null
  tip_sistema: string | null
  serijski_broj: string | null
  ime_operatera: string
  prezime_operatera: string
  opis_problema: string
  zeljeno_vrijeme: string | null
  created_at: string
  prijavaId: string
  slikaUrl: string | null
}) {
  const { poduzece, tip_sistema, serijski_broj, ime_operatera, prezime_operatera, opis_problema, zeljeno_vrijeme, created_at, prijavaId, slikaUrl } = payload
  const kreiranoStr = new Date(created_at).toLocaleString('hr-HR', { dateStyle: 'short', timeStyle: 'short' })
  const terminStr = zeljeno_vrijeme
    ? new Date(zeljeno_vrijeme).toLocaleString('hr-HR', { dateStyle: 'short', timeStyle: 'short' })
    : '—'

  const resend = new Resend(process.env.RESEND_API_KEY)
  const subject = `[NOVA PRIJAVA] ${poduzece ?? 'Nepoznato poduzeće'} — ${tip_sistema ?? '—'}`

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
      <div style="background: #7a4f28; color: white; padding: 20px 24px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0; font-size: 20px;">🚨 Nova prijava servisa</h2>
      </div>
      <div style="background: #f9f7f5; padding: 24px; border: 1px solid #e5e0d8; border-top: none; border-radius: 0 0 8px 8px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #666; width: 140px; font-size: 13px;">Datum prijave</td><td style="padding: 8px 0; font-weight: 600;">${kreiranoStr}</td></tr>
          <tr><td style="padding: 8px 0; color: #666; width: 140px; font-size: 13px;">Poduzeće</td><td style="padding: 8px 0; font-weight: 600;">${poduzece ?? '—'}</td></tr>
          <tr><td style="padding: 8px 0; color: #666; font-size: 13px;">Uređaj</td><td style="padding: 8px 0; font-weight: 600;">${tip_sistema ?? '—'}</td></tr>
          <tr><td style="padding: 8px 0; color: #666; font-size: 13px;">Serijski broj</td><td style="padding: 8px 0;">${serijski_broj ?? '—'}</td></tr>
          <tr><td style="padding: 8px 0; color: #666; font-size: 13px;">Operater</td><td style="padding: 8px 0;">${[ime_operatera, prezime_operatera].filter(Boolean).join(' ')}</td></tr>
          <tr><td style="padding: 8px 0; color: #666; font-size: 13px; vertical-align: top;">Opis problema</td><td style="padding: 8px 0;">${opis_problema || '<em style="color:#999">Bez opisa</em>'}</td></tr>
          <tr><td style="padding: 8px 0; color: #666; font-size: 13px;">Željeni termin</td><td style="padding: 8px 0;">${terminStr}</td></tr>
        </table>
        ${slikaUrl ? `<div style="margin-top: 16px;"><a href="${slikaUrl}" style="color: #7a4f28;">📷 Pogledaj fotografiju kvara</a></div>` : ''}
        <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #e5e0d8; font-size: 12px; color: #999;">
          ID prijave: ${prijavaId}
        </div>
      </div>
    </div>
  `

  await resend.emails.send({
    from: 'LOGOKOD Servis <noreply@logokod.hr>',
    to: 'logokod@logokod.hr',
    subject,
    html,
  })
}

// ─── POST Handler ─────────────────────────────────────────────────────────────

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
  const zeljenoVrijeme = (formData.get('zeljenoVrijeme') as string | null)?.trim() || null
  const slika = formData.get('slika') as File | null

  // 2. Validacija
  if (!imeOperatera) {
    return NextResponse.json({ error: 'Ime operatera je obavezno.' }, { status: 400 })
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

  // 6. INSERT u klijentske_prijave
  const { data: insertData, error: insertError } = await adminSupabase
    .from('klijentske_prijave')
    .insert({
      sn_poslan: sn,
      tip_sistema: uredajInfo.tip_sistema,
      serijski_broj: uredajInfo.serijski_broj,
      poduzece: uredajInfo.poduzece,
      ime_operatera: imeOperatera,
      prezime_operatera: prezimeOperatera || null,
      opis_problema: opisProblema,
      zeljeno_vrijeme: zeljenoVrijeme || null,
      slika_storage_path: storagePath,
      status: 'nova',
      ip_address: ip,
    })
    .select('id, created_at')
    .single()

  if (insertError || !insertData) {
    console.error('Insert error:', insertError)
    return NextResponse.json({ error: 'Greška pri pohrani prijave.' }, { status: 500 })
  }

  const prijavaId = (insertData as { id: string; created_at: string }).id
  const createdAt = (insertData as { id: string; created_at: string }).created_at

  // 7. Signed URL za sliku (24h) za notifikacije
  const { data: signedData } = await adminSupabase.storage
    .from('prijave-slike')
    .createSignedUrl(storagePath, 86400)
  const slikaUrl = signedData?.signedUrl ?? null

  // 8. Notifikacije (async, ne blokiraju response)
  const notifPayload = {
    poduzece: uredajInfo.poduzece,
    tip_sistema: uredajInfo.tip_sistema,
    serijski_broj: uredajInfo.serijski_broj,
    ime_operatera: imeOperatera,
    prezime_operatera: prezimeOperatera,
    opis_problema: opisProblema,
    zeljeno_vrijeme: zeljenoVrijeme,
    created_at: createdAt,
    prijavaId,
    slikaUrl,
  }

  after(async () => {
    await Promise.allSettled([
      sendTelegram(notifPayload),
      sendEmail(notifPayload),
    ])
  })

  return NextResponse.json({ success: true, id: prijavaId })
}
