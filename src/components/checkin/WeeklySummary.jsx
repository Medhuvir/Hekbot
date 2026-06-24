import { useState } from 'react'
import { addCheckin } from '../../lib/mutations'
import { today } from '../../lib/helpers'

function TrendBadge({ trend }) {
  const styles = {
    'Ahead of Pace':    'bg-green-400/10 text-green-400 border-green-400/20',
    'On Track':         'bg-dn-orange/10 text-dn-orange border-dn-orange/20',
    'Needs Adjustment': 'bg-red-400/10 text-red-400 border-red-400/20',
  }
  return (
    <span className={`font-sans text-[10px] px-2.5 py-1 rounded-sm border ${styles[trend] ?? styles['On Track']}`}>
      {trend}
    </span>
  )
}

function CheckinForm({ onAdded }) {
  const [form, setForm] = useState({ checkin_date: today(), weight_lbs: '', waist_cm: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const set = (f, v) => setForm(p => ({ ...p, [f]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.weight_lbs) return
    setSaving(true)
    setError(null)
    try {
      await addCheckin({
        checkin_date: form.checkin_date,
        weight_lbs:   parseFloat(form.weight_lbs),
        waist_cm:     form.waist_cm ? parseFloat(form.waist_cm) : null,
        notes:        form.notes || null,
      })
      setForm({ checkin_date: today(), weight_lbs: '', waist_cm: '', notes: '' })
      onAdded()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-white/[0.06] space-y-2">
      <div className="font-sans text-[10px] uppercase tracking-[0.15em] text-dn-graphite mb-2">
        New Check-in (fasted, morning)
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <input
          type="date"
          className="bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-1.5 font-sans text-[12px] text-dn-white focus:outline-none focus:border-dn-orange/40 transition-colors"
          value={form.checkin_date}
          onChange={e => set('checkin_date', e.target.value)}
          required
        />
        <input
          type="number"
          step="0.1"
          min="100"
          max="400"
          placeholder="Weight (lbs)"
          className="bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-1.5 font-sans text-[12px] text-dn-white placeholder-dn-graphite focus:outline-none focus:border-dn-orange/40 transition-colors tabular"
          value={form.weight_lbs}
          onChange={e => set('weight_lbs', e.target.value)}
          required
        />
        <input
          type="number"
          step="0.1"
          min="50"
          max="200"
          placeholder="Waist (cm)"
          className="bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-1.5 font-sans text-[12px] text-dn-white placeholder-dn-graphite focus:outline-none focus:border-dn-orange/40 transition-colors tabular"
          value={form.waist_cm}
          onChange={e => set('waist_cm', e.target.value)}
        />
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-1.5 bg-dn-orange text-black font-sans font-semibold text-[12px] rounded-sm hover:-translate-y-px transition-all duration-150 disabled:opacity-50"
        >
          {saving ? '…' : 'Save Check-in'}
        </button>
      </div>
      <input
        placeholder="Notes (optional)"
        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-1.5 font-sans text-[12px] text-dn-white placeholder-dn-graphite focus:outline-none focus:border-dn-orange/40 transition-colors"
        value={form.notes}
        onChange={e => set('notes', e.target.value)}
      />
      {error && <p className="font-sans text-[11px] text-red-400">{error}</p>}
    </form>
  )
}

export default function WeeklySummary({ summary, isAdmin, onRefresh }) {
  if (!summary) {
    return (
      <div className="dn-card p-5">
        <div className="font-sans text-[10px] uppercase tracking-[0.2em] text-dn-graphite mb-3">
          Weekly Check-in
        </div>
        <div className="py-4 text-center font-sans text-[12px] text-dn-graphite">
          No check-ins logged yet.
        </div>
        {isAdmin && <CheckinForm onAdded={onRefresh} />}
      </div>
    )
  }

  const { avgCalories, proteinAdherence, weightDelta, waistDelta, trend, latest } = summary

  return (
    <div className="dn-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="font-sans text-[10px] uppercase tracking-[0.2em] text-dn-graphite">
          Weekly Summary
        </div>
        <TrendBadge trend={trend} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <div className="font-sans text-[9px] uppercase tracking-[0.12em] text-dn-graphite mb-0.5">
            Avg Calories
          </div>
          <div className="font-display text-[24px] text-dn-white tabular leading-none">
            {avgCalories.toLocaleString()}
          </div>
          <div className="font-sans text-[9px] text-dn-graphite">kcal/day</div>
        </div>

        <div>
          <div className="font-sans text-[9px] uppercase tracking-[0.12em] text-dn-graphite mb-0.5">
            Protein Days
          </div>
          <div className="font-display text-[24px] tabular leading-none" style={{
            color: proteinAdherence >= 80 ? '#22C55E' : proteinAdherence >= 60 ? '#FF5E1A' : '#EF4444'
          }}>
            {proteinAdherence}%
          </div>
          <div className="font-sans text-[9px] text-dn-graphite">≥ 180g protein</div>
        </div>

        <div>
          <div className="font-sans text-[9px] uppercase tracking-[0.12em] text-dn-graphite mb-0.5">
            Weight Δ
          </div>
          <div className="font-display text-[24px] tabular leading-none" style={{
            color: weightDelta === null ? '#6B6B6B' : weightDelta < 0 ? '#22C55E' : '#EF4444'
          }}>
            {weightDelta === null ? '—' : `${weightDelta > 0 ? '+' : ''}${weightDelta}`}
          </div>
          <div className="font-sans text-[9px] text-dn-graphite">lbs vs prior week</div>
        </div>

        <div>
          <div className="font-sans text-[9px] uppercase tracking-[0.12em] text-dn-graphite mb-0.5">
            Current Weight
          </div>
          <div className="font-display text-[24px] text-dn-white tabular leading-none">
            {latest?.weight_lbs ?? '—'}
          </div>
          <div className="font-sans text-[9px] text-dn-graphite">lbs (last check-in)</div>
        </div>
      </div>

      {isAdmin && <CheckinForm onAdded={onRefresh} />}
    </div>
  )
}
