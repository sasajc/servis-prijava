import { Resend } from 'resend'
import sharp from 'sharp'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

// ─── Shared payload types ─────────────────────────────────────────────────────

export interface NotifPayload {
  poduzece: string | null
  tip_sistema: string | null
  serijski_broj: string | null
  sn_poslan: string | null
  uredaj_opis_rucno: string | null
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
  serijski_broj: string | null
  sn_poslan: string | null
  uredaj_opis_rucno: string | null
  telefon: string
  opis_problema: string
  zeljeno_vrijeme: string | null
  slika: Buffer | null
  verificationToken: string
}

// Kad uređaj nije u bazi (nema S/N-a iz baze), servis mora vidjeti što je klijent upisao
function uredajNeidentificiran(p: { sn_poslan: string | null; uredaj_opis_rucno: string | null }): string {
  return `Uređaj nije identificiran — S/N: ${p.sn_poslan ?? '—'}, opis: ${p.uredaj_opis_rucno ?? '—'}`
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
    ? new Date(zeljeno_vrijeme).toLocaleString('hr-HR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'UTC' })
    : null

  const tekst = [
    '🚨 NOVA PRIJAVA SERVISA',
    '',
    `🕐 Kreirano: ${kreiranoStr}`,
    `🏭 Poduzeće: ${poduzece ?? 'Nepoznato'}`,
    serijski_broj
      ? `🖨️ Uređaj: ${tip_sistema ?? '—'} / ${serijski_broj}`
      : `⚠️ ${uredajNeidentificiran(payload)}`,
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
    ? new Date(zeljeno_vrijeme).toLocaleString('hr-HR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'UTC' })
    : '—'

  const resend = new Resend(process.env.RESEND_API_KEY)
  const subject = serijski_broj
    ? `[POTVRĐENA PRIJAVA] ${poduzece ?? 'Nepoznato poduzeće'} — ${tip_sistema ?? '—'}`
    : `[POTVRĐENA PRIJAVA] [NEIDENTIFICIRAN UREĐAJ] ${payload.uredaj_opis_rucno ?? '—'}`

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
      <div style="background: #7a4f28; color: white; padding: 20px 24px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0; font-size: 20px;">🚨 Nova potvrđena prijava servisa</h2>
      </div>
      <div style="background: #f9f7f5; padding: 24px; border: 1px solid #e5e0d8; border-top: none; border-radius: 0 0 8px 8px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #666; width: 140px; font-size: 13px;">Datum prijave</td><td style="padding: 8px 0; font-weight: 600;">${kreiranoStr}</td></tr>
          <tr><td style="padding: 8px 0; color: #666; font-size: 13px;">Poduzeće</td><td style="padding: 8px 0; font-weight: 600;">${poduzece ?? '—'}</td></tr>
          ${serijski_broj
            ? `<tr><td style="padding: 8px 0; color: #666; font-size: 13px;">Uređaj</td><td style="padding: 8px 0; font-weight: 600;">${esc(tip_sistema ?? '—')}</td></tr>
          <tr><td style="padding: 8px 0; color: #666; font-size: 13px;">Serijski broj</td><td style="padding: 8px 0;">${esc(serijski_broj)}</td></tr>`
            : `<tr><td style="padding: 8px 0; color: #666; font-size: 13px;">Uređaj</td><td style="padding: 8px 0; font-weight: 600; color: #b45309;">⚠️ ${esc(uredajNeidentificiran(payload))}</td></tr>`}
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

  const result = await resend.emails.send({
    from: 'LOGOKOD Servis <noreply@logokod.hr>',
    to: 'servisi@logokod.hr',
    subject,
    html,
  })
  console.log('[Resend] sendEmailToLogokod result:', JSON.stringify(result))
}

// ─── Verifikacijski email korisniku ──────────────────────────────────────────

const esc = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Termin je zapisan kao lokalno "zidno" vrijeme (YYYY-MM-DDTHH:mm), pa ga ne pretvaramo kroz vremenske zone.
function formatTermin(v: string): string {
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/)
  return m ? `${+m[3]}. ${+m[2]}. ${m[1]}. ${m[4]}:${m[5]}` : v
}

// Logo je PNG (SVG i div-ovi nisu pouzdani u Outlooku); slika se šalje kao inline privitak.
const logoHtml = '<img src="cid:logo" alt="LOGOKOD" width="260" style="display:block;width:260px;height:auto;border:0;margin:0 auto;">'

export async function sendVerificationEmail(payload: VerificationEmailPayload) {
  const {
    email, ime_operatera, prezime_operatera, tip_sistema, serijski_broj,
    telefon, opis_problema, zeljeno_vrijeme, slika, verificationToken,
  } = payload

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://servis-prijava.logokod.hr'
  const verifyUrl = `${baseUrl}/verify?token=${encodeURIComponent(verificationToken)}`

  const resend = new Resend(process.env.RESEND_API_KEY)
  const subject = `Potvrdite prijavu servisa — ${tip_sistema ?? 'LOGOKOD'}`

  const label = 'font-family:Arial,sans-serif;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#71717a;padding:18px 0 4px;'
  const value = 'font-family:Arial,sans-serif;font-size:16px;color:#e4e4e7;line-height:1.45;'
  const row = (l: string, v: string, strong = false) =>
    `<tr><td style="${label}">${l}</td></tr><tr><td style="${value}${strong ? 'font-weight:bold;font-size:18px;color:#ffffff;' : ''}">${v}</td></tr>`

  const uredaj = (serijski_broj
    ? [tip_sistema, `S/N: ${serijski_broj}`]
    : [payload.uredaj_opis_rucno, payload.sn_poslan ? `S/N: ${payload.sn_poslan}` : null])
    .filter(Boolean).map(x => esc(x as string)).join(' &nbsp;·&nbsp; ')
  const operater = esc(`${ime_operatera} ${prezime_operatera}`)

  // Široki izrez kao na webu: uspravne fotografije inače zauzmu pola maila.
  const fotka = slika
    ? await sharp(slika).rotate().resize(1200, 680, { fit: 'cover', position: 'attention' }).jpeg({ quality: 80 }).toBuffer()
        .catch(() => slika) // mail se mora poslati i ako obrada slike ne uspije
    : null
  const logo = await readFile(path.join(process.cwd(), 'public', 'email-logo.png'))

  const html = `<!DOCTYPE html>
<html lang="hr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark light"></head>
<body style="margin:0;padding:0;background:#ffffff;" bgcolor="#ffffff">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="background:#ffffff;"><tr><td align="center" style="padding:24px 12px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
    <tr><td bgcolor="#18181b" style="background:#18181b;border:1px solid #27272a;border-radius:16px;overflow:hidden;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td align="center" bgcolor="#09090b" style="background:#09090b;padding:22px 0;">${logoHtml}</td></tr>
        ${fotka ? `<tr><td style="font-size:0;line-height:0;"><img src="cid:prijava-slika" alt="Fotografija kvara" width="600" style="display:block;width:100%;height:auto;border:0;border-radius:16px 16px 0 0;"></td></tr>` : ''}
        <tr><td style="padding:28px 28px 8px;">
          <div style="font-family:Arial,sans-serif;font-size:26px;font-weight:bold;color:#ffffff;line-height:1.25;">Potvrdite prijavu servisa</div>
          <div style="font-family:Arial,sans-serif;font-size:16px;color:#a1a1aa;line-height:1.5;margin-top:10px;">Pozdrav <strong style="color:#e4e4e7;">${operater}</strong>, primili smo Vašu prijavu kvara. Provjerite podatke i potvrdite prijavu.</div>
        </td></tr>
        <tr><td style="padding:0 28px 8px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            ${uredaj ? row('Uređaj', uredaj, true) : ''}
            ${row('Operater', operater, true)}
            ${row('Kontakt', esc(telefon))}
            ${row('E-mail', `<a href="mailto:${esc(email)}" style="color:#e4e4e7;text-decoration:none;">${esc(email)}</a>`)}
            ${row('Opis', opis_problema ? esc(opis_problema).replace(/\n/g, '<br>') : '<em style="color:#71717a;">Bez opisa</em>')}
            ${zeljeno_vrijeme ? row('Željeni termin', esc(formatTermin(zeljeno_vrijeme))) : ''}
          </table>
        </td></tr>
        <tr><td align="center" style="padding:28px 28px 0;font-family:Arial,sans-serif;font-size:17px;font-weight:bold;color:#fbbf24;line-height:1.4;">Prijava još nije poslana servisu. Kliknite na gumb ispod kako biste je potvrdili.</td></tr>
        <tr><td align="center" style="padding:16px 28px 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" bgcolor="#d97706" style="background:#d97706;border-radius:14px;padding:28px 24px;"><a href="${verifyUrl}" style="color:#ffffff;font-family:Arial,sans-serif;font-weight:bold;font-size:26px;letter-spacing:1px;text-decoration:none;display:block;">POTVRDI PRIJAVU &nbsp;&#10140;</a></td></tr></table>
        </td></tr>
        <tr><td style="padding:0 28px 28px;font-family:Arial,sans-serif;font-size:12px;color:#71717a;line-height:1.6;">
          Ako gumb ne radi, kopirajte ovaj link u preglednik:<br>
          <a href="${verifyUrl}" style="color:#f59e0b;word-break:break-all;">${verifyUrl}</a><br><br>
          Link vrijedi 24 sata od podnošenja prijave. Ako niste podnijeli ovu prijavu, ignorirajte ovaj e-mail.
        </td></tr>
      </table>
    </td></tr>
    <tr><td align="center" style="padding:20px 0 0;font-family:Arial,sans-serif;font-size:11px;letter-spacing:2px;color:#a1a1aa;">LOGOKOD D.O.O. &nbsp;·&nbsp; Inženjering, zastupstva i trgovina</td></tr>
  </table>
</td></tr></table>
</body></html>`

  const result = await resend.emails.send({
    from: 'LOGOKOD Servis <noreply@logokod.hr>',
    to: email,
    subject,
    html,
    attachments: [
      { filename: 'logo.png', content: logo, contentId: 'logo' },
      ...(fotka ? [{ filename: 'kvar.jpg', content: fotka, contentId: 'prijava-slika' }] : []),
    ],
  })
  console.log('[Resend] sendVerificationEmail result:', JSON.stringify(result))
}
