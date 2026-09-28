import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { getPhaseProgress, formatDate } from '../../lib/helpers'
import { COLORS } from '../../lib/tokens'

function MiniTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-dn-surface border border-dn-orange/30 rounded-sm px-2.5 py-1.5 shadow-xl">
      <div className="font-sans text-caption text-dn-gray-light">{label}</div>
      <div className="font-display text-display-xs text-dn-white tabular leading-none">
        {payload[0].value}
        <span className="font-sans text-caption text-dn-gray-light ml-1">lbs</span>
      </div>
    </div>
  )
}

function WeightMiniChart({ checkins }) {
  if (!checkins || checkins.length < 2) {
    return (
      <div className="mt-5 pt-4 border-t border-dn-line">
        <div className="font-sans text-caption uppercase tracking-label text-dn-gray-light mb-2">
          Weight Trend
        </div>
        <div className="h-20 flex items-center justify-center border border-dashed border-dn-line rounded-sm">
          <span className="font-sans text-body text-dn-gray-light">
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
    <div className="mt-5 pt-4 border-t border-dn-line">
      <div className="flex items-center justify-between mb-2">
        <span className="font-sans text-caption uppercase tracking-label text-dn-gray-light">
          Weight Trend
        </span>
        <span className={`font-sans text-body tabular ${delta <= 0 ? 'text-dn-success' : 'text-dn-warning'}`}>
          {delta > 0 ? '+' : ''}{delta.toFixed(1)} lbs since {data[0].label}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={80}>
        <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="journeyWeightFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.orange} stopOpacity={0.25} />
              <stop offset="100%" stopColor={COLORS.orange} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" hide />
          <YAxis domain={['dataMin - 1', 'dataMax + 1']} hide />
          <Tooltip content={<MiniTooltip />} />
          <Area
            type="monotone"
            dataKey="weight"
            stroke={COLORS.orange}
            strokeWidth={2}
            fill="url(#journeyWeightFill)"
            dot={{ r: 3, fill: COLORS.orange, strokeWidth: 0 }}
            activeDot={{ r: 4, fill: COLORS.orange }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function JourneyProgress({ currentWeight, checkins }) {
  const progress = getPhaseProgress(currentWeight)

  const statusColor =
    progress.pct >= 80 ? COLORS.success :
    progress.pct >= 40 ? COLORS.orange :
    COLORS.white

  return (
    <div className="dn-card relative overflow-hidden p-4 sm:p-6 animate-fade-in-up">

      <div className="relative">
        {/* Header row */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="font-sans text-caption font-normal tracking-label uppercase text-dn-gray-light mb-1">
              Ascension Progress
            </div>
            <div className="font-display text-display-xs tracking-display text-dn-white">
              {progress.label}
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-display-lg leading-none tabular" style={{ color: statusColor }}>
              {progress.pct}
              <span className="text-body">%</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative">
          <div className="h-1.5 bg-dn-fill-strong rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-dn"
              style={{ width: `${progress.pct}%`, backgroundColor: statusColor }}
            />
          </div>
          {/* Milestone markers */}
          <div className="flex justify-between mt-2">
            <span className="font-sans text-caption text-dn-gray-light tabular">211 lbs</span>
            <span className="font-sans text-caption text-dn-orange tabular">{progress.goalLabel}</span>
          </div>
        </div>

        {/* Current weight pill */}
        <div className="mt-4 flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-dn-fill border border-dn-line rounded-sm">
            <span className="font-sans text-body text-dn-gray-light ">Current</span>
            <span className="font-display text-display-xs tracking-display text-dn-white tabular">
              {currentWeight ? `${currentWeight} lbs` : '— lbs'}
            </span>
          </div>
          {progress.phase === 1 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-dn-fill border border-dn-line rounded-sm">
              <span className="font-sans text-body text-dn-gray-light ">Target</span>
              <span className="font-display text-display-xs tracking-display text-dn-orange tabular">200 lbs</span>
            </div>
          )}
          {progress.phase === 2 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-dn-fill border border-dn-line rounded-sm">
              <span className="font-sans text-body text-dn-gray-light ">Target</span>
              <span className="font-display text-display-xs tracking-display text-dn-orange tabular">190 lbs</span>
            </div>
          )}
          {currentWeight && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-dn-fill border border-dn-line rounded-sm">
              <span className="font-sans text-body text-dn-gray-light ">To go</span>
              <span className="font-display text-display-xs tracking-display text-dn-white tabular">
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
