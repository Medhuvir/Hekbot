import { useState, useEffect, useRef } from 'react'
import Icon from '../Icon'

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function pad(n) { return String(n).padStart(2, '0') }
function toISO(year, month, day) { return `${year}-${pad(month + 1)}-${pad(day)}` }
function parseISO(iso) {
  const [y, m] = iso.split('-').map(Number)
  return { year: y, month: m - 1 }
}

// Brand-styled replacement for the native <input type="date"> popup, whose
// colors (e.g. the selected-day highlight) can't be styled in Chrome.
// Dates are plain 'YYYY-MM-DD' strings throughout, so no timezone math.
export default function DatePickerPopover({ value, max, onPick, onClose }) {
  const ref = useRef(null)
  const [view, setView] = useState(() => parseISO(value || max))

  useEffect(() => {
    function onDown(e) {
      // The toggle button handles its own click, so don't close-then-reopen.
      if (e.target.closest?.('[data-datepicker-toggle]')) return
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const { year, month } = view
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthLabel = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const maxView = max ? parseISO(max) : null
  const atMaxMonth = maxView && (year > maxView.year || (year === maxView.year && month >= maxView.month))

  function shiftMonth(delta) {
    setView(v => {
      const d = new Date(v.year, v.month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  const cells = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Choose a date"
      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-40 w-[260px] p-3 bg-dn-black border border-white/[0.1] rounded-sm shadow-2xl"
    >
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          aria-label="Previous month"
          className="text-dn-orange hover:text-dn-orange-light transition-colors p-1"
        >
          <Icon name="chevron_left" size={18} />
        </button>
        <span className="font-sans text-[13px] uppercase tracking-[0.15em] text-dn-white">{monthLabel}</span>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          disabled={atMaxMonth}
          aria-label="Next month"
          className="text-dn-orange hover:text-dn-orange-light transition-colors p-1 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-dn-orange"
        >
          <Icon name="chevron_right" size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="font-sans text-[11px] text-dn-gray-light py-1">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`blank-${i}`} />
          const iso = toISO(year, month, day)
          const isSelected = iso === value
          const isToday = iso === max
          const isFuture = max && iso > max
          return (
            <button
              key={iso}
              type="button"
              disabled={isFuture}
              onClick={() => { onPick(iso); onClose() }}
              aria-current={isSelected ? 'date' : undefined}
              className={`h-8 rounded-sm font-sans text-[13px] tabular transition-colors
                ${isSelected
                  ? 'bg-dn-orange text-black font-semibold'
                  : isToday
                    ? 'text-dn-orange border border-dn-orange/50 hover:bg-dn-orange/15'
                    : 'text-dn-white hover:bg-white/[0.08]'}
                disabled:text-white/20 disabled:hover:bg-transparent disabled:cursor-not-allowed`}
            >
              {day}
            </button>
          )
        })}
      </div>

      {value !== max && max && (
        <button
          type="button"
          onClick={() => { onPick(max); onClose() }}
          className="mt-2 w-full font-sans text-[12px] uppercase tracking-[0.15em] text-dn-orange hover:text-dn-orange-light transition-colors py-1"
        >
          Today
        </button>
      )}
    </div>
  )
}
