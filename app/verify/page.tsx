import { redirect } from 'next/navigation'
import { getAdminSupabase } from '@/lib/supabase'
import { sendTelegram, sendEmailToLogokod } from '@/lib/notifications'
import type { NotifPayload } from '@/lib/notifications'

interface Props {
  searchParams: Promise<{ token?: string }>
}

// ─── Error UI ─────────────────────────────────────────────────────────────────

function VerifyErrorUI({
  message,
  linkHref = '/prijava',
  linkLabel = 'Podnesite novu prijavu',
}: {
  message: string
  linkHref?: string
  linkLabel?: string
}) {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-red-900/40 border-2 border-red-700 flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h1 className="text-xl font-bold text-white mb-3">Greška pri potvrdi</h1>
      <p className="text-zinc-400 max-w-xs leading-relaxed mb-8">{message}</p>
      <a
        href={linkHref}
        className="inline-block bg-amber-700 text-white font-semibold px-6 py-3 rounded-xl hover:bg-amber-600 transition-colors"
      >
        {linkLabel}
      </a>
      <div className="w-16 h-px bg-zinc-700 my-8" />
      <p className="text-xs text-zinc-600 uppercase tracking-widest">LOGOKOD d.o.o.</p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function VerifyPage({ searchParams }: Props) {
  const { token } = await searchParams

  if (!token) {
    return <VerifyErrorUI message="Nevažeći link za potvrdu." />
  }

  const adminSupabase = getAdminSupabase()

  const { data: prijava } = await adminSupabase
    .from('klijentske_prijave')
    .select('id, created_at, verified_at, ime_operatera, prezime_operatera, email, telefon, opis_problema, zeljeno_vrijeme, poduzece, tip_sistema, serijski_broj, slika_storage_path')
    .eq('verification_token', token)
    .maybeSingle()

  if (!prijava) {
    return <VerifyErrorUI message="Link nije valjan ili je već iskorišten." />
  }

  if (prijava.verified_at !== null) {
    return (
      <VerifyErrorUI
        message="Ova prijava je već potvrđena. Servisni tim je obaviješten."
        linkHref="/prijava"
        linkLabel="Nova prijava"
      />
    )
  }

  // Provjera 24h isteka
  const createdAt = new Date(prijava.created_at)
  const expiresAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000)
  if (new Date() > expiresAt) {
    return (
      <VerifyErrorUI
        message="Link je istekao (vrijedi 24 sata). Molimo podnesite novu prijavu."
        linkHref="/prijava"
        linkLabel="Podnesite novu prijavu"
      />
    )
  }

  // UPDATE: verificiraj prijavu
  const { error: updateError } = await adminSupabase
    .from('klijentske_prijave')
    .update({
      verified_at: new Date().toISOString(),
      status: 'nova',
      verification_token: null,
    })
    .eq('id', prijava.id)

  if (updateError) {
    console.error('Verify update error:', updateError)
    return <VerifyErrorUI message="Greška pri potvrdi. Pokušajte ponovo klikom na link iz e-maila." />
  }

  // Generiraj signed URL za sliku (24h)
  let slikaUrl: string | null = null
  if (prijava.slika_storage_path) {
    const { data: signedData } = await adminSupabase.storage
      .from('prijave-slike')
      .createSignedUrl(prijava.slika_storage_path, 86400)
    slikaUrl = signedData?.signedUrl ?? null
  }

  // Šalji notifikacije (Telegram + email logokod)
  const notifPayload: NotifPayload = {
    poduzece: prijava.poduzece,
    tip_sistema: prijava.tip_sistema,
    serijski_broj: prijava.serijski_broj,
    ime_operatera: prijava.ime_operatera,
    prezime_operatera: prijava.prezime_operatera ?? '',
    email: prijava.email,
    telefon: prijava.telefon,
    opis_problema: prijava.opis_problema ?? '',
    zeljeno_vrijeme: prijava.zeljeno_vrijeme ?? null,
    created_at: prijava.created_at,
    prijavaId: prijava.id,
    slikaUrl,
  }

  await Promise.allSettled([
    sendTelegram(notifPayload),
    sendEmailToLogokod(notifPayload),
  ])

  redirect('/success?verified=true')
}
