import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend
} from 'recharts'
import { formatDate, projectWeightTrend } from '../../lib/helpers'

const COLORS = {
  actual:    '#FF5E1A',
  projected: '#FF5E1A',
  grid:      'rgba(245,243,238,0.04)',
  axis:      '#6B6B6B',
  tooltip:   '#1E1E1E',
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-dn-surface border border-dn-orange/30 rounded-sm px-3 py-2 shadow-xl">
      <div className="font-sans text-[10px] text-dn-graphite mb-1">{label}</div>
      {payload.map(p => (
        <div key={p.name} className="font-sans text-[12px]" style={{ color: p.color }}>
          {p.name === 'projected' ? '(proj) ' : ''}
          <span className="font-display text-[16px] tabular">{p.value}</span>
          <span className="text-[10px] ml-1">lbs</span>
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
          <div className="font-display text-[22px] tracking-[0.1em] text-dn-graphite">No Check-ins Yet</div>
          <div className="font-sans text-[12px] text-dn-graphite/60 mt-1">Log your first weigh-in to see the trend</div>
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
    <div className="dn-card p-6">
      <div className="font-sans text-[10px] tracking-[0.2em] uppercase text-dn-graphite mb-4">
        Weight Trend
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid stroke={COLORS.grid} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: COLORS.axis, fontSize: 10, fontFamily: 'DM Sans' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[yMin, yMax]}
            tick={{ fill: COLORS.axis, fontSize: 10, fontFamily: 'DM Sans' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => `${v}`}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Goal reference lines */}
          <ReferenceLine y={211} stroke="rgba(245,243,238,0.15)" strokeDasharray="4 4"
            label={{ value: 'Start 211', position: 'right', fontSize: 9, fill: '#6B6B6B', fontFamily: 'DM Sans' }} />
          <ReferenceLine y={200} stroke="#FF5E1A" strokeOpacity={0.4} strokeDasharray="4 4"
            label={{ value: 'Break 200', position: 'right', fontSize: 9, fill: '#FF5E1A', fontFamily: 'DM Sans' }} />
          <ReferenceLine y={190} stroke="#FF5E1A" strokeOpacity={0.6} strokeDasharray="4 4"
            label={{ value: 'Strike 190', position: 'right', fontSize: 9, fill: '#FF5E1A', fontFamily: 'DM Sans' }} />

          {/* Actual weight line */}
          <Line
            type="monotone"
            dataKey="weight"
            name="weight"
            stroke={COLORS.actual}
            strokeWidth={2}
            dot={{ fill: '#FF5E1A', r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: '#FF5E1A' }}
            connectNulls={false}
          />

          {/* Projected trend line */}
          {projections.length > 0 && (
            <Line
              type="monotone"
              dataKey="projected"
              name="projected"
              stroke={COLORS.projected}
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
