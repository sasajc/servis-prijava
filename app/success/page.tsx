export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6 text-center">
      {/* Icon */}
      <div className="w-24 h-24 rounded-full bg-green-900/40 border-2 border-green-600 flex items-center justify-center mb-6">
        <svg className="w-12 h-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      {/* Naslov */}
      <h1 className="text-2xl font-bold text-white mb-3">Prijava zaprimljena!</h1>
      <p className="text-zinc-400 max-w-xs leading-relaxed">
        Vaša prijava kvara je uspješno poslana. Servisni tim je obaviješten i kontaktirat će vas uskoro.
      </p>

      {/* Separator */}
      <div className="w-16 h-px bg-zinc-700 my-8" />

      {/* Branding */}
      <p className="text-xs text-zinc-600 uppercase tracking-widest">LOGOKOD d.o.o.</p>
      <p className="text-xs text-zinc-700 mt-1">Inženjering, zastupstva i trgovina</p>
    </div>
  )
}
