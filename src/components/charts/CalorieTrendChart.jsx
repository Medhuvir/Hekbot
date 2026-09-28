import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, ReferenceArea
} from 'recharts'
import { COLORS, CHART_FONT } from '../../lib/tokens'

const GRID  = COLORS.line
const AXIS  = COLORS.grayLight

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const intake = payload.find(p => p.dataKey === 'calories')
  const burned = payload.find(p => p.dataKey === 'burned')
  const net    = payload.find(p => p.dataKey === 'net')
  return (
    <div className="bg-dn-surface border border-dn-line-strong rounded-sm px-3 py-2 shadow-xl min-w-[120px]">
      <div className="font-sans text-body text-dn-gray-light mb-2">{label}</div>
      {intake && (
        <div className="font-sans text-body flex justify-between gap-4">
          <span className="text-dn-gray-light">Intake</span>
          <span className="font-display text-display-xs tabular text-dn-orange">{intake.value} kcal</span>
        </div>
      )}
      {burned && burned.value > 0 && (
        <div className="font-sans text-body flex justify-between gap-4">
          <span className="text-dn-gray-light">Burned</span>
          <span className="font-display text-display-xs tabular text-dn-success">{burned.value} kcal</span>
        </div>
      )}
      {net && (
        <div className="font-sans text-body flex justify-between gap-4 border-t border-dn-line mt-1 pt-1">
          <span className="text-dn-gray-light">Net</span>
          <span className="font-display text-display-xs tabular text-dn-white">{net.value} kcal</span>
        </div>
      )}
    </div>
  )
}

export default function CalorieTrendChart({ dailyTotals, targets }) {
  if (!dailyTotals?.length) {
    return (
      <div className="dn-card p-6 flex items-center justify-center h-52">
        <div className="font-display text-display-xs tracking-display text-dn-gray-light">No data yet</div>
      </div>
    )
  }

  const calMin = targets?.calories_min ?? 2100
  const calMax = targets?.calories_max ?? 2400

  return (
    <div className="dn-card p-4 sm:p-6">
      {/* The section heading above names the chart, so the card only carries its legend */}
      <div className="flex items-center justify-end mb-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-0.5 bg-dn-orange inline-block" />
            <span className="font-sans text-caption text-dn-gray-light">Intake</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-0.5 bg-dn-success inline-block" />
            <span className="font-sans text-caption text-dn-gray-light">Burned</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-0.5 bg-dn-gray-light/50 inline-block" />
            <span className="font-sans text-caption text-dn-gray-light">Net</span>
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={dailyTotals} margin={{ top: 8, right: 44, bottom: 0, left: -12 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: AXIS, ...CHART_FONT }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, dataMax => Math.max(dataMax, calMax + 100)]} tick={{ fill: AXIS, ...CHART_FONT }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />

          {/* Target range band */}
          <ReferenceArea y1={calMin} y2={calMax} fill={COLORS.tint} />
          <ReferenceLine y={calMin} stroke={COLORS.orange} strokeOpacity={0.2} strokeDasharray="3 3"
            label={{ value: `${calMin}`, position: 'right', ...CHART_FONT, fill: COLORS.orange }} />
          <ReferenceLine y={calMax} stroke={COLORS.orange} strokeOpacity={0.2} strokeDasharray="3 3"
            label={{ value: `${calMax}`, position: 'right', ...CHART_FONT, fill: COLORS.orange }} />

          <Line type="monotone" dataKey="calories" stroke={COLORS.orange} strokeWidth={2}
            dot={{ fill: COLORS.orange, r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
          <Line type="monotone" dataKey="burned" stroke={COLORS.success} strokeWidth={1.5}
            dot={{ fill: COLORS.success, r: 2, strokeWidth: 0 }} strokeDasharray="4 2" />
          <Line type="monotone" dataKey="net" stroke={COLORS.grayLight} strokeOpacity={0.45} strokeWidth={1.5}
            dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
