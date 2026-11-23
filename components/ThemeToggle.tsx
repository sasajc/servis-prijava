'use client'

import { useSyncExternalStore } from 'react'

type Theme = 'light' | 'dark'

// Izvor istine je atribut data-theme na <html>; početnu vrijednost postavlja skripta u layoutu
function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb)
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => obs.disconnect()
}

const read = (): Theme => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark')

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, read, () => 'dark' as Theme)

  function toggle() {
    const next: Theme = theme === 'light' ? 'dark' : 'light'
    document.documentElement.dataset.theme = next
    try { localStorage.setItem('theme', next) } catch { /* privatni način: izbor vrijedi samo do zatvaranja */ }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'light' ? 'Prebaci na tamnu temu' : 'Prebaci na svijetlu temu'}
      className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition-colors"
    >
      {theme === 'light' ? (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <circle cx="12" cy="12" r="4" />
          <path strokeLinecap="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41" />
        </svg>
      )}
    </button>
  )
}
