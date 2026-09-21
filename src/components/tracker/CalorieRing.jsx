import { MACRO_COLORS } from '../../lib/macroColors'

export default function CalorieRing({ value, target, size = 100 }) {
  const radius = 42
  const strokeWidth = 5
  const circumference = 2 * Math.PI * radius
  const pct = target ? Math.min(1, value / target) : 0

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(245,243,238,0.06)" strokeWidth={strokeWidth} />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={MACRO_COLORS.calories}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-display leading-none tabular text-dn-white"
          style={{ fontSize: Math.round(size * 0.28) }}
        >
          {Math.round(value)}
        </span>
        <span className="font-sans text-[9px] uppercase tracking-[0.15em] text-dn-graphite mt-0.5">
          kcal
        </span>
      </div>
    </div>
  )
}
