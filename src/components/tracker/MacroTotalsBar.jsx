function MacroBar({ label, value, target, targetMax, unit = 'g', colorOverride }) {
  const pct = target ? Math.min(100, Math.round((value / target) * 100)) : 0

  const color = colorOverride
    ? colorOverride
    : pct >= 90 ? '#22C55E'
    : pct >= 70 ? '#FF5E1A'
    : '#F59E0B'

  return (
    <div>
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="font-sans text-[10px] uppercase tracking-[0.12em] text-dn-graphite">{label}</span>
        <span className="font-sans text-[11px] tabular">
          <span className="font-display text-[18px] leading-none tabular" style={{ color }}>
            {typeof value === 'number' ? value.toFixed(0) : '0'}
          </span>
          <span className="text-dn-graphite ml-0.5 text-[10px]">
            {unit}
            {targetMax
              ? ` / ${target}–${targetMax}${unit}`
              : target
              ? ` / ${target}${unit}`
              : ''}
          </span>
        </span>
      </div>
      <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-dn"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

export default function MacroTotalsBar({ totals, targets, netCalories }) {
  if (!targets) return null

  const calStatus =
    totals.calories > targets.calories_max ? 'over' :
    totals.calories > 0 && totals.calories < targets.calories_min ? 'under' :
    'on-track'

  const calColor =
    calStatus === 'over'  ? '#EF4444' :
    calStatus === 'under' ? '#F59E0B' :
    '#22C55E'

  return (
    <div className="dn-card p-5 space-y-4">
      {/* Calorie overview row */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
        <div>
          <div className="font-sans text-[10px] uppercase tracking-[0.15em] text-dn-graphite mb-0.5">
            Calories Today
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-[42px] leading-none tabular" style={{ color: calColor }}>
              {totals.calories.toFixed(0)}
            </span>
            <span className="font-sans text-[12px] text-dn-graphite">
              / {targets.calories_min}–{targets.calories_max} kcal
            </span>
          </div>
        </div>
        {netCalories !== null && netCalories !== undefined && (
          <div className="text-right">
            <div className="font-sans text-[10px] uppercase tracking-[0.12em] text-dn-graphite mb-0.5">Net</div>
            <div className="font-display text-[24px] leading-none tabular text-dn-white">
              {netCalories >= 0 ? '+' : ''}{netCalories.toFixed(0)}
              <span className="font-sans text-[11px] ml-1 text-dn-graphite">kcal</span>
            </div>
          </div>
        )}
      </div>

      {/* Macro bars */}
      <div className="grid grid-cols-3 gap-4">
        <MacroBar
          label="Protein"
          value={totals.protein_g}
          target={targets.protein_g}
          unit="g"
        />
        <MacroBar
          label="Carbs"
          value={totals.carbs_g}
          target={targets.carbs_min_g}
          targetMax={targets.carbs_max_g}
          unit="g"
          colorOverride="rgba(245,243,238,0.5)"
        />
        <MacroBar
          label="Fat"
          value={totals.fat_g}
          target={targets.fat_min_g}
          targetMax={targets.fat_max_g}
          unit="g"
          colorOverride="rgba(245,243,238,0.4)"
        />
      </div>
    </div>
  )
}
