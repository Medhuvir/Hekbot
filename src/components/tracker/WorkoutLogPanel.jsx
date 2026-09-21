import { useState } from 'react'
import Icon from '../Icon'
import { addWorkoutLog, deleteWorkoutLog } from '../../lib/mutations'
import { MACRO_COLORS, MACRO_CHIP_BG, CALORIE_CHIP_BG } from '../../lib/macroColors'

const WORKOUT_TYPES = ['Resistance Training', 'Martial Arts', 'Other']

const TYPE_ICONS = {
  'Resistance Training': '🏋️',
  'Martial Arts': '🥋',
  'Other': '⚡',
}

function Chip({ value, color, bg }) {
  return (
    <span
      className="inline-flex items-center rounded-sm px-1.5 py-0.5 font-sans text-[10px] font-semibold tabular"
      style={{ color, backgroundColor: bg }}
    >
      {value}
    </span>
  )
}

function WorkoutRow({ item, isAdmin, onDelete }) {
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="flex items-center justify-between gap-2 py-2.5 border-b border-white/[0.05] last:border-0 group">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-[16px] shrink-0">{TYPE_ICONS[item.workout_type] ?? '⚡'}</span>
        <span className="font-sans text-[13px] text-dn-white truncate">
          {item.workout_name || item.workout_type}
        </span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {item.duration_min && (
          <Chip value={`${item.duration_min}m`} color={MACRO_COLORS.carbs} bg={MACRO_CHIP_BG} />
        )}
        {item.calories_burned > 0 && (
          <Chip value={`${item.calories_burned} kcal`} color={MACRO_COLORS.calories} bg={CALORIE_CHIP_BG} />
        )}
      </div>
      {isAdmin && (
        confirming ? (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => { onDelete(item.id); setConfirming(false) }}
              className="font-sans text-[10px] text-red-400 hover:text-red-300 transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="font-sans text-[10px] text-dn-graphite hover:text-dn-white transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            aria-label="Delete workout entry"
            className="opacity-0 group-hover:opacity-100 text-dn-graphite hover:text-red-400 transition-all duration-200 shrink-0"
          >
            <Icon name="close" size={12} />
          </button>
        )
      )}
    </div>
  )
}

const BLANK_WORKOUT = { workout_type: 'Resistance Training', workout_name: '', duration_min: '', calories_burned: '', notes: '' }

function AddWorkoutForm({ date, onAdded, onCancel }) {
  const [form, setForm] = useState(BLANK_WORKOUT)
  const [saving, setSaving] = useState(false)

  const set = (f, v) => setForm(p => ({ ...p, [f]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await addWorkoutLog({
        log_date:        date,
        workout_type:    form.workout_type,
        workout_name:    form.workout_name || null,
        duration_min:    parseInt(form.duration_min, 10) || null,
        calories_burned: parseInt(form.calories_burned, 10) || null,
        notes:           form.notes || null,
      })
      setForm(BLANK_WORKOUT)
      onAdded()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 pt-3 border-t border-white/[0.06] space-y-2">
      <div className="flex items-center justify-between mb-1">
        <span className="font-sans text-[10px] uppercase tracking-[0.15em] text-dn-graphite">
          Log Training
        </span>
        <button type="button" onClick={onCancel} className="font-sans text-[10px] text-dn-graphite hover:text-dn-white transition-colors">
          Cancel
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <select
          className="bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-1.5 font-sans text-[12px] text-dn-white focus:outline-none focus:border-dn-orange/40 transition-colors"
          value={form.workout_type}
          onChange={e => set('workout_type', e.target.value)}
        >
          {WORKOUT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <input
          className="bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-1.5 font-sans text-[12px] text-dn-white placeholder-dn-graphite focus:outline-none focus:border-dn-orange/40 transition-colors"
          placeholder="Custom label (optional)"
          value={form.workout_name}
          onChange={e => set('workout_name', e.target.value)}
          autoFocus
        />
      </div>
      <div className="flex gap-2 items-center flex-wrap">
        <input
          className="w-24 bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-1.5 font-sans text-[12px] text-dn-white placeholder-dn-graphite focus:outline-none focus:border-dn-orange/40 transition-colors tabular"
          placeholder="min"
          type="number"
          min="0"
          value={form.duration_min}
          onChange={e => set('duration_min', e.target.value)}
        />
        <input
          className="w-28 bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-1.5 font-sans text-[12px] text-dn-white placeholder-dn-graphite focus:outline-none focus:border-dn-orange/40 transition-colors tabular"
          placeholder="kcal burned"
          type="number"
          min="0"
          value={form.calories_burned}
          onChange={e => set('calories_burned', e.target.value)}
        />
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-1.5 bg-dn-orange text-black font-sans font-semibold text-[12px] rounded-sm hover:-translate-y-px transition-all duration-150 disabled:opacity-50"
        >
          {saving ? '…' : 'Log'}
        </button>
      </div>
    </form>
  )
}

export default function WorkoutLogPanel({ workoutLogs, isAdmin, date, onRefresh, loading }) {
  const [showAdd, setShowAdd] = useState(false)

  async function handleDelete(id) {
    try { await deleteWorkoutLog(id); onRefresh() }
    catch (e) { console.error(e) }
  }

  const totalBurned = workoutLogs.reduce((s, w) => s + (w.calories_burned || 0), 0)

  if (loading) {
    return (
      <div className="dn-card p-4 sm:p-5 py-8 text-center font-sans text-[11px] text-dn-graphite">
        Loading…
      </div>
    )
  }

  return (
    <div className="dn-card p-4 sm:p-5">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <h3 className="font-display text-[16px] tracking-[0.06em] text-dn-white">Training</h3>
        {totalBurned > 0 && (
          <span className="font-sans text-[11px] text-dn-graphite">
            Total burned
            <span className="font-display text-[16px] text-dn-white tabular ml-1.5">{totalBurned}</span>
            <span className="text-[10px] ml-0.5">kcal</span>
          </span>
        )}
      </div>

      {workoutLogs.length === 0 ? (
        <p className="font-sans text-[12px] text-dn-graphite py-1">No training logged today.</p>
      ) : (
        <div>
          {workoutLogs.map(item => (
            <WorkoutRow key={item.id} item={item} isAdmin={isAdmin} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {isAdmin && (
        showAdd ? (
          <AddWorkoutForm
            date={date}
            onAdded={() => { onRefresh(); setShowAdd(false) }}
            onCancel={() => setShowAdd(false)}
          />
        ) : (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full mt-3 py-2 border border-dashed border-white/[0.15] rounded-sm font-sans text-[11px] font-semibold text-dn-orange hover:border-dn-orange/40 hover:bg-dn-orange/[0.04] transition-colors"
          >
            + Log Training
          </button>
        )
      )}
    </div>
  )
}
