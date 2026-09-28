import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell
} from 'recharts'
import { COLORS, CHART_FONT } from '../../lib/tokens'
import { MACRO_COLORS } from '../../lib/macroColors'

const GRID = COLORS.line
const AXIS = COLORS.grayLight

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-dn-surface border border-dn-line-strong rounded-sm px-3 py-2 shadow-xl">
      <div className="font-sans text-body text-dn-gray-light mb-2">{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} className="font-sans text-body text-dn-white flex justify-between gap-4">
          <span className="text-dn-gray-light capitalize">{p.dataKey.replace('_g', '')}</span>
          <span className="font-display text-display-xs tabular" style={{ color: p.fill }}>
            {typeof p.value === 'number' ? p.value.toFixed(0) : '—'}g
          </span>
        </div>
      ))}
    </div>
  )
}

export default function MacroAdherenceChart({ dailyTotals, targets }) {
  if (!dailyTotals?.length) {
    return (
      <div className="dn-card p-6 flex items-center justify-center h-52">
        <div className="font-display text-display-xs tracking-display text-dn-gray-light">No data yet</div>
      </div>
    )
  }

  const proteinTarget = targets?.protein_g ?? 180
  const carbsMax      = targets?.carbs_max_g ?? 230
  const fatMax        = targets?.fat_max_g ?? 70

  return (
    <div className="dn-card p-4 sm:p-6">
      <div className="font-sans text-caption tracking-label uppercase text-dn-gray-light mb-4">
        Macro Adherence — Last 7 Days
      </div>

      {/* Protein */}
      <div className="mb-5">
        <div className="font-sans text-caption text-dn-gray-light uppercase tracking-label mb-2">
          Protein (target {proteinTarget}g)
        </div>
        <ResponsiveContainer width="100%" height={80}>
          <BarChart data={dailyTotals} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: AXIS, ...CHART_FONT }} axisLine={false} tickLine={false} />
            <YAxis tick={false} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={proteinTarget} stroke={COLORS.orange} strokeOpacity={0.5} strokeDasharray="3 3" />
            <Bar dataKey="protein_g" radius={[1, 1, 0, 0]} maxBarSize={28}>
              {dailyTotals.map((entry, i) => (
                <Cell key={i} fill={entry.protein_g >= proteinTarget ? COLORS.success : entry.protein_g >= 150 ? COLORS.warning : COLORS.danger} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Carbs + Fat side by side */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="font-sans text-caption text-dn-gray-light uppercase tracking-label mb-2">
            Carbs (max {carbsMax}g)
          </div>
          <ResponsiveContainer width="100%" height={60}>
            <BarChart data={dailyTotals} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: AXIS, ...CHART_FONT }} axisLine={false} tickLine={false} />
              <YAxis tick={false} axisLine={false} tickLine={false} />
              <ReferenceLine y={carbsMax} stroke={COLORS.orange} strokeOpacity={0.4} strokeDasharray="3 3" />
              <Bar dataKey="carbs_g" fill={MACRO_COLORS.carbs} radius={[1, 1, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <div className="font-sans text-caption text-dn-gray-light uppercase tracking-label mb-2">
            Fat (max {fatMax}g)
          </div>
          <ResponsiveContainer width="100%" height={60}>
            <BarChart data={dailyTotals} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: AXIS, ...CHART_FONT }} axisLine={false} tickLine={false} />
              <YAxis tick={false} axisLine={false} tickLine={false} />
              <ReferenceLine y={fatMax} stroke={COLORS.orange} strokeOpacity={0.4} strokeDasharray="3 3" />
              <Bar dataKey="fat_g" fill={MACRO_COLORS.fat} radius={[1, 1, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
