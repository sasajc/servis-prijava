'use client'

import { useState, useRef } from 'react'
import { compressImage } from '@/lib/imageUtils'
import type { UredajInfo } from '@/lib/types'
import LogokodLogo from '@/components/LogokodLogo'
import DateTimePicker from '@/components/DateTimePicker'

interface Props {
  uredaj: UredajInfo | null
  snPoslan: string | null
}

type Korak = 1 | 2 | 3 | 4 | 'cekanje_emaila'

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

export default function PrijavaForm({ uredaj, snPoslan }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [korak, setKorak] = useState<Korak>(1)
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [opisProblema, setOpisProblema] = useState('')
  const [imeOperatera, setImeOperatera] = useState('')
  const [prezimeOperatera, setPrezimeOperatera] = useState('')
  const [telefon, setTelefon] = useState('')
  const [email, setEmail] = useState('')
  const [emailTouched, setEmailTouched] = useState(false)
  const [zeljenoVrijeme, setZeljenoVrijeme] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    const immediatePreview = URL.createObjectURL(file)
    setFotoPreview(immediatePreview)
    try {
      const compressed = await compressImage(file)
      setFotoFile(compressed)
      URL.revokeObjectURL(immediatePreview)
      setFotoPreview(URL.createObjectURL(compressed))
    } catch {
      setFotoPreview(null)
      setError('Greška pri učitavanju slike. Pokušajte ponovo.')
    }
  }

  async function handleSubmit() {
    if (!fotoFile || !imeOperatera.trim() || !prezimeOperatera.trim() || !telefon.trim() || !email.trim()) return
    if (!isValidEmail(email)) return
    setSubmitting(true)
    setError(null)

    try {
      const fd = new FormData()
      if (snPoslan) fd.append('sn', snPoslan)
      fd.append('opisProblema', opisProblema)
      fd.append('imeOperatera', imeOperatera.trim())
      fd.append('prezimeOperatera', prezimeOperatera.trim())
      fd.append('telefon', telefon.trim())
      fd.append('email', email.trim())
      fd.append('zeljenoVrijeme', zeljenoVrijeme)
      fd.append('slika', fotoFile)

      const res = await fetch('/api/prijava', { method: 'POST', body: fd })
      const json = await res.json()

      if (!res.ok) {
        if (res.status === 429) {
          setError('Previše prijava. Molim pričekajte sat vremena i pokušajte ponovo.')
        } else {
          setError(json.error ?? 'Greška pri slanju. Pokušajte ponovo.')
        }
        setSubmitting(false)
        return
      }

      setKorak('cekanje_emaila')
    } catch {
      setError('Greška mreže. Provjerite internetsku vezu i pokušajte ponovo.')
      setSubmitting(false)
    }
  }

  const uredajNaziv = uredaj?.tip_sistema ?? (snPoslan ? `S/N: ${snPoslan}` : null)
  const korak3Valid = imeOperatera.trim() && prezimeOperatera.trim() && telefon.trim() && email.trim() && isValidEmail(email)
  const emailError = emailTouched && email && !isValidEmail(email) ? 'Unesite ispravnu e-mail adresu' : null

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <LogokodLogo size="md" />
          <span className="text-xs text-zinc-500 font-medium">Prijava servisa</span>
        </div>
        {uredajNaziv && (
          <div className="mt-2 pt-2 border-t border-zinc-800">
            <p className="text-sm text-amber-400 font-medium">{uredajNaziv}</p>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              {uredaj?.poduzece && (
                <p className="text-xs text-zinc-400">{uredaj.poduzece}</p>
              )}
              {uredaj?.serijski_broj && (
                <p className="text-xs text-zinc-500">S/N: <span className="text-zinc-300 font-mono">{uredaj.serijski_broj}</span></p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Step indicator — skriven na ekranu čekanja */}
      {korak !== 'cekanje_emaila' && (
        <div className="px-4 pt-5 pb-4">
          <div className="flex items-start justify-between relative">
            {/* Connecting track */}
            <div className="absolute top-4 left-0 right-0 h-px bg-zinc-700 mx-8" />
            <div
              className="absolute top-4 left-0 h-px bg-amber-700 mx-8 transition-all duration-500"
              style={{ width: `calc(${((typeof korak === 'number' ? korak - 1 : 4) / 3) * 100}% - 0px)`, maxWidth: 'calc(100% - 4rem)' }}
            />

            {(['Foto', 'Opis', 'Podaci', 'Pregled'] as const).map((label, i) => {
              const stepNum = (i + 1) as 1 | 2 | 3 | 4
              const isActive = korak === stepNum
              const isDone = typeof korak === 'number' && korak > stepNum

              return (
                <div key={label} className="flex flex-col items-center gap-1.5 z-10" style={{ width: '25%' }}>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      isActive
                        ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-110'
                        : isDone
                        ? 'bg-amber-800 text-amber-200'
                        : 'bg-zinc-800 border border-zinc-600 text-zinc-500'
                    }`}
                  >
                    {isDone ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    ) : (
                      stepNum
                    )}
                  </div>
                  <span className={`text-xs transition-colors duration-300 ${
                    isActive ? 'text-amber-400 font-semibold' : isDone ? 'text-amber-700' : 'text-zinc-600'
                  }`}>
                    {label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Sadržaj koraka */}
      <div className="flex-1 px-4 pb-8">

        {/* KORAK 1 — Fotografija */}
        {korak === 1 && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-xl font-bold text-white">Fotografija kvara</h2>
              <p className="text-sm text-zinc-400 mt-1">Snimite fotografiju kvara ili dijela stroja koji ima problem.</p>
            </div>

            {fotoPreview ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fotoPreview}
                  alt="Snimljena fotografija"
                  className="w-full max-h-72 object-contain rounded-xl border border-zinc-700 bg-zinc-900"
                />
                <button
                  onClick={() => { setFotoFile(null); setFotoPreview(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                  className="absolute top-2 right-2 bg-zinc-800 text-zinc-300 rounded-full w-8 h-8 flex items-center justify-center text-lg hover:bg-zinc-700"
                  type="button"
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full min-h-[200px] border-2 border-dashed border-zinc-600 rounded-2xl flex flex-col items-center justify-center gap-3 text-zinc-400 hover:border-amber-600 hover:text-amber-500 hover:bg-amber-950/20 transition-all duration-200 active:scale-[0.99]"
              >
                <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-base">Snimi ili odaberi fotografiju</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Tapnite za otvaranje kamere ili galerije</p>
                </div>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFotoChange}
            />

            {error && <p className="text-red-400 text-sm bg-red-950/50 border border-red-800 rounded-lg px-3 py-2">{error}</p>}

            <button
              type="button"
              onClick={() => setKorak(2)}
              disabled={!fotoFile}
              className="w-full min-h-[56px] bg-amber-700 text-white font-bold text-lg rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-600 transition-colors"
            >
              Dalje →
            </button>
          </div>
        )}

        {/* KORAK 2 — Opis problema */}
        {korak === 2 && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-xl font-bold text-white">Opis problema</h2>
              <p className="text-sm text-zinc-400 mt-1">Opišite simptome kvara ili razlog poziva servisa. (opcionalno)</p>
            </div>

            <div>
              <textarea
                value={opisProblema}
                onChange={(e) => setOpisProblema(e.target.value.slice(0, 1000))}
                placeholder="Npr: Pisač ne ispisuje, pojavljuje se greška E05, boja curi..."
                rows={6}
                className="w-full bg-zinc-800 border border-zinc-600 text-white rounded-xl px-4 py-3 resize-none focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 placeholder:text-zinc-500"
              />
              <p className="text-xs text-zinc-500 text-right mt-1">{opisProblema.length}/1000</p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setKorak(1)}
                className="min-h-[56px] px-6 bg-zinc-800 text-zinc-300 font-semibold rounded-xl hover:bg-zinc-700 transition-colors"
              >
                ← Nazad
              </button>
              <button
                type="button"
                onClick={() => setKorak(3)}
                className="flex-1 min-h-[56px] bg-amber-700 text-white font-bold text-lg rounded-xl hover:bg-amber-600 transition-colors"
              >
                Dalje →
              </button>
            </div>
          </div>
        )}

        {/* KORAK 3 — Vaši podaci */}
        {korak === 3 && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-xl font-bold text-white">Vaši podaci</h2>
              <p className="text-sm text-zinc-400 mt-1">Potrebni za slanje potvrde i kontakt servisnog tima.</p>
            </div>

            <div className="flex flex-col gap-4">
              {/* Ime */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Ime <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={imeOperatera}
                  onChange={(e) => setImeOperatera(e.target.value)}
                  placeholder="Unesite ime"
                  className="w-full bg-zinc-800 border border-zinc-600 text-white rounded-xl px-4 py-4 focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 placeholder:text-zinc-500"
                  autoComplete="given-name"
                />
              </div>

              {/* Prezime */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Prezime <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={prezimeOperatera}
                  onChange={(e) => setPrezimeOperatera(e.target.value)}
                  placeholder="Unesite prezime"
                  className="w-full bg-zinc-800 border border-zinc-600 text-white rounded-xl px-4 py-4 focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 placeholder:text-zinc-500"
                  autoComplete="family-name"
                />
              </div>

              {/* Mobitel */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Broj mobitela <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  value={telefon}
                  onChange={(e) => setTelefon(e.target.value)}
                  placeholder="npr. 091 234 5678"
                  className="w-full bg-zinc-800 border border-zinc-600 text-white rounded-xl px-4 py-4 focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 placeholder:text-zinc-500"
                  autoComplete="tel"
                />
              </div>

              {/* E-mail */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  E-mail adresa <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (emailTouched) setEmailTouched(true) }}
                  onBlur={() => setEmailTouched(true)}
                  placeholder="ime@tvrtka.hr"
                  className={`w-full bg-zinc-800 border text-white rounded-xl px-4 py-4 focus:outline-none focus:ring-2 placeholder:text-zinc-500 transition-colors ${
                    emailError
                      ? 'border-red-600 focus:border-red-500 focus:ring-red-600/20'
                      : 'border-zinc-600 focus:border-amber-600 focus:ring-amber-600/20'
                  }`}
                  autoComplete="email"
                />
                {emailError && (
                  <p className="text-red-400 text-xs mt-1.5">{emailError}</p>
                )}
                <p className="text-xs text-zinc-500 mt-1.5">Na ovu adresu dobit ćete link za potvrdu prijave.</p>
              </div>

              {/* Željeni termin */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Željeni termin servisa
                </label>
                <DateTimePicker
                  value={zeljenoVrijeme}
                  onChange={setZeljenoVrijeme}
                  min={new Date().toISOString().slice(0, 16)}
                />
                <p className="text-xs text-zinc-500 mt-1">Opcionalno — prijedlog termina za servisnu posjetu</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setKorak(2)}
                className="min-h-[56px] px-6 bg-zinc-800 text-zinc-300 font-semibold rounded-xl hover:bg-zinc-700 transition-colors"
              >
                ← Nazad
              </button>
              <button
                type="button"
                onClick={() => setKorak(4)}
                disabled={!korak3Valid}
                className="flex-1 min-h-[56px] bg-amber-700 text-white font-bold text-lg rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-600 transition-colors"
              >
                Dalje →
              </button>
            </div>
          </div>
        )}

        {/* KORAK 4 — Potvrda */}
        {korak === 4 && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-xl font-bold text-white">Pregled i slanje</h2>
              <p className="text-sm text-zinc-400 mt-1">Provjerite podatke i pošaljite prijavu.</p>
            </div>

            {/* Sažetak */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              {fotoPreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fotoPreview} alt="Fotografija kvara" className="w-full max-h-48 object-cover" />
              )}
              <div className="px-4 py-4 flex flex-col gap-3">
                {uredajNaziv && (
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">Uređaj</p>
                    <p className="text-white font-medium">{uredajNaziv}</p>
                    {uredaj?.poduzece && <p className="text-sm text-zinc-400">{uredaj.poduzece}</p>}
                  </div>
                )}
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Operater</p>
                  <p className="text-white font-medium">{imeOperatera} {prezimeOperatera}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Kontakt</p>
                  <p className="text-zinc-300 text-sm">{telefon}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">E-mail</p>
                  <p className="text-zinc-300 text-sm">{email}</p>
                </div>
                {opisProblema && (
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">Opis</p>
                    <p className="text-zinc-300 text-sm">{opisProblema.slice(0, 200)}{opisProblema.length > 200 ? '...' : ''}</p>
                  </div>
                )}
                {zeljenoVrijeme && (
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">Željeni termin</p>
                    <p className="text-zinc-300 text-sm">{new Date(zeljenoVrijeme).toLocaleString('hr-HR', { dateStyle: 'short', timeStyle: 'short' })}</p>
                  </div>
                )}
              </div>
            </div>

            {error && <p className="text-red-400 text-sm bg-red-950/50 border border-red-800 rounded-lg px-3 py-2">{error}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setKorak(3)}
                disabled={submitting}
                className="min-h-[56px] px-6 bg-zinc-800 text-zinc-300 font-semibold rounded-xl hover:bg-zinc-700 transition-colors disabled:opacity-40"
              >
                ← Nazad
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 min-h-[56px] bg-amber-700 text-white font-bold text-lg rounded-xl disabled:opacity-60 disabled:cursor-not-allowed hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Šaljem...
                  </>
                ) : (
                  'Pošalji prijavu'
                )}
              </button>
            </div>
          </div>
        )}

        {/* KORAK 'cekanje_emaila' — Provjerite e-mail */}
        {korak === 'cekanje_emaila' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6 animate-fade-in">
            {/* Ikona omotnice */}
            <div className="w-24 h-24 rounded-full bg-amber-900/30 border-2 border-amber-700 flex items-center justify-center animate-glow-pulse">
              <svg className="w-12 h-12 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Provjerite e-mail!</h2>
              <p className="text-zinc-400 text-sm leading-relaxed max-w-xs">
                Poslali smo poruku na:
              </p>
              <p className="text-amber-400 font-semibold mt-1 break-all max-w-xs">{email}</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 max-w-xs w-full text-left">
              <p className="text-sm text-zinc-300 leading-relaxed">
                Kliknite na link <strong className="text-white">„Potvrdi prijavu"</strong> u e-mailu kako biste finalizirali prijavu i obavijestili servisni tim.
              </p>
            </div>

            <div className="w-16 h-px bg-zinc-700" />

            <div className="text-center">
              <p className="text-xs text-zinc-500">Niste primili e-mail?</p>
              <p className="text-xs text-zinc-600 mt-0.5">Provjerite spam / junk mapu.</p>
            </div>

            <div className="w-16 h-px bg-zinc-800" />
            <LogokodLogo size="sm" className="opacity-40" />
          </div>
        )}

      </div>
    </div>
  )
}
