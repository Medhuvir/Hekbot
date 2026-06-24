import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, ReferenceArea
} from 'recharts'

const GRID  = 'rgba(245,243,238,0.04)'
const AXIS  = '#6B6B6B'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const intake = payload.find(p => p.dataKey === 'calories')
  const burned = payload.find(p => p.dataKey === 'burned')
  const net    = payload.find(p => p.dataKey === 'net')
  return (
    <div className="bg-dn-surface border border-white/[0.15] rounded-sm px-3 py-2 shadow-xl min-w-[120px]">
      <div className="font-sans text-[10px] text-dn-graphite mb-2">{label}</div>
      {intake && (
        <div className="font-sans text-[11px] flex justify-between gap-4">
          <span className="text-dn-graphite">Intake</span>
          <span className="font-display text-[14px] tabular text-dn-orange">{intake.value} kcal</span>
        </div>
      )}
      {burned && burned.value > 0 && (
        <div className="font-sans text-[11px] flex justify-between gap-4">
          <span className="text-dn-graphite">Burned</span>
          <span className="font-display text-[14px] tabular text-green-400">{burned.value} kcal</span>
        </div>
      )}
      {net && (
        <div className="font-sans text-[11px] flex justify-between gap-4 border-t border-white/[0.08] mt-1 pt-1">
          <span className="text-dn-graphite">Net</span>
          <span className="font-display text-[14px] tabular text-dn-white">{net.value} kcal</span>
        </div>
      )}
    </div>
  )
}

export default function CalorieTrendChart({ dailyTotals, targets }) {
  if (!dailyTotals?.length) {
    return (
      <div className="dn-card p-6 flex items-center justify-center h-52">
        <div className="font-display text-[18px] tracking-[0.1em] text-dn-graphite">No data yet</div>
      </div>
    )
  }

  const calMin = targets?.calories_min ?? 2100
  const calMax = targets?.calories_max ?? 2400

  return (
    <div className="dn-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="font-sans text-[10px] tracking-[0.2em] uppercase text-dn-graphite">
          Calorie Trend
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-0.5 bg-dn-orange inline-block" />
            <span className="font-sans text-[9px] text-dn-graphite">Intake</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-0.5 bg-green-400 inline-block" />
            <span className="font-sans text-[9px] text-dn-graphite">Burned</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-0.5 bg-white/40 inline-block" />
            <span className="font-sans text-[9px] text-dn-graphite">Net</span>
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={dailyTotals} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: AXIS, fontSize: 10, fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: AXIS, fontSize: 10, fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />

          {/* Target range band */}
          <ReferenceArea y1={calMin} y2={calMax} fill="rgba(255,94,26,0.05)" />
          <ReferenceLine y={calMin} stroke="#FF5E1A" strokeOpacity={0.2} strokeDasharray="3 3"
            label={{ value: `${calMin}`, position: 'right', fontSize: 9, fill: '#FF5E1A', fontFamily: 'DM Sans' }} />
          <ReferenceLine y={calMax} stroke="#FF5E1A" strokeOpacity={0.2} strokeDasharray="3 3"
            label={{ value: `${calMax}`, position: 'right', fontSize: 9, fill: '#FF5E1A', fontFamily: 'DM Sans' }} />

          <Line type="monotone" dataKey="calories" stroke="#FF5E1A" strokeWidth={2}
            dot={{ fill: '#FF5E1A', r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
          <Line type="monotone" dataKey="burned" stroke="#22C55E" strokeWidth={1.5}
            dot={{ fill: '#22C55E', r: 2, strokeWidth: 0 }} strokeDasharray="4 2" />
          <Line type="monotone" dataKey="net" stroke="rgba(245,243,238,0.35)" strokeWidth={1.5}
            dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
