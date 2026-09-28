import { useState } from 'react'
import { addCheckin } from '../../lib/mutations'
import { today } from '../../lib/helpers'
import { COLORS } from '../../lib/tokens'

function TrendBadge({ trend }) {
  const styles = {
    'Ahead of Pace':    'bg-dn-success/10 text-dn-success border-dn-success/30',
    'On Track':         'bg-dn-tint text-dn-orange border-dn-orange/30',
    'Needs Adjustment': 'bg-dn-danger/10 text-dn-danger border-dn-danger/30',
  }
  return (
    <span className={`font-sans text-body px-2.5 py-1 rounded-sm border ${styles[trend] ?? styles['On Track']}`}>
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
    <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-dn-line space-y-2">
      <div className="font-sans text-caption uppercase tracking-label text-dn-gray-light mb-2">
        New Check-in (fasted, morning)
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <input
          type="date"
          className="bg-dn-fill border border-dn-line rounded-sm px-3 py-1.5 font-sans text-caption text-dn-white focus:outline-none focus:border-dn-orange/60 transition-colors"
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
          className="bg-dn-fill border border-dn-line rounded-sm px-3 py-1.5 font-sans text-caption text-dn-white placeholder-dn-graphite focus:outline-none focus:border-dn-orange/60 transition-colors tabular"
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
          className="bg-dn-fill border border-dn-line rounded-sm px-3 py-1.5 font-sans text-caption text-dn-white placeholder-dn-graphite focus:outline-none focus:border-dn-orange/60 transition-colors tabular"
          value={form.waist_cm}
          onChange={e => set('waist_cm', e.target.value)}
        />
        <button
          type="submit"
          disabled={saving}
          className="btn-primary"
        >
          {saving ? '…' : 'Save Check-in'}
        </button>
      </div>
      <input
        placeholder="Notes (optional)"
        className="w-full bg-dn-fill border border-dn-line rounded-sm px-3 py-1.5 font-sans text-caption text-dn-white placeholder-dn-graphite focus:outline-none focus:border-dn-orange/60 transition-colors"
        value={form.notes}
        onChange={e => set('notes', e.target.value)}
      />
      {error && <p className="font-sans text-body text-dn-danger">{error}</p>}
    </form>
  )
}

export default function WeeklySummary({ summary, isAdmin, onRefresh }) {
  if (!summary) {
    return (
      <div className="dn-card p-4 sm:p-5">
        <div className="font-sans text-caption uppercase tracking-label text-dn-gray-light mb-3">
          Weekly Check-in
        </div>
        <div className="py-4 text-center font-sans text-caption text-dn-gray-light">
          No check-ins logged yet.
        </div>
        {isAdmin && <CheckinForm onAdded={onRefresh} />}
      </div>
    )
  }

  const { avgCalories, proteinAdherence, weightDelta, waistDelta, trend, latest } = summary

  return (
    <div className="dn-card relative overflow-hidden p-4 sm:p-5">
      <div className="relative">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <div className="font-sans text-caption text-dn-gray-light">Last 7 days</div>
        <TrendBadge trend={trend} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <div className="font-sans text-caption uppercase tracking-label text-dn-gray-light mb-0.5">
            Avg Calories
          </div>
          <div className="font-display text-display-sm text-dn-white tabular leading-none">
            {avgCalories.toLocaleString()}
          </div>
          <div className="font-sans text-caption text-dn-gray-light">kcal/day</div>
        </div>

        <div>
          <div className="font-sans text-caption uppercase tracking-label text-dn-gray-light mb-0.5">
            Protein Days
          </div>
          <div className="font-display text-display-sm tabular leading-none" style={{
            color: proteinAdherence >= 80 ? COLORS.success : proteinAdherence >= 60 ? COLORS.orange : COLORS.danger
          }}>
            {proteinAdherence}%
          </div>
          <div className="font-sans text-caption text-dn-gray-light">≥ 180g protein</div>
        </div>

        <div>
          <div className="font-sans text-caption uppercase tracking-label text-dn-gray-light mb-0.5">
            Weight Δ
          </div>
          <div className="font-display text-display-sm tabular leading-none" style={{
            color: weightDelta === null ? COLORS.grayLight : weightDelta < 0 ? COLORS.success : COLORS.danger
          }}>
            {weightDelta === null ? '—' : `${weightDelta > 0 ? '+' : ''}${weightDelta}`}
          </div>
          <div className="font-sans text-caption text-dn-gray-light">lbs vs prior week</div>
        </div>

        <div>
          <div className="font-sans text-caption uppercase tracking-label text-dn-gray-light mb-0.5">
            Current Weight
          </div>
          <div className="font-display text-display-sm text-dn-white tabular leading-none">
            {latest?.weight_lbs ?? '—'}
          </div>
          <div className="font-sans text-caption text-dn-gray-light">lbs (last check-in)</div>
        </div>
      </div>

      {isAdmin && <CheckinForm onAdded={onRefresh} />}
      </div>
    </div>
  )
}
