import CalorieRing from './CalorieRing'
import { MACRO_COLORS } from '../../lib/macroColors'

function MacroBarRow({ label, value, target, targetMax, unit = 'g', color }) {
  const denom = targetMax || target
  const pct = denom ? Math.min(100, Math.round((value / denom) * 100)) : 0
  const remaining = denom ? Math.round(denom - value) : null
  const over = remaining !== null && remaining < 0

  return (
    <div>
      <div className="flex items-center gap-2">
        <span
          className="w-14 shrink-0 font-sans text-[10px] font-semibold uppercase tracking-[0.1em]"
          style={{ color }}
        >
          {label}
        </span>
        <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-dn"
            style={{ width: `${pct}%`, backgroundColor: color, opacity: over ? 0.7 : 1 }}
          />
        </div>
        <span className="shrink-0 font-sans text-[10px] text-dn-graphite tabular text-right">
          {Math.round(value)}
          {targetMax ? ` / ${target}–${targetMax}` : target ? ` / ${target}` : ''}
          {unit}
        </span>
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
    <div className="dn-card p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
        <CalorieRing value={totals.calories} target={targets.calories_max} size={92} />
        <div className="w-full flex-1 min-w-0 space-y-2.5">
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
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2 mt-4 pt-3 border-t border-white/[0.06]">
        <span className="font-sans text-[10px] uppercase tracking-[0.15em] text-dn-graphite">
          {targets.calories_min}–{targets.calories_max} kcal target
        </span>
        {netCalories !== null && netCalories !== undefined && (
          <span className="font-sans text-[11px] text-dn-graphite">
            Net
            <span className="font-display text-[16px] text-dn-white tabular ml-1.5">
              {netCalories >= 0 ? '+' : ''}
              {netCalories.toFixed(0)}
            </span>
            <span className="text-[10px] ml-0.5">kcal</span>
          </span>
        )}
      </div>
    </div>
  )
}
