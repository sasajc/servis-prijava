'use client'

import { useState, useRef, useEffect } from 'react'

interface DateTimePickerProps {
  value: string          // ISO "YYYY-MM-DDTHH:MM" or ""
  onChange: (value: string) => void
  min?: string           // ISO min datetime
  className?: string
}

const MONTHS_HR = [
  'Siječanj','Veljača','Ožujak','Travanj','Svibanj','Lipanj',
  'Srpanj','Kolovoz','Rujan','Listopad','Studeni','Prosinac',
]
const DAYS_HR = ['Po','Ut','Sr','Če','Pe','Su','Ne']

function parseISO(value: string) {
  if (!value) return { date: null, hours: '09', minutes: '00' }
  const d = new Date(value)
  if (isNaN(d.getTime())) return { date: null, hours: '09', minutes: '00' }
  return {
    date: d,
    hours: String(d.getHours()).padStart(2, '0'),
    minutes: String(d.getMinutes()).padStart(2, '0'),
  }
}

function formatDisplay(value: string) {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const HH = String(d.getHours()).padStart(2, '0')
  const MM = String(d.getMinutes()).padStart(2, '0')
  return `${dd}.${mm}.${yyyy}  ${HH}:${MM}`
}

function toISO(date: Date, h: string, m: string) {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const HH = String(Math.min(23, Math.max(0, parseInt(h) || 0))).padStart(2, '0')
  const MM = String(Math.min(59, Math.max(0, parseInt(m) || 0))).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}T${HH}:${MM}`
}

function getFirstDayMon(year: number, month: number) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1
}

export default function DateTimePicker({ value, onChange, min, className = '' }: DateTimePickerProps) {
  const init = parseISO(value)
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(init.date?.getFullYear() ?? new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(init.date?.getMonth() ?? new Date().getMonth())
  const [selectedDate, setSelectedDate] = useState<Date | null>(init.date)
  const [hours, setHours] = useState(init.hours)
  const [minutes, setMinutes] = useState(init.minutes)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  // Sync if parent value changes
  useEffect(() => {
    const p = parseISO(value)
    setSelectedDate(p.date)
    setHours(p.hours)
    setMinutes(p.minutes)
    if (p.date) {
      setViewYear(p.date.getFullYear())
      setViewMonth(p.date.getMonth())
    }
  }, [value])

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const offset = getFirstDayMon(viewYear, viewMonth)
  const cells: (number | null)[] = [
    ...Array<null>(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const minDate = min ? new Date(min) : null

  function isDayDisabled(day: number) {
    if (!minDate) return false
    const d = new Date(viewYear, viewMonth, day)
    const minDay = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())
    return d < minDay
  }

  function isSelected(day: number) {
    return !!selectedDate &&
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === viewMonth &&
      selectedDate.getFullYear() === viewYear
  }

  function isToday(day: number) {
    const t = new Date()
    return t.getDate() === day && t.getMonth() === viewMonth && t.getFullYear() === viewYear
  }

  function selectDay(day: number) {
    if (isDayDisabled(day)) return
    const d = new Date(viewYear, viewMonth, day)
    setSelectedDate(d)
    onChange(toISO(d, hours, minutes))
  }

  function handleHours(raw: string) {
    const v = raw.replace(/\D/g, '').slice(0, 2)
    setHours(v)
    const n = parseInt(v)
    if (!isNaN(n) && v.length === 2 && selectedDate) {
      onChange(toISO(selectedDate, v, minutes))
    }
  }

  function handleMinutes(raw: string) {
    const v = raw.replace(/\D/g, '').slice(0, 2)
    setMinutes(v)
    const n = parseInt(v)
    if (!isNaN(n) && v.length === 2 && selectedDate) {
      onChange(toISO(selectedDate, hours, v))
    }
  }

  function blurHours() {
    const padded = String(Math.min(23, Math.max(0, parseInt(hours) || 0))).padStart(2, '0')
    setHours(padded)
    if (selectedDate) onChange(toISO(selectedDate, padded, minutes))
  }

  function blurMinutes() {
    const padded = String(Math.min(59, Math.max(0, parseInt(minutes) || 0))).padStart(2, '0')
    setMinutes(padded)
    if (selectedDate) onChange(toISO(selectedDate, hours, padded))
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  function clear() {
    onChange('')
    setSelectedDate(null)
    setHours('09')
    setMinutes('00')
    setOpen(false)
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full bg-zinc-800 border text-left rounded-xl px-4 py-4 pr-12 focus:outline-none transition-colors ${
          open
            ? 'border-amber-600 ring-2 ring-amber-600/20'
            : 'border-zinc-600 hover:border-zinc-500'
        }`}
      >
        {value
          ? <span className="text-white font-mono tracking-wide">{formatDisplay(value)}</span>
          : <span className="text-zinc-500">dd.mm.yyyy  HH:MM</span>
        }
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full mt-2 left-0 right-0 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl shadow-black/70 overflow-hidden">

          {/* Month navigation */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <button
              type="button"
              onClick={prevMonth}
              className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <span className="text-white font-semibold text-sm tracking-wide">
              {MONTHS_HR[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>

          {/* Calendar grid */}
          <div className="px-3 pt-2 pb-1">
            <div className="grid grid-cols-7 mb-1">
              {DAYS_HR.map(d => (
                <div key={d} className="text-center text-xs text-zinc-500 font-semibold py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-y-0.5">
              {cells.map((day, idx) => (
                <div key={idx} className="flex items-center justify-center h-9">
                  {day !== null && (
                    <button
                      type="button"
                      onClick={() => selectDay(day)}
                      disabled={isDayDisabled(day)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-all duration-100 ${
                        isSelected(day)
                          ? 'bg-amber-500 text-white font-bold shadow-md shadow-amber-500/40 scale-105'
                          : isDayDisabled(day)
                          ? 'text-zinc-700 cursor-not-allowed'
                          : isToday(day)
                          ? 'text-amber-400 hover:bg-zinc-800'
                          : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                      }`}
                    >
                      {day}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Time picker */}
          <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-950/40">
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">Vrijeme</p>
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() => { const n = (parseInt(hours) + 1) % 24; const v = String(n).padStart(2,'0'); setHours(v); if(selectedDate) onChange(toISO(selectedDate, v, minutes)) }}
                  className="text-zinc-500 hover:text-amber-400 transition-colors p-0.5"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  value={hours}
                  onChange={e => handleHours(e.target.value)}
                  onBlur={blurHours}
                  className="w-14 bg-zinc-800 border border-zinc-600 text-white text-center font-mono text-xl rounded-lg py-2 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600/30"
                />
                <button
                  type="button"
                  onClick={() => { const n = (parseInt(hours) - 1 + 24) % 24; const v = String(n).padStart(2,'0'); setHours(v); if(selectedDate) onChange(toISO(selectedDate, v, minutes)) }}
                  className="text-zinc-500 hover:text-amber-400 transition-colors p-0.5"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                </button>
              </div>

              <span className="text-zinc-400 font-bold text-2xl mb-1">:</span>

              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() => { const n = (parseInt(minutes) + 5) % 60; const v = String(n).padStart(2,'0'); setMinutes(v); if(selectedDate) onChange(toISO(selectedDate, hours, v)) }}
                  className="text-zinc-500 hover:text-amber-400 transition-colors p-0.5"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  value={minutes}
                  onChange={e => handleMinutes(e.target.value)}
                  onBlur={blurMinutes}
                  className="w-14 bg-zinc-800 border border-zinc-600 text-white text-center font-mono text-xl rounded-lg py-2 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600/30"
                />
                <button
                  type="button"
                  onClick={() => { const n = (parseInt(minutes) - 5 + 60) % 60; const v = String(n).padStart(2,'0'); setMinutes(v); if(selectedDate) onChange(toISO(selectedDate, hours, v)) }}
                  className="text-zinc-500 hover:text-amber-400 transition-colors p-0.5"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                </button>
              </div>

              <span className="text-xs text-zinc-600 ml-1 self-center">24h</span>
            </div>
          </div>

          {/* Actions */}
          <div className="px-4 py-3 border-t border-zinc-800 flex gap-2">
            <button
              type="button"
              onClick={clear}
              className="flex-1 py-2.5 text-sm text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors"
            >
              Obriši
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={!selectedDate}
              className="flex-1 py-2.5 text-sm text-white font-semibold bg-amber-700 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors"
            >
              Potvrdi
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
