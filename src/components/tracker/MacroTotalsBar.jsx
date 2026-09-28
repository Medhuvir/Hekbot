import { MACRO_COLORS } from '../../lib/macroColors'

function MacroBarRow({ label, value, target, targetMax, unit = 'g', color, big }) {
  const denom = targetMax || target
  const pct = denom ? Math.min(100, Math.round((value / denom) * 100)) : 0
  const remaining = denom ? Math.round(denom - value) : null
  const over = remaining !== null && remaining < 0

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <span
          className={`font-sans font-semibold uppercase tracking-label ${big ? 'text-body' : 'text-caption'}`}
          style={{ color }}
        >
          {label}
        </span>
        <span className="font-sans text-dn-gray-light tabular text-right">
          {big && (
            <span className="font-display text-display-md text-dn-white mr-1">{Math.round(value)}</span>
          )}
          <span className="text-body">
            {big ? '' : `${Math.round(value)} `}
            {targetMax ? `/ ${target}–${targetMax}` : target ? `/ ${target}` : ''}
            {unit}
          </span>
        </span>
      </div>
      <div className={`bg-dn-fill-strong rounded-full overflow-hidden ${big ? 'h-2.5' : 'h-1.5'}`}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-dn"
          style={{ width: `${pct}%`, backgroundColor: color, opacity: over ? 0.7 : 1 }}
        />
      </div>
      {denom > 0 && (
        <div className={`text-right font-sans text-caption mt-0.5 ${over ? 'text-dn-danger' : 'text-dn-gray-light'}`}>
          {over ? `${Math.abs(remaining)}${unit} over` : `${remaining}${unit} remaining`}
        </div>
      )}
    </div>
  )
}

export default function MacroTotalsBar({ totals, targets, netCalories }) {
  if (!targets) return null

  return (
    <div className="dn-card relative overflow-hidden p-4 sm:p-5">
      <div className="relative space-y-4">
      <MacroBarRow
        label="Calories"
        value={totals.calories}
        target={targets.calories_min}
        targetMax={targets.calories_max}
        unit=" kcal"
        color={MACRO_COLORS.calories}
        big
      />

      <div className="space-y-2.5 pt-3 border-t border-dn-line">
        <MacroBarRow label="Protein" value={totals.protein_g} target={targets.protein_g} color={MACRO_COLORS.protein} />
        <MacroBarRow
          label="Carbs"
          value={totals.carbs_g}
          target={targets.carbs_min_g}
          targetMax={targets.carbs_max_g}
          color={MACRO_COLORS.carbs}
        />
        <MacroBarRow
          label="Fat"
          value={totals.fat_g}
          target={targets.fat_min_g}
          targetMax={targets.fat_max_g}
          color={MACRO_COLORS.fat}
        />
      </div>

      {netCalories !== null && netCalories !== undefined && (
        <div className="flex items-center justify-end pt-3 border-t border-dn-line">
          <span className="font-sans text-body text-dn-gray-light">
            Net
            <span className="font-display text-display-xs text-dn-white tabular ml-1.5">
              {netCalories >= 0 ? '+' : ''}
              {netCalories.toFixed(0)}
            </span>
            <span className="text-body ml-0.5">kcal</span>
          </span>
        </div>
      )}
      </div>
    </div>
  )
}
