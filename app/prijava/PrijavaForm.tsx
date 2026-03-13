'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { compressImage } from '@/lib/imageUtils'
import type { UredajInfo } from '@/lib/types'

interface Props {
  uredaj: UredajInfo | null
  snPoslan: string | null
}

type Korak = 1 | 2 | 3 | 4

export default function PrijavaForm({ uredaj, snPoslan }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [korak, setKorak] = useState<Korak>(1)
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [opisProblema, setOpisProblema] = useState('')
  const [imeOperatera, setImeOperatera] = useState('')
  const [prezimeOperatera, setPrezimeOperatera] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    try {
      const compressed = await compressImage(file)
      setFotoFile(compressed)
      const preview = URL.createObjectURL(compressed)
      setFotoPreview(preview)
    } catch {
      setError('Greška pri učitavanju slike. Pokušajte ponovo.')
    }
  }

  async function handleSubmit() {
    if (!fotoFile || !imeOperatera.trim()) return
    setSubmitting(true)
    setError(null)

    try {
      const fd = new FormData()
      if (snPoslan) fd.append('sn', snPoslan)
      fd.append('opisProblema', opisProblema)
      fd.append('imeOperatera', imeOperatera.trim())
      fd.append('prezimeOperatera', prezimeOperatera.trim())
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

      router.push('/success')
    } catch {
      setError('Greška mreže. Provjerite internetsku vezu i pokušajte ponovo.')
      setSubmitting(false)
    }
  }

  const uredajNaziv = uredaj?.tip_sistema ?? (snPoslan ? `S/N: ${snPoslan}` : null)

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-4">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">LOGOKOD d.o.o.</p>
        <h1 className="text-lg font-bold text-white mt-0.5">Prijava servisa</h1>
        {uredajNaziv && (
          <p className="text-sm text-amber-400 mt-1 font-medium">{uredajNaziv}</p>
        )}
        {uredaj?.poduzece && (
          <p className="text-xs text-zinc-400">{uredaj.poduzece}</p>
        )}
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-3 py-5">
        {([1, 2, 3, 4] as Korak[]).map((k) => (
          <div
            key={k}
            className={`w-3 h-3 rounded-full transition-all ${
              k === korak
                ? 'bg-amber-600 scale-125'
                : k < korak
                ? 'bg-amber-800'
                : 'bg-zinc-700'
            }`}
          />
        ))}
      </div>

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
                className="w-full min-h-[160px] border-2 border-dashed border-zinc-600 rounded-2xl flex flex-col items-center justify-center gap-3 text-zinc-400 hover:border-amber-700 hover:text-amber-500 transition-colors"
              >
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
                <span className="font-medium">Otvori kameru</span>
                <span className="text-xs">ili odaberi fotografiju iz galerije</span>
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
                className="w-full bg-zinc-800 border border-zinc-600 text-white rounded-xl px-4 py-3 resize-none focus:outline-none focus:border-amber-600 placeholder:text-zinc-500"
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

        {/* KORAK 3 — Operater */}
        {korak === 3 && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-xl font-bold text-white">Vaši podaci</h2>
              <p className="text-sm text-zinc-400 mt-1">Ime operatera koji prijavljuje kvar.</p>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Ime <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={imeOperatera}
                  onChange={(e) => setImeOperatera(e.target.value)}
                  placeholder="Unesite ime"
                  className="w-full bg-zinc-800 border border-zinc-600 text-white rounded-xl px-4 py-4 focus:outline-none focus:border-amber-600 placeholder:text-zinc-500"
                  autoComplete="given-name"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Prezime
                </label>
                <input
                  type="text"
                  value={prezimeOperatera}
                  onChange={(e) => setPrezimeOperatera(e.target.value)}
                  placeholder="Unesite prezime"
                  className="w-full bg-zinc-800 border border-zinc-600 text-white rounded-xl px-4 py-4 focus:outline-none focus:border-amber-600 placeholder:text-zinc-500"
                  autoComplete="family-name"
                />
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
                disabled={!imeOperatera.trim()}
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
                {opisProblema && (
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">Opis</p>
                    <p className="text-zinc-300 text-sm">{opisProblema.slice(0, 200)}{opisProblema.length > 200 ? '...' : ''}</p>
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

      </div>
    </div>
  )
}
