import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend
} from 'recharts'
import { formatDate, projectWeightTrend } from '../../lib/helpers'
import { COLORS, CHART_FONT } from '../../lib/tokens'

const CHART = {
  actual:    COLORS.orange,
  projected: COLORS.orange,
  grid:      COLORS.line,
  axis:      COLORS.grayLight,
  tooltip:   COLORS.surface,
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-dn-surface border border-dn-orange/30 rounded-sm px-3 py-2 shadow-xl">
      <div className="font-sans text-body text-dn-gray-light mb-1">{label}</div>
      {payload.map(p => (
        <div key={p.name} className="font-sans text-caption" style={{ color: p.color }}>
          {p.name === 'projected' ? '(proj) ' : ''}
          <span className="font-display text-display-xs tabular">{p.value}</span>
          <span className="text-body ml-1">lbs</span>
        </div>
      ))}
    </div>
  )
}

export default function WeightTrendChart({ checkins }) {
  if (!checkins?.length) {
    return (
      <div className="dn-card p-6 flex items-center justify-center h-64">
        <div className="text-center">
          <div className="font-display text-display-xs tracking-display text-dn-gray-light">No Check-ins Yet</div>
          <div className="font-sans text-caption text-dn-gray-light mt-1">Log your first weigh-in to see the trend</div>
        </div>
      </div>
    )
  }

  const actual = checkins.map(c => ({
    date: c.checkin_date,
    label: formatDate(c.checkin_date),
    weight: c.weight_lbs,
  }))

  const projections = projectWeightTrend(checkins)

  // Merge actual + projected into one dataset for the chart
  const projMap = Object.fromEntries(projections.map(p => [p.label, p.projected]))
  const data = [
    ...actual.map(a => ({ label: a.label, weight: a.weight, projected: undefined })),
    ...projections.map(p => ({ label: p.label, weight: undefined, projected: p.projected })),
  ]

  // y-axis domain: min of (lowest weight - 5, 185), max of (211 + 2)
  const weights = checkins.map(c => c.weight_lbs)
  const yMin = Math.floor(Math.min(...weights, 190) - 3)
  const yMax = Math.ceil(Math.max(...weights, 211) + 2)

  return (
    <div className="dn-card p-4 sm:p-6">
      <div className="font-sans text-caption tracking-label uppercase text-dn-gray-light mb-4">
        Weight Trend
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 8, right: 76, bottom: 0, left: -12 }}>
          <CartesianGrid stroke={CHART.grid} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: CHART.axis, ...CHART_FONT }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[yMin, yMax]}
            tick={{ fill: CHART.axis, ...CHART_FONT }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => `${v}`}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Goal reference lines */}
          <ReferenceLine y={211} stroke={COLORS.lineStrong} strokeDasharray="4 4"
            label={{ value: 'Start 211', position: 'right', ...CHART_FONT, fill: COLORS.grayLight }} />
          <ReferenceLine y={200} stroke={COLORS.orange} strokeOpacity={0.4} strokeDasharray="4 4"
            label={{ value: 'Break 200', position: 'right', ...CHART_FONT, fill: COLORS.orange }} />
          <ReferenceLine y={190} stroke={COLORS.orange} strokeOpacity={0.6} strokeDasharray="4 4"
            label={{ value: 'Strike 190', position: 'right', ...CHART_FONT, fill: COLORS.orange }} />

          {/* Actual weight line */}
          <Line
            type="monotone"
            dataKey="weight"
            name="weight"
            stroke={CHART.actual}
            strokeWidth={2}
            dot={{ fill: COLORS.orange, r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: COLORS.orange }}
            connectNulls={false}
          />

          {/* Projected trend line */}
          {projections.length > 0 && (
            <Line
              type="monotone"
              dataKey="projected"
              name="projected"
              stroke={CHART.projected}
              strokeWidth={1.5}
              strokeDasharray="5 5"
              strokeOpacity={0.4}
              dot={false}
              connectNulls={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
