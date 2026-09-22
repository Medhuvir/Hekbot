import CardTexture from '../CardTexture'
import { lbsToKg, toLocalISODate } from '../../lib/helpers'

const TRAINING_TYPE_LABELS = {
  'Resistance Training': 'Resistance',
  'Martial Arts': 'Martial Arts',
  'Other': 'Training',
}

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

// Monday–Sunday dates for the week containing `today`, as 'YYYY-MM-DD' strings
// (matches the log_date format used elsewhere in the app).
function currentWeekDates() {
  const now = new Date()
  const mondayOffset = now.getDay() === 0 ? -6 : 1 - now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() + mondayOffset)

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return toLocalISODate(d)
  })
}

export default function ProfilePanel({ profile, latestCheckin, workoutLogs = [] }) {
  if (!profile) return null

  const currentWeight = latestCheckin?.weight_lbs ?? profile.start_weight_lbs
  const currentKg     = lbsToKg(currentWeight)
  const weekDates     = currentWeekDates()

  return (
    <div className="dn-card relative overflow-hidden p-4 sm:p-5">
      <CardTexture />
      <div className="relative">
      <div className="font-sans text-[13px] uppercase tracking-[0.2em] text-dn-gray-light mb-4">Profile</div>

      <div className="flex items-start gap-4">
        {/* Avatar placeholder */}
        <div className="w-14 h-14 rounded-sm bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shrink-0">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover rounded-sm" />
          ) : (
            <span className="font-display text-[22px] text-dn-gray-light tracking-wider">
              {profile.name?.[0] ?? 'M'}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-display text-[22px] tracking-[0.08em] text-dn-white leading-none">
            {profile.name}
          </div>
          {profile.affiliation && (
            <div className="font-sans text-[13px] tracking-[0.15em] uppercase text-dn-orange mt-0.5">
              {profile.affiliation}
            </div>
          )}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {profile.age && (
              <span className="font-sans text-[14px] text-dn-gray-light">
                Age <span className="text-dn-white">{profile.age}</span>
              </span>
            )}
            {profile.height_cm && (
              <span className="font-sans text-[14px] text-dn-gray-light">
                Height <span className="text-dn-white">5'10"</span>
              </span>
            )}
            <span className="font-sans text-[14px] text-dn-gray-light">
              Weight <span className="font-display text-[16px] text-dn-white tabular">{currentWeight}</span>
              <span className="ml-0.5">lbs</span>
              <span className="text-dn-gray-light/60 ml-1">({currentKg} kg)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Goals summary */}
      <div className="mt-4 pt-4 border-t border-white/[0.06] grid grid-cols-2 gap-3">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-sm px-3 py-2">
          <div className="font-sans text-[12px] uppercase tracking-[0.15em] text-dn-gray-light">Phase I · 8 wks</div>
          <div className="font-display text-[20px] text-dn-orange tabular mt-0.5">Under 200 lbs</div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-sm px-3 py-2">
          <div className="font-sans text-[12px] uppercase tracking-[0.15em] text-dn-gray-light">Phase II · 16 wks</div>
          <div className="font-display text-[20px] text-dn-white tabular mt-0.5">Strike 190 lbs</div>
        </div>
      </div>

      {/* Training schedule */}
      <div className="mt-4 pt-4 border-t border-white/[0.06]">
        <div className="font-sans text-[13px] uppercase tracking-[0.12em] text-dn-gray-light mb-2">Weekly Training</div>
        <div className="grid grid-cols-7 gap-1">
          {weekDates.map((date, i) => {
            const dayLogs  = workoutLogs.filter(w => w.log_date === date)
            const types    = [...new Set(dayLogs.map(w => TRAINING_TYPE_LABELS[w.workout_type] ?? w.workout_type))]
            const minutes  = dayLogs.reduce((s, w) => s + (w.duration_min || 0), 0)
            const isRest   = dayLogs.length === 0
            const isResistance = dayLogs.some(w => w.workout_type === 'Resistance Training')

            const colorClass = isRest
              ? 'bg-transparent text-dn-gray-light'
              : isResistance
              ? 'bg-dn-orange/20 text-dn-orange'
              : 'bg-white/[0.06] text-dn-white/70'

            return (
              <div key={date} className={`text-center py-1.5 rounded-sm ${colorClass}`}>
                <div className="font-sans text-[12px] uppercase tracking-wide">{DAY_LETTERS[i]}</div>
                <div className="font-sans text-[11px] mt-0.5 leading-tight hidden sm:block">
                  {isRest ? 'Rest' : types.join(' + ')}
                </div>
                {!isRest && minutes > 0 && (
                  <div className="font-sans text-[10px] mt-0.5 leading-tight opacity-70 hidden sm:block">
                    {minutes} min
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      </div>
    </div>
  )
}
