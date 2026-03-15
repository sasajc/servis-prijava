import { Resend } from 'resend'

// ─── Shared payload types ─────────────────────────────────────────────────────

export interface NotifPayload {
  poduzece: string | null
  tip_sistema: string | null
  serijski_broj: string | null
  ime_operatera: string
  prezime_operatera: string
  email: string
  telefon: string
  opis_problema: string
  zeljeno_vrijeme: string | null
  created_at: string
  prijavaId: string
  slikaUrl: string | null
}

export interface VerificationEmailPayload {
  email: string
  ime_operatera: string
  prezime_operatera: string
  tip_sistema: string | null
  poduzece: string | null
  verificationToken: string
}

// ─── Telegram ────────────────────────────────────────────────────────────────

export async function sendTelegram(payload: NotifPayload) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) {
    console.error('[Telegram] missing env vars', { hasToken: !!token, hasChatId: !!chatId })
    return
  }

  const {
    poduzece, tip_sistema, serijski_broj, ime_operatera, prezime_operatera,
    email, telefon, opis_problema, zeljeno_vrijeme, created_at, prijavaId, slikaUrl,
  } = payload

  const kreiranoStr = new Date(created_at).toLocaleString('hr-HR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Zagreb' })
  const terminStr = zeljeno_vrijeme
    ? new Date(zeljeno_vrijeme).toLocaleString('hr-HR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Zagreb' })
    : null

  const tekst = [
    '🚨 NOVA PRIJAVA SERVISA',
    '',
    `🕐 Kreirano: ${kreiranoStr}`,
    `🏭 Poduzeće: ${poduzece ?? 'Nepoznato'}`,
    `🖨️ Uređaj: ${tip_sistema ?? '—'} / ${serijski_broj ?? '—'}`,
    `👤 Operater: ${[ime_operatera, prezime_operatera].filter(Boolean).join(' ')}`,
    `📞 Telefon: ${telefon}`,
    `✉️ E-mail: ${email}`,
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

// ─── Email obavijest za logokod@logokod.hr ────────────────────────────────────

export async function sendEmailToLogokod(payload: NotifPayload) {
  const {
    poduzece, tip_sistema, serijski_broj, ime_operatera, prezime_operatera,
    email, telefon, opis_problema, zeljeno_vrijeme, created_at, prijavaId, slikaUrl,
  } = payload

  const kreiranoStr = new Date(created_at).toLocaleString('hr-HR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Zagreb' })
  const terminStr = zeljeno_vrijeme
    ? new Date(zeljeno_vrijeme).toLocaleString('hr-HR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Zagreb' })
    : '—'

  const resend = new Resend(process.env.RESEND_API_KEY)
  const subject = `[POTVRĐENA PRIJAVA] ${poduzece ?? 'Nepoznato poduzeće'} — ${tip_sistema ?? '—'}`

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
      <div style="background: #7a4f28; color: white; padding: 20px 24px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0; font-size: 20px;">🚨 Nova potvrđena prijava servisa</h2>
      </div>
      <div style="background: #f9f7f5; padding: 24px; border: 1px solid #e5e0d8; border-top: none; border-radius: 0 0 8px 8px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #666; width: 140px; font-size: 13px;">Datum prijave</td><td style="padding: 8px 0; font-weight: 600;">${kreiranoStr}</td></tr>
          <tr><td style="padding: 8px 0; color: #666; font-size: 13px;">Poduzeće</td><td style="padding: 8px 0; font-weight: 600;">${poduzece ?? '—'}</td></tr>
          <tr><td style="padding: 8px 0; color: #666; font-size: 13px;">Uređaj</td><td style="padding: 8px 0; font-weight: 600;">${tip_sistema ?? '—'}</td></tr>
          <tr><td style="padding: 8px 0; color: #666; font-size: 13px;">Serijski broj</td><td style="padding: 8px 0;">${serijski_broj ?? '—'}</td></tr>
          <tr><td style="padding: 8px 0; color: #666; font-size: 13px;">Operater</td><td style="padding: 8px 0;">${[ime_operatera, prezime_operatera].filter(Boolean).join(' ')}</td></tr>
          <tr><td style="padding: 8px 0; color: #666; font-size: 13px;">Telefon</td><td style="padding: 8px 0;">${telefon}</td></tr>
          <tr><td style="padding: 8px 0; color: #666; font-size: 13px;">E-mail</td><td style="padding: 8px 0;">${email}</td></tr>
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

// ─── Verifikacijski email korisniku ──────────────────────────────────────────

export async function sendVerificationEmail(payload: VerificationEmailPayload) {
  const { email, ime_operatera, prezime_operatera, tip_sistema, poduzece, verificationToken } = payload

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://servis.logokod.hr'
  const verifyUrl = `${baseUrl}/verify?token=${verificationToken}`

  const resend = new Resend(process.env.RESEND_API_KEY)
  const subject = `Potvrdite prijavu servisa — ${tip_sistema ?? 'LOGOKOD'}`

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
      <div style="background: #7a4f28; color: white; padding: 20px 24px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0; font-size: 20px;">Potvrdite prijavu servisa</h2>
        <p style="margin: 6px 0 0; font-size: 14px; opacity: 0.85;">LOGOKOD d.o.o.</p>
      </div>
      <div style="background: #f9f7f5; padding: 24px; border: 1px solid #e5e0d8; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="margin: 0 0 16px;">Pozdrav <strong>${ime_operatera} ${prezime_operatera}</strong>,</p>
        <p style="margin: 0 0 16px;">primili smo Vašu prijavu kvara za uređaj:</p>
        <div style="background: white; border: 1px solid #e5e0d8; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
          <p style="margin: 0; font-weight: 600; font-size: 16px;">${tip_sistema ?? 'Uređaj'}</p>
          ${poduzece ? `<p style="margin: 4px 0 0; color: #666; font-size: 14px;">${poduzece}</p>` : ''}
        </div>
        <p style="margin: 0 0 24px; color: #555;">
          Kako bismo potvrdili Vašu prijavu i obavijestili servisni tim,
          molimo kliknite na gumb ispod:
        </p>
        <div style="text-align: center; margin: 0 0 24px;">
          <a href="${verifyUrl}"
             style="display: inline-block; background: #7a4f28; color: white;
                    padding: 14px 32px; border-radius: 8px; text-decoration: none;
                    font-weight: bold; font-size: 16px;">
            Potvrdi prijavu
          </a>
        </div>
        <p style="margin: 0 0 8px; font-size: 13px; color: #888;">
          Ako gumb ne radi, kopirajte ovaj link u preglednik:
        </p>
        <p style="margin: 0 0 24px; font-size: 12px; color: #7a4f28; word-break: break-all;">
          ${verifyUrl}
        </p>
        <div style="border-top: 1px solid #e5e0d8; padding-top: 16px; font-size: 12px; color: #999;">
          <p style="margin: 0;">Link vrijedi 24 sata od podnošenja prijave.</p>
          <p style="margin: 8px 0 0;">Ako niste podnijeli ovu prijavu, možete ignorirati ovaj e-mail.</p>
        </div>
      </div>
    </div>
  `

  await resend.emails.send({
    from: 'LOGOKOD Servis <noreply@logokod.hr>',
    to: email,
    subject,
    html,
  })
}
