import { useState } from 'react'
import Icon from '../Icon'
import { addWorkoutLog, deleteWorkoutLog } from '../../lib/mutations'
import { MACRO_COLORS, MACRO_CHIP_BG, CALORIE_CHIP_BG } from '../../lib/macroColors'
import { today } from '../../lib/helpers'

const WORKOUT_TYPES = ['Resistance Training', 'Martial Arts', 'Other']

const TYPE_ICONS = {
  'Resistance Training': '🏋️',
  'Martial Arts': '🥋',
  'Other': '⚡',
}

function Chip({ value, color, bg }) {
  return (
    <span
      className="inline-flex items-center rounded-sm px-1.5 py-0.5 font-sans text-body font-semibold tabular"
      style={{ color, backgroundColor: bg }}
    >
      {value}
    </span>
  )
}

function WorkoutRow({ item, isAdmin, onDelete }) {
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="flex items-center justify-between gap-2 py-2.5 border-b border-dn-line last:border-0 group">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-body shrink-0">{TYPE_ICONS[item.workout_type] ?? '⚡'}</span>
        <span className="font-sans text-body text-dn-white truncate">
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
              className="font-sans text-body text-dn-danger hover:text-dn-white transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="font-sans text-body text-dn-gray-light hover:text-dn-white transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            aria-label="Delete workout entry"
            className="opacity-0 group-hover:opacity-100 text-dn-gray-light hover:text-dn-danger transition-all duration-200 shrink-0"
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
    <form onSubmit={handleSubmit} className="mt-3 pt-3 border-t border-dn-line space-y-2">
      <div className="flex items-center justify-between mb-1">
        <span className="font-sans text-caption uppercase tracking-label text-dn-gray-light">
          Log Training
        </span>
        <button type="button" onClick={onCancel} className="font-sans text-body text-dn-gray-light hover:text-dn-white transition-colors">
          Cancel
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <select
          className="bg-dn-fill border border-dn-line rounded-sm px-3 py-1.5 font-sans text-caption text-dn-white focus:outline-none focus:border-dn-orange/60 transition-colors"
          value={form.workout_type}
          onChange={e => set('workout_type', e.target.value)}
        >
          {WORKOUT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <input
          className="bg-dn-fill border border-dn-line rounded-sm px-3 py-1.5 font-sans text-caption text-dn-white placeholder-dn-graphite focus:outline-none focus:border-dn-orange/60 transition-colors"
          placeholder="Custom label (optional)"
          value={form.workout_name}
          onChange={e => set('workout_name', e.target.value)}
          autoFocus
        />
      </div>
      <div className="flex gap-2 items-center flex-wrap">
        <input
          className="w-24 bg-dn-fill border border-dn-line rounded-sm px-3 py-1.5 font-sans text-caption text-dn-white placeholder-dn-graphite focus:outline-none focus:border-dn-orange/60 transition-colors tabular"
          placeholder="min"
          type="number"
          min="0"
          value={form.duration_min}
          onChange={e => set('duration_min', e.target.value)}
        />
        <input
          className="w-28 bg-dn-fill border border-dn-line rounded-sm px-3 py-1.5 font-sans text-caption text-dn-white placeholder-dn-graphite focus:outline-none focus:border-dn-orange/60 transition-colors tabular"
          placeholder="kcal burned"
          type="number"
          min="0"
          value={form.calories_burned}
          onChange={e => set('calories_burned', e.target.value)}
        />
        <button
          type="submit"
          disabled={saving}
          className="btn-primary"
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
      <div className="dn-card p-4 sm:p-5 py-8 text-center font-sans text-body text-dn-gray-light">
        Loading…
      </div>
    )
  }

  return (
    <div className="dn-card relative overflow-hidden p-4 sm:p-5">
      <div className="relative">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <h3 className="font-display text-display-xs tracking-display text-dn-white">Training</h3>
        {totalBurned > 0 && (
          <span className="font-sans text-body text-dn-gray-light">
            Total burned
            <span className="font-display text-display-xs text-dn-white tabular ml-1.5">{totalBurned}</span>
            <span className="text-body ml-0.5">kcal</span>
          </span>
        )}
      </div>

      {workoutLogs.length === 0 ? (
        <p className="font-sans text-caption text-dn-gray-light py-1">
          {date === today() ? 'No training logged today.' : 'No training logged on this day.'}
        </p>
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
            className="w-full mt-3 py-2 border border-dashed border-dn-line-strong rounded-sm font-sans text-body font-semibold text-dn-orange hover:border-dn-orange/60 hover:bg-dn-tint transition-colors"
          >
            + Log Training
          </button>
        )
      )}
      </div>
    </div>
  )
}
