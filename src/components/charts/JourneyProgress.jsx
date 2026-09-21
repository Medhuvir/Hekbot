import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import TopoBackground from '../TopoBackground'
import { getPhaseProgress, formatDate } from '../../lib/helpers'

function MiniTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-dn-surface border border-dn-orange/30 rounded-sm px-2.5 py-1.5 shadow-xl">
      <div className="font-sans text-[9px] text-dn-graphite">{label}</div>
      <div className="font-display text-[14px] text-dn-white tabular leading-none">
        {payload[0].value}
        <span className="font-sans text-[9px] text-dn-graphite ml-1">lbs</span>
      </div>
    </div>
  )
}

function WeightMiniChart({ checkins }) {
  if (!checkins || checkins.length < 2) {
    return (
      <div className="mt-5 pt-4 border-t border-white/[0.06]">
        <div className="font-sans text-[9px] uppercase tracking-[0.2em] text-dn-graphite mb-2">
          Weight Trend
        </div>
        <div className="h-20 flex items-center justify-center border border-dashed border-white/[0.08] rounded-sm">
          <span className="font-sans text-[11px] text-dn-graphite/60">
            Log another weigh-in to see your trend
          </span>
        </div>
      </div>
    )
  }

  const data = checkins.map(c => ({ label: formatDate(c.checkin_date), weight: c.weight_lbs }))
  const first = data[0].weight
  const last  = data[data.length - 1].weight
  const delta = last - first

  return (
    <div className="mt-5 pt-4 border-t border-white/[0.06]">
      <div className="flex items-center justify-between mb-2">
        <span className="font-sans text-[9px] uppercase tracking-[0.2em] text-dn-graphite">
          Weight Trend
        </span>
        <span className={`font-sans text-[10px] tabular ${delta <= 0 ? 'text-green-400' : 'text-amber-400'}`}>
          {delta > 0 ? '+' : ''}{delta.toFixed(1)} lbs since {data[0].label}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={80}>
        <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="journeyWeightFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF5E1A" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#FF5E1A" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" hide />
          <YAxis domain={['dataMin - 1', 'dataMax + 1']} hide />
          <Tooltip content={<MiniTooltip />} />
          <Area
            type="monotone"
            dataKey="weight"
            stroke="#FF5E1A"
            strokeWidth={2}
            fill="url(#journeyWeightFill)"
            dot={false}
            activeDot={{ r: 4, fill: '#FF5E1A' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function JourneyProgress({ currentWeight, checkins }) {
  const progress = getPhaseProgress(currentWeight)

  const statusColor =
    progress.pct >= 80 ? '#22C55E' :
    progress.pct >= 40 ? '#FF5E1A' :
    '#F5F3EE'

  return (
    <div className="dn-card relative overflow-hidden p-4 sm:p-6 animate-fade-in-up">
      <TopoBackground opacity={0.1} />

      <div className="relative">
        {/* Header row */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="font-sans text-[10px] font-normal tracking-[0.2em] uppercase text-dn-graphite mb-1">
              Ascension Progress
            </div>
            <div className="font-display text-[18px] tracking-[0.1em] text-dn-white">
              {progress.label}
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-[48px] leading-none tabular" style={{ color: statusColor }}>
              {progress.pct}
              <span className="text-[24px]">%</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative">
          <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-dn"
              style={{ width: `${progress.pct}%`, backgroundColor: statusColor }}
            />
          </div>
          {/* Milestone markers */}
          <div className="flex justify-between mt-2">
            <span className="font-sans text-[9px] text-dn-graphite tabular">211 lbs</span>
            <span className="font-sans text-[9px] text-dn-orange tabular">{progress.goalLabel}</span>
          </div>
        </div>

        {/* Current weight pill */}
        <div className="mt-4 flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-sm">
            <span className="font-sans text-[10px] text-dn-graphite tracking-wide">Current</span>
            <span className="font-display text-[16px] tracking-[0.08em] text-dn-white tabular">
              {currentWeight ? `${currentWeight} lbs` : '— lbs'}
            </span>
          </div>
          {progress.phase === 1 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-sm">
              <span className="font-sans text-[10px] text-dn-graphite tracking-wide">Target</span>
              <span className="font-display text-[16px] tracking-[0.08em] text-dn-orange tabular">200 lbs</span>
            </div>
          )}
          {progress.phase === 2 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-sm">
              <span className="font-sans text-[10px] text-dn-graphite tracking-wide">Target</span>
              <span className="font-display text-[16px] tracking-[0.08em] text-dn-orange tabular">190 lbs</span>
            </div>
          )}
          {currentWeight && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-sm">
              <span className="font-sans text-[10px] text-dn-graphite tracking-wide">To go</span>
              <span className="font-display text-[16px] tracking-[0.08em] text-dn-white tabular">
                {Math.max(0, currentWeight - (progress.phase === 1 ? 200 : 190)).toFixed(1)} lbs
              </span>
            </div>
          )}
        </div>

        <WeightMiniChart checkins={checkins} />
      </div>
    </div>
  )
}
