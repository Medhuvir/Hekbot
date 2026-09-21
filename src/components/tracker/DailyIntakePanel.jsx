import { useState } from 'react'
import Icon from '../Icon'
import { addFoodLog, deleteFoodLog } from '../../lib/mutations'
import { MACRO_COLORS, MACRO_CHIP_BG, CALORIE_CHIP_BG, STATUS_COLORS } from '../../lib/macroColors'

const MEAL_ORDER  = ['breakfast', 'lunch', 'dinner', 'snack']
const MEAL_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snacks' }

function MacroChip({ value, unit, color, bg }) {
  return (
    <span
      className="inline-flex items-center rounded-sm px-1.5 py-0.5 font-sans text-[10px] font-semibold tabular"
      style={{ color, backgroundColor: bg }}
    >
      {value}{unit}
    </span>
  )
}

function FoodRow({ item, isAdmin, onDelete }) {
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="flex items-center justify-between gap-2 py-2 border-b border-white/[0.05] last:border-0 group">
      <div className="flex-1 min-w-0">
        <span className="font-sans text-[13px] text-dn-white truncate block">{item.food_name}</span>
        {item.notes && (
          <span className="font-sans text-[10px] text-dn-graphite truncate block">{item.notes}</span>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <MacroChip value={Math.round(item.calories)} unit="" color={MACRO_COLORS.calories} bg={CALORIE_CHIP_BG} />
        <MacroChip value={Math.round(item.protein_g)} unit="p" color={MACRO_COLORS.protein} bg={MACRO_CHIP_BG} />
        <MacroChip value={Math.round(item.carbs_g)} unit="c" color={MACRO_COLORS.carbs} bg={MACRO_CHIP_BG} />
        <MacroChip value={Math.round(item.fat_g)} unit="f" color={MACRO_COLORS.fat} bg={MACRO_CHIP_BG} />
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
            aria-label="Delete food entry"
            className="opacity-0 group-hover:opacity-100 text-dn-graphite hover:text-red-400 transition-all duration-200 shrink-0"
          >
            <Icon name="close" size={12} />
          </button>
        )
      )}
    </div>
  )
}

const BLANK = { food_name: '', calories: '', protein_g: '', carbs_g: '', fat_g: '', notes: '' }

function AddFoodForm({ date, mealType, onAdded, onCancel }) {
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
        meal_type: mealType,
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
      <div className="flex items-center justify-between mb-2">
        <span className="font-sans text-[10px] uppercase tracking-[0.15em] text-dn-graphite">
          Adding to {MEAL_LABELS[mealType]}
        </span>
        <button type="button" onClick={onCancel} className="font-sans text-[10px] text-dn-graphite hover:text-dn-white transition-colors">
          Cancel
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-2">
        <input
          className="col-span-2 sm:col-span-2 bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-1.5 font-sans text-[12px] text-dn-white placeholder-dn-graphite focus:outline-none focus:border-dn-orange/40 transition-colors"
          placeholder="Food name"
          value={form.food_name}
          onChange={e => set('food_name', e.target.value)}
          required
          autoFocus
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
      <div className="flex gap-2 items-center flex-wrap">
        <input
          className="flex-1 min-w-[120px] bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-1.5 font-sans text-[12px] text-dn-white placeholder-dn-graphite focus:outline-none focus:border-dn-orange/40 transition-colors"
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

function bucketFor(item) {
  return MEAL_ORDER.includes(item.meal_type) ? item.meal_type : 'snack'
}

export default function DailyIntakePanel({ foodLogs, isAdmin, date, onRefresh, loading, targets }) {
  const [openAddFor, setOpenAddFor] = useState(null)

  async function handleDelete(id) {
    try {
      await deleteFoodLog(id)
      onRefresh()
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) {
    return (
      <div className="dn-card p-4 sm:p-5 py-8 text-center font-sans text-[11px] text-dn-graphite">
        Loading…
      </div>
    )
  }

  const grouped = { breakfast: [], lunch: [], dinner: [], snack: [] }
  for (const item of foodLogs) grouped[bucketFor(item)].push(item)

  const t = targets || {}
  const calMid = t.calories_min && t.calories_max
    ? (t.calories_min + t.calories_max) / 2
    : (t.calories_min ?? t.calories_max ?? null)
  const mealTargetCal = calMid ? Math.round(calMid / 4) : null

  return (
    <div className="space-y-3">
      {MEAL_ORDER.map(type => {
        const items = grouped[type]
        const subtotal = items.reduce(
          (acc, i) => ({
            cal: acc.cal + (i.calories || 0),
            p: acc.p + parseFloat(i.protein_g || 0),
            c: acc.c + parseFloat(i.carbs_g || 0),
            f: acc.f + parseFloat(i.fat_g || 0),
          }),
          { cal: 0, p: 0, c: 0, f: 0 }
        )

        const pct = mealTargetCal ? subtotal.cal / mealTargetCal : 0
        const status = items.length === 0 ? null : pct >= 0.9 ? 'onTrack' : pct >= 0.5 ? 'partial' : 'low'

        return (
          <div
            key={type}
            className="dn-card p-4 sm:p-5"
            style={status ? { borderLeft: `2px solid ${STATUS_COLORS[status]}` } : undefined}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="font-display text-[16px] tracking-[0.06em] text-dn-white">
                {MEAL_LABELS[type]}
              </h3>
              {mealTargetCal && (
                <span className="font-sans text-[10px] text-dn-graphite tabular">
                  {Math.round(subtotal.cal)} / {mealTargetCal} kcal
                </span>
              )}
            </div>

            {items.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap mb-2">
                <MacroChip value={Math.round(subtotal.c)} unit="c" color={MACRO_COLORS.carbs} bg={MACRO_CHIP_BG} />
                <MacroChip value={Math.round(subtotal.p)} unit="p" color={MACRO_COLORS.protein} bg={MACRO_CHIP_BG} />
                <MacroChip value={Math.round(subtotal.f)} unit="f" color={MACRO_COLORS.fat} bg={MACRO_CHIP_BG} />
              </div>
            )}

            {items.length === 0 ? (
              <p className="font-sans text-[12px] text-dn-graphite py-1">No items logged</p>
            ) : (
              <div>
                {items.map(item => (
                  <FoodRow key={item.id} item={item} isAdmin={isAdmin} onDelete={handleDelete} />
                ))}
              </div>
            )}

            {isAdmin && (
              openAddFor === type ? (
                <AddFoodForm
                  date={date}
                  mealType={type}
                  onAdded={() => { onRefresh(); setOpenAddFor(null) }}
                  onCancel={() => setOpenAddFor(null)}
                />
              ) : (
                <button
                  onClick={() => setOpenAddFor(type)}
                  className="w-full mt-3 py-2 border border-dashed border-white/[0.15] rounded-sm font-sans text-[11px] font-semibold text-dn-orange hover:border-dn-orange/40 hover:bg-dn-orange/[0.04] transition-colors"
                >
                  + Add Food
                </button>
              )
            )}
          </div>
        )
      })}

      <div className="flex items-center gap-4 flex-wrap px-1 pt-1 font-sans text-[9px] text-dn-graphite tracking-[0.04em]">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-3 rounded-sm" style={{ backgroundColor: STATUS_COLORS.onTrack }} />
          On track
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-3 rounded-sm" style={{ backgroundColor: STATUS_COLORS.partial }} />
          Partial
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-3 rounded-sm" style={{ backgroundColor: STATUS_COLORS.low }} />
          Low
        </span>
      </div>
    </div>
  )
}
