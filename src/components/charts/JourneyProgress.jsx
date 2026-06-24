import { getPhaseProgress } from '../../lib/helpers'

export default function JourneyProgress({ currentWeight }) {
  const progress = getPhaseProgress(currentWeight)

  const statusColor =
    progress.pct >= 80 ? '#22C55E' :
    progress.pct >= 40 ? '#FF5E1A' :
    '#F5F3EE'

  return (
    <div className="dn-card p-6 animate-fade-in-up">
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
      <div className="mt-4 flex items-center gap-3">
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
    </div>
  )
}
