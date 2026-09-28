import { useState } from 'react'
import Icon from '../Icon'
import { TRAINING_DAY_ORDER, TRAINING_DAY_LABEL } from '../../lib/helpers'

const WORKOUT_TYPE_OPTIONS = ['Rest', 'Resistance Training', 'Martial Arts', 'Other']

const inputCls =
  'bg-dn-fill border border-dn-line rounded-sm px-2.5 py-1.5 font-sans text-caption text-dn-white placeholder-dn-graphite focus:outline-none focus:border-dn-orange/60 transition-colors tabular'

const fieldLabelCls = 'font-sans text-label uppercase tracking-label text-dn-gray-light'

const MACRO_FIELDS = [
  { key: 'kcal',      label: 'Calories', step: '1' },
  { key: 'protein_g', label: 'Protein g', step: '0.1' },
  { key: 'carbs_g',   label: 'Carbs g',   step: '0.1' },
  { key: 'fat_g',      label: 'Fat g',     step: '0.1' },
]

const TARGET_FIELDS = [
  { key: 'calories',     label: 'Kcal goal' },
  { key: 'calories_min', label: 'Kcal min' },
  { key: 'calories_max', label: 'Kcal max' },
  { key: 'protein_g',    label: 'Protein g' },
  { key: 'carbs_min_g',  label: 'Carbs min' },
  { key: 'carbs_max_g',  label: 'Carbs max' },
  { key: 'fat_min_g',    label: 'Fat min' },
  { key: 'fat_max_g',    label: 'Fat max' },
]

let uid = 0
function nextId() { return `review-${++uid}` }

function draftFromFoodItem(item, presetId = null) {
  return {
    _id:       nextId(),
    presetId,
    food_item: item.food_item,
    kcal:      Math.round(item.kcal ?? 0),
    protein_g: Number((item.protein_g ?? 0).toFixed(1)),
    carbs_g:   Number((item.carbs_g   ?? 0).toFixed(1)),
    fat_g:     Number((item.fat_g     ?? 0).toFixed(1)),
    meal_type: item.meal_type ?? null,
    savePreset: false,
    presetName: item.food_item,
    searching: false,
    searchQuery: '',
    searchError: null,
  }
}

// `extraction` (from /chat) or `preset` (a tapped saved meal) — exactly one is provided.
// `onResearchItem(query)` re-runs AI extraction for a single item's replacement description.
export default function HekbotReview({ extraction, preset, logDate, onConfirm, onDiscard, submitting, onResearchItem }) {
  const [foodItems, setFoodItems] = useState(() => {
    if (preset) return [draftFromFoodItem({ food_item: preset.name, kcal: preset.calories, protein_g: preset.protein_g, carbs_g: preset.carbs_g, fat_g: preset.fat_g, meal_type: preset.meal_type }, preset.id)]
    return (extraction?.food_items ?? []).map(item => draftFromFoodItem(item))
  })
  const [bodyEntry, setBodyEntry] = useState(() => extraction?.body_entry ? { ...extraction.body_entry, include: true } : null)
  const [workoutEntry, setWorkoutEntry] = useState(() => extraction?.workout_entry ? { ...extraction.workout_entry, include: true } : null)
  const [trainingSchedule, setTrainingSchedule] = useState(() => (
    extraction?.training_schedule ? { ...extraction.training_schedule, include: true } : null
  ))

  const [targets, setTargets] = useState(() => (
    extraction?.targets ? { ...extraction.targets, include: true } : null
  ))

  const hasContent = foodItems.length > 0 || bodyEntry || workoutEntry || trainingSchedule || targets

  function updateScheduleDay(day, value) {
    setTrainingSchedule(s => ({ ...s, [day]: value === 'Rest' ? null : value }))
  }

  function updateItem(id, field, value) {
    setFoodItems(items => items.map(it => {
      if (it._id !== id) return it
      const next = { ...it, [field]: value }
      // Any macro/name edit invalidates the preset link — it's a manual edit now.
      if (['food_item', 'kcal', 'protein_g', 'carbs_g', 'fat_g'].includes(field)) next.presetId = null
      return next
    }))
  }

  function removeItem(id) {
    setFoodItems(items => items.filter(it => it._id !== id))
  }

  function toggleSearch(id) {
    setFoodItems(items => items.map(it => (
      it._id === id ? { ...it, searching: !it.searching, searchQuery: '', searchError: null } : it
    )))
  }

  function setSearchQuery(id, value) {
    setFoodItems(items => items.map(it => (it._id === id ? { ...it, searchQuery: value } : it)))
  }

  async function submitSearch(id) {
    const target = foodItems.find(it => it._id === id)
    if (!target || !target.searchQuery.trim() || !onResearchItem) return

    setFoodItems(items => items.map(it => (it._id === id ? { ...it, searchError: null, searchLoading: true } : it)))
    try {
      const found = await onResearchItem(target.searchQuery.trim())
      if (!found) {
        setFoodItems(items => items.map(it => (
          it._id === id ? { ...it, searchLoading: false, searchError: "Couldn't find macros for that — try rephrasing." } : it
        )))
        return
      }
      setFoodItems(items => items.map(it => (
        it._id === id
          ? {
              ...it,
              food_item: found.food_item,
              kcal:      Math.round(found.kcal ?? 0),
              protein_g: Number((found.protein_g ?? 0).toFixed(1)),
              carbs_g:   Number((found.carbs_g   ?? 0).toFixed(1)),
              fat_g:     Number((found.fat_g     ?? 0).toFixed(1)),
              meal_type: found.meal_type ?? it.meal_type,
              presetId:  null,
              searching: false,
              searchQuery: '',
              searchError: null,
              searchLoading: false,
            }
          : it
      )))
    } catch (err) {
      setFoodItems(items => items.map(it => (
        it._id === id ? { ...it, searchLoading: false, searchError: err.message } : it
      )))
    }
  }

  function handleConfirm() {
    const foodPayload = []
    const presetPayload = []
    const savePresetPayload = []

    for (const it of foodItems) {
      if (it.presetId) {
        presetPayload.push({ preset_id: it.presetId })
        continue
      }
      const index = foodPayload.length
      foodPayload.push({
        food_item: it.food_item,
        kcal:      Number(it.kcal) || 0,
        protein_g: Number(it.protein_g) || 0,
        carbs_g:   Number(it.carbs_g) || 0,
        fat_g:     Number(it.fat_g) || 0,
        meal_type: it.meal_type,
        confidence: 'high',
      })
      if (it.savePreset) savePresetPayload.push({ food_item_index: index, name: it.presetName || it.food_item })
    }

    onConfirm({
      log_date:      logDate,
      source:        extraction?.source ?? 'text',
      raw_input:     extraction?.raw_input ?? '',
      food_items:    foodPayload,
      presets:       presetPayload,
      body_entry:    bodyEntry?.include ? { weight_lbs: bodyEntry.weight_lbs ?? null, waist_cm: bodyEntry.waist_cm ?? null } : null,
      workout_entry: workoutEntry?.include ? {
        workout_type: workoutEntry.workout_type,
        workout_name: workoutEntry.workout_name,
        duration_min: workoutEntry.duration_min,
        calories_burned: workoutEntry.calories_burned,
      } : null,
      save_as_preset: savePresetPayload,
      training_schedule: trainingSchedule?.include
        ? Object.fromEntries(TRAINING_DAY_ORDER.map(day => [day, trainingSchedule[day] ?? null]))
        : null,
      targets: targets?.include
        ? Object.fromEntries(TARGET_FIELDS.map(f => [f.key, Math.round(Number(targets[f.key]) || 0)]))
        : null,
    })
  }

  if (!hasContent) return null

  return (
    <div className="ml-7 rounded-sm border border-dn-orange/30 bg-dn-fill overflow-hidden">
      <div className="px-3.5 py-2 border-b border-dn-line font-sans text-caption uppercase tracking-label text-dn-orange">
        Review before logging
      </div>

      <div className="p-3.5 space-y-3">
        {foodItems.map(it => (
          <div key={it._id} className="space-y-1.5">
            <div className="flex items-center gap-2">
              <input
                className={`${inputCls} flex-1`}
                value={it.food_item}
                onChange={e => updateItem(it._id, 'food_item', e.target.value)}
              />
              {onResearchItem && (
                <button
                  type="button"
                  onClick={() => toggleSearch(it._id)}
                  aria-label="Search again"
                  className={`transition-colors px-1 ${it.searching ? 'text-dn-orange' : 'text-dn-gray-light hover:text-dn-orange'}`}
                >
                  <Icon name="search" size={13} />
                </button>
              )}
              <button
                type="button"
                onClick={() => removeItem(it._id)}
                aria-label="Remove item"
                className="text-dn-gray-light hover:text-dn-danger transition-colors px-1"
              >
                <Icon name="close" size={12} />
              </button>
            </div>

            {it.searching && (
              <div className="flex items-center gap-1.5">
                <input
                  className={`${inputCls} flex-1`}
                  placeholder="Describe the item fully, e.g. 'large protein shake with oats'"
                  value={it.searchQuery}
                  onChange={e => setSearchQuery(it._id, e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submitSearch(it._id) } }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => submitSearch(it._id)}
                  disabled={it.searchLoading || !it.searchQuery.trim()}
                  className="btn-primary btn-sm"
                >
                  {it.searchLoading ? '…' : 'Go'}
                </button>
              </div>
            )}
            {it.searchError && (
              <p className="font-sans text-body text-dn-danger">{it.searchError}</p>
            )}

            <div className="grid grid-cols-4 gap-1.5">
              {MACRO_FIELDS.map(f => (
                <span key={f.key} className={fieldLabelCls}>{f.label}</span>
              ))}
              {MACRO_FIELDS.map(f => (
                <input
                  key={f.key}
                  className={inputCls}
                  type="number"
                  min="0"
                  step={f.step}
                  value={it[f.key]}
                  onChange={e => updateItem(it._id, f.key, e.target.value)}
                />
              ))}
            </div>
            <label className="flex items-center gap-1.5 font-sans text-body text-dn-gray-light">
              <input
                type="checkbox"
                checked={it.savePreset}
                onChange={e => updateItem(it._id, 'savePreset', e.target.checked)}
                className="accent-dn-orange"
              />
              Save as preset
            </label>
          </div>
        ))}

        {bodyEntry && (
          <div className="space-y-1.5 pt-1 border-t border-dn-line">
            <label className="flex items-center gap-1.5 font-sans text-body text-dn-gray-light">
              <input
                type="checkbox"
                checked={bodyEntry.include}
                onChange={e => setBodyEntry(b => ({ ...b, include: e.target.checked }))}
                className="accent-dn-orange"
              />
              Body check-in
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <input className={inputCls} type="number" step="0.1" value={bodyEntry.weight_lbs ?? ''}
                onChange={e => setBodyEntry(b => ({ ...b, weight_lbs: e.target.value === '' ? null : e.target.value }))}
                placeholder="weight lbs" />
              <input className={inputCls} type="number" step="0.1" value={bodyEntry.waist_cm ?? ''}
                onChange={e => setBodyEntry(b => ({ ...b, waist_cm: e.target.value === '' ? null : e.target.value }))}
                placeholder="waist cm" />
            </div>
          </div>
        )}

        {workoutEntry && (
          <div className="space-y-1.5 pt-1 border-t border-dn-line">
            <label className="flex items-center gap-1.5 font-sans text-body text-dn-gray-light">
              <input
                type="checkbox"
                checked={workoutEntry.include}
                onChange={e => setWorkoutEntry(w => ({ ...w, include: e.target.checked }))}
                className="accent-dn-orange"
              />
              Workout — {workoutEntry.workout_type}
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <input className={inputCls} type="number" min="0" value={workoutEntry.duration_min ?? ''}
                onChange={e => setWorkoutEntry(w => ({ ...w, duration_min: e.target.value === '' ? null : e.target.value }))}
                placeholder="minutes" />
              <input className={inputCls} type="number" min="0" value={workoutEntry.calories_burned ?? ''}
                onChange={e => setWorkoutEntry(w => ({ ...w, calories_burned: e.target.value === '' ? null : e.target.value }))}
                placeholder="kcal burned" />
            </div>
          </div>
        )}

        {trainingSchedule && (
          <div className="space-y-1.5 pt-1 border-t border-dn-line">
            <label className="flex items-center gap-1.5 font-sans text-body text-dn-gray-light">
              <input
                type="checkbox"
                checked={trainingSchedule.include}
                onChange={e => setTrainingSchedule(s => ({ ...s, include: e.target.checked }))}
                className="accent-dn-orange"
              />
              Weekly training schedule
            </label>
            <div className="grid grid-cols-7 gap-1">
              {TRAINING_DAY_ORDER.map(day => (
                <div key={day} className="space-y-1">
                  <div className={`${fieldLabelCls} text-center`}>{TRAINING_DAY_LABEL[day]}</div>
                  <select
                    value={trainingSchedule[day] ?? 'Rest'}
                    onChange={e => updateScheduleDay(day, e.target.value)}
                    className={`${inputCls} w-full px-1 py-1 text-label`}
                  >
                    {WORKOUT_TYPE_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt === 'Resistance Training' ? 'Resist.' : opt === 'Martial Arts' ? 'Martial' : opt}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {targets && (
          <div className="space-y-1.5 pt-1 border-t border-dn-line">
            <label className="flex items-center gap-1.5 font-sans text-body text-dn-gray-light">
              <input
                type="checkbox"
                checked={targets.include}
                onChange={e => setTargets(t => ({ ...t, include: e.target.checked }))}
                className="accent-dn-orange"
              />
              Daily targets
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {TARGET_FIELDS.map(f => (
                <div key={f.key} className="space-y-1">
                  <div className={fieldLabelCls}>{f.label}</div>
                  <input
                    className={`${inputCls} w-full`}
                    type="number"
                    min="0"
                    step="1"
                    value={targets[f.key] ?? ''}
                    onChange={e => setTargets(t => ({ ...t, [f.key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 px-3.5 py-2.5 border-t border-dn-line">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={submitting}
          className="btn-primary"
        >
          {submitting ? 'Logging…' : 'Confirm & Log'}
        </button>
        <button
          type="button"
          onClick={onDiscard}
          disabled={submitting}
          className="px-3 py-1.5 font-sans text-body text-dn-gray-light hover:text-dn-white transition-colors disabled:opacity-50"
        >
          Discard
        </button>
      </div>
    </div>
  )
}
