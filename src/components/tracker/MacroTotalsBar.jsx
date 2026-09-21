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
          className={`font-sans font-semibold uppercase tracking-[0.1em] ${big ? 'text-[11px]' : 'text-[10px]'}`}
          style={{ color }}
        >
          {label}
        </span>
        <span className="font-sans text-dn-graphite tabular text-right">
          {big && (
            <span className="font-display text-[28px] text-dn-white mr-1">{Math.round(value)}</span>
          )}
          <span className={big ? 'text-[11px]' : 'text-[10px]'}>
            {big ? '' : `${Math.round(value)} `}
            {targetMax ? `/ ${target}–${targetMax}` : target ? `/ ${target}` : ''}
            {unit}
          </span>
        </span>
      </div>
      <div className={`bg-white/[0.06] rounded-full overflow-hidden ${big ? 'h-2.5' : 'h-1.5'}`}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-dn"
          style={{ width: `${pct}%`, backgroundColor: color, opacity: over ? 0.7 : 1 }}
        />
      </div>
      {denom > 0 && (
        <div className={`text-right font-sans text-[9px] tracking-[0.06em] mt-0.5 ${over ? 'text-red-400' : 'text-dn-graphite'}`}>
          {over ? `${Math.abs(remaining)}${unit} over` : `${remaining}${unit} remaining`}
        </div>
      )}
    </div>
  )
}

export default function MacroTotalsBar({ totals, targets, netCalories }) {
  if (!targets) return null

  return (
    <div className="dn-card p-4 sm:p-5 space-y-4">
      <MacroBarRow
        label="Calories"
        value={totals.calories}
        target={targets.calories_min}
        targetMax={targets.calories_max}
        unit=" kcal"
        color={MACRO_COLORS.calories}
        big
      />

      <div className="space-y-2.5 pt-3 border-t border-white/[0.06]">
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
        <div className="flex items-center justify-end pt-3 border-t border-white/[0.06]">
          <span className="font-sans text-[11px] text-dn-graphite">
            Net
            <span className="font-display text-[16px] text-dn-white tabular ml-1.5">
              {netCalories >= 0 ? '+' : ''}
              {netCalories.toFixed(0)}
            </span>
            <span className="text-[10px] ml-0.5">kcal</span>
          </span>
        </div>
      )}
    </div>
  )
}
