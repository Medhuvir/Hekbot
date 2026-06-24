import { useState } from 'react'
import { addWorkoutLog, deleteWorkoutLog } from '../../lib/mutations'

const WORKOUT_TYPES = ['Resistance Training', 'Martial Arts', 'Other']

const TYPE_ICONS = {
  'Resistance Training': '🏋️',
  'Martial Arts': '🥋',
  'Other': '⚡',
}

function WorkoutRow({ item, isAdmin, onDelete }) {
  const [confirming, setConfirming] = useState(false)
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/[0.05] last:border-0 group">
      <div className="flex items-center gap-3">
        <span className="text-[16px]">{TYPE_ICONS[item.workout_type] ?? '⚡'}</span>
        <div>
          <div className="font-sans text-[13px] text-dn-white">
            {item.workout_name || item.workout_type}
          </div>
          {item.duration_min && (
            <div className="font-sans text-[10px] text-dn-graphite">{item.duration_min} min</div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {item.calories_burned > 0 && (
          <div className="text-right">
            <span className="font-display text-[16px] text-green-400 tabular">
              {item.calories_burned}
            </span>
            <span className="font-sans text-[10px] text-dn-graphite ml-0.5">kcal</span>
          </div>
        )}
        {isAdmin && (
          confirming ? (
            <div className="flex gap-1.5">
              <button onClick={() => { onDelete(item.id); setConfirming(false) }}
                className="font-sans text-[10px] text-red-400 hover:text-red-300 transition-colors">Delete</button>
              <button onClick={() => setConfirming(false)}
                className="font-sans text-[10px] text-dn-graphite hover:text-dn-white transition-colors">Cancel</button>
            </div>
          ) : (
            <button onClick={() => setConfirming(true)}
              className="opacity-0 group-hover:opacity-100 font-sans text-[10px] text-dn-graphite hover:text-red-400 transition-all duration-200">
              ✕
            </button>
          )
        )}
      </div>
    </div>
  )
}

const BLANK_WORKOUT = { workout_type: 'Resistance Training', workout_name: '', duration_min: '', calories_burned: '', notes: '' }

function AddWorkoutForm({ date, onAdded }) {
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
        />
      </div>
      <div className="flex gap-2 items-center">
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
  async function handleDelete(id) {
    try { await deleteWorkoutLog(id); onRefresh() }
    catch (e) { console.error(e) }
  }

  const totalBurned = workoutLogs.reduce((s, w) => s + (w.calories_burned || 0), 0)

  return (
    <div className="dn-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="font-sans text-[10px] uppercase tracking-[0.2em] text-dn-graphite">
          Training
        </div>
        {totalBurned > 0 && (
          <div className="font-sans text-[11px] text-dn-graphite">
            Total burned: <span className="font-display text-[16px] text-green-400 tabular">{totalBurned}</span>
            <span className="text-[10px] ml-0.5">kcal</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-6 text-center font-sans text-[11px] text-dn-graphite">Loading…</div>
      ) : workoutLogs.length === 0 ? (
        <div className="py-4 text-center font-sans text-[12px] text-dn-graphite">
          No training logged today.
        </div>
      ) : (
        workoutLogs.map(item => (
          <WorkoutRow key={item.id} item={item} isAdmin={isAdmin} onDelete={handleDelete} />
        ))
      )}

      {isAdmin && <AddWorkoutForm date={date} onAdded={onRefresh} />}
    </div>
  )
}
