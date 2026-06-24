import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell
} from 'recharts'

const GRID = 'rgba(245,243,238,0.04)'
const AXIS = '#6B6B6B'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-dn-surface border border-white/[0.15] rounded-sm px-3 py-2 shadow-xl">
      <div className="font-sans text-[10px] text-dn-graphite mb-2">{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} className="font-sans text-[11px] text-dn-white flex justify-between gap-4">
          <span className="text-dn-graphite capitalize">{p.dataKey.replace('_g', '')}</span>
          <span className="font-display text-[14px] tabular" style={{ color: p.fill }}>
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
        <div className="font-display text-[18px] tracking-[0.1em] text-dn-graphite">No data yet</div>
      </div>
    )
  }

  const proteinTarget = targets?.protein_g ?? 180
  const carbsMax      = targets?.carbs_max_g ?? 230
  const fatMax        = targets?.fat_max_g ?? 70

  return (
    <div className="dn-card p-6">
      <div className="font-sans text-[10px] tracking-[0.2em] uppercase text-dn-graphite mb-4">
        Macro Adherence — Last 7 Days
      </div>

      {/* Protein */}
      <div className="mb-5">
        <div className="font-sans text-[10px] text-dn-graphite uppercase tracking-wider mb-2">
          Protein (target {proteinTarget}g)
        </div>
        <ResponsiveContainer width="100%" height={80}>
          <BarChart data={dailyTotals} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: AXIS, fontSize: 9, fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
            <YAxis tick={false} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={proteinTarget} stroke="#FF5E1A" strokeOpacity={0.5} strokeDasharray="3 3" />
            <Bar dataKey="protein_g" radius={[1, 1, 0, 0]} maxBarSize={28}>
              {dailyTotals.map((entry, i) => (
                <Cell key={i} fill={entry.protein_g >= proteinTarget ? '#22C55E' : entry.protein_g >= 150 ? '#F59E0B' : '#EF4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Carbs + Fat side by side */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="font-sans text-[10px] text-dn-graphite uppercase tracking-wider mb-2">
            Carbs (max {carbsMax}g)
          </div>
          <ResponsiveContainer width="100%" height={60}>
            <BarChart data={dailyTotals} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: AXIS, fontSize: 8, fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
              <YAxis tick={false} axisLine={false} tickLine={false} />
              <ReferenceLine y={carbsMax} stroke="#FF5E1A" strokeOpacity={0.4} strokeDasharray="3 3" />
              <Bar dataKey="carbs_g" fill="rgba(245,243,238,0.3)" radius={[1, 1, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <div className="font-sans text-[10px] text-dn-graphite uppercase tracking-wider mb-2">
            Fat (max {fatMax}g)
          </div>
          <ResponsiveContainer width="100%" height={60}>
            <BarChart data={dailyTotals} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: AXIS, fontSize: 8, fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
              <YAxis tick={false} axisLine={false} tickLine={false} />
              <ReferenceLine y={fatMax} stroke="#FF5E1A" strokeOpacity={0.4} strokeDasharray="3 3" />
              <Bar dataKey="fat_g" fill="rgba(245,243,238,0.2)" radius={[1, 1, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
