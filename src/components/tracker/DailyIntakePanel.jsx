import { useState } from 'react'
import { addFoodLog, deleteFoodLog } from '../../lib/mutations'

function FoodRow({ item, isAdmin, onDelete }) {
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/[0.05] last:border-0 group">
      <div className="flex-1 min-w-0">
        <span className="font-sans text-[13px] text-dn-white truncate block">{item.food_name}</span>
        {item.notes && (
          <span className="font-sans text-[10px] text-dn-graphite">{item.notes}</span>
        )}
      </div>
      <div className="flex items-center gap-3 ml-3 shrink-0">
        <span className="font-sans text-[11px] text-dn-graphite tabular hidden sm:block">
          P:{parseFloat(item.protein_g).toFixed(0)}g
        </span>
        <span className="font-display text-[16px] tabular text-dn-white">
          {item.calories}
          <span className="font-sans text-[10px] text-dn-graphite ml-0.5">kcal</span>
        </span>
        {isAdmin && (
          confirming ? (
            <div className="flex items-center gap-1.5">
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
              className="opacity-0 group-hover:opacity-100 font-sans text-[10px] text-dn-graphite hover:text-red-400 transition-all duration-200"
            >
              ✕
            </button>
          )
        )}
      </div>
    </div>
  )
}

const BLANK = { food_name: '', calories: '', protein_g: '', carbs_g: '', fat_g: '', notes: '' }

function AddFoodForm({ date, onAdded }) {
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.food_name || !form.calories) return
    setSaving(true)
    setError(null)
    try {
      await addFoodLog({
        log_date:  date,
        food_name: form.food_name,
        calories:  parseInt(form.calories, 10) || 0,
        protein_g: parseFloat(form.protein_g) || 0,
        carbs_g:   parseFloat(form.carbs_g) || 0,
        fat_g:     parseFloat(form.fat_g) || 0,
        notes:     form.notes || null,
      })
      setForm(BLANK)
      onAdded()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 pt-3 border-t border-white/[0.06]">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-2">
        <input
          className="col-span-2 sm:col-span-2 bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-1.5 font-sans text-[12px] text-dn-white placeholder-dn-graphite focus:outline-none focus:border-dn-orange/40 transition-colors"
          placeholder="Food name"
          value={form.food_name}
          onChange={e => set('food_name', e.target.value)}
          required
        />
        <input
          className="bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-1.5 font-sans text-[12px] text-dn-white placeholder-dn-graphite focus:outline-none focus:border-dn-orange/40 transition-colors tabular"
          placeholder="kcal"
          type="number"
          min="0"
          value={form.calories}
          onChange={e => set('calories', e.target.value)}
          required
        />
        <input
          className="bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-1.5 font-sans text-[12px] text-dn-white placeholder-dn-graphite focus:outline-none focus:border-dn-orange/40 transition-colors tabular"
          placeholder="protein g"
          type="number"
          min="0"
          step="0.1"
          value={form.protein_g}
          onChange={e => set('protein_g', e.target.value)}
        />
        <input
          className="bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-1.5 font-sans text-[12px] text-dn-white placeholder-dn-graphite focus:outline-none focus:border-dn-orange/40 transition-colors tabular"
          placeholder="carbs g"
          type="number"
          min="0"
          step="0.1"
          value={form.carbs_g}
          onChange={e => set('carbs_g', e.target.value)}
        />
      </div>
      <div className="flex gap-2 items-center">
        <input
          className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-1.5 font-sans text-[12px] text-dn-white placeholder-dn-graphite focus:outline-none focus:border-dn-orange/40 transition-colors"
          placeholder="Notes (optional)"
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
        />
        <input
          className="w-16 bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-1.5 font-sans text-[12px] text-dn-white placeholder-dn-graphite focus:outline-none focus:border-dn-orange/40 transition-colors tabular"
          placeholder="fat g"
          type="number"
          min="0"
          step="0.1"
          value={form.fat_g}
          onChange={e => set('fat_g', e.target.value)}
        />
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-1.5 bg-dn-orange text-black font-sans font-semibold text-[12px] rounded-sm hover:-translate-y-px transition-all duration-150 disabled:opacity-50"
        >
          {saving ? '…' : 'Add'}
        </button>
      </div>
      {error && <p className="font-sans text-[11px] text-red-400 mt-1">{error}</p>}
    </form>
  )
}

export default function DailyIntakePanel({ foodLogs, isAdmin, date, onRefresh, loading }) {
  async function handleDelete(id) {
    try {
      await deleteFoodLog(id)
      onRefresh()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="dn-card p-5">
      <div className="font-sans text-[10px] uppercase tracking-[0.2em] text-dn-graphite mb-4">
        Food Log
        {isAdmin && <span className="text-dn-orange ml-2">— Admin</span>}
      </div>

      {loading ? (
        <div className="py-8 text-center font-sans text-[11px] text-dn-graphite">Loading…</div>
      ) : foodLogs.length === 0 ? (
        <div className="py-6 text-center">
          <div className="font-sans text-[12px] text-dn-graphite">No food logged yet today.</div>
        </div>
      ) : (
        <div className="divide-half">
          {foodLogs.map(item => (
            <FoodRow key={item.id} item={item} isAdmin={isAdmin} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {isAdmin && <AddFoodForm date={date} onAdded={onRefresh} />}
    </div>
  )
}
