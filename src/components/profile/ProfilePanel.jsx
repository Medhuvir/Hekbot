import { useState } from 'react'
import CardTexture from '../CardTexture'
import OrderOfFireMedallion from '../OrderOfFireMedallion'
import { lbsToKg, todayInTZ, addDays } from '../../lib/helpers'
import { updateProfile } from '../../lib/mutations'

const TRAINING_TYPE_LABELS = {
  'Resistance Training': 'Resistance',
  'Martial Arts': 'Martial Arts',
  'Other': 'Training',
}

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

const TIMEZONE_OPTIONS = [
  { value: 'America/New_York',    label: 'Eastern (New York)' },
  { value: 'America/Chicago',     label: 'Central (Chicago)' },
  { value: 'America/Denver',      label: 'Mountain (Denver)' },
  { value: 'America/Los_Angeles', label: 'Pacific (Los Angeles)' },
  { value: 'America/Anchorage',   label: 'Alaska' },
  { value: 'Pacific/Honolulu',    label: 'Hawaii' },
  { value: 'UTC',                 label: 'UTC' },
]

// Monday–Sunday dates for the week containing `today` in the profile's
// timezone, as 'YYYY-MM-DD' strings (matches the log_date format used
// elsewhere in the app).
function currentWeekDates(timezone) {
  const todayStr = todayInTZ(timezone)
  const dow = new Date(todayStr + 'T00:00:00').getDay()
  const mondayOffset = dow === 0 ? -6 : 1 - dow
  const monday = addDays(todayStr, mondayOffset)

  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

export default function ProfilePanel({ profile, latestCheckin, workoutLogs = [], isAdmin = false, onProfileUpdated }) {
  const [savingTimezone, setSavingTimezone] = useState(false)

  if (!profile) return null

  const currentWeight = latestCheckin?.weight_lbs ?? profile.start_weight_lbs
  const currentKg     = lbsToKg(currentWeight)
  const weekDates     = currentWeekDates(profile.timezone)

  async function handleTimezoneChange(e) {
    const timezone = e.target.value
    setSavingTimezone(true)
    try {
      await updateProfile(profile.id, { timezone })
      onProfileUpdated?.()
    } catch (err) {
      console.error('[ProfilePanel] timezone update failed:', err)
    } finally {
      setSavingTimezone(false)
    }
  }

  return (
    <div className="dn-card relative overflow-hidden p-4 sm:p-5">
      <CardTexture />
      <div className="relative">
      <div className="font-sans text-[13px] uppercase tracking-[0.2em] text-dn-gray-light mb-4">Profile</div>

      <div className="flex items-start gap-4">
        {/* Avatar placeholder */}
        <div className="w-14 h-14 rounded-sm bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shrink-0">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover object-top rounded-sm" />
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
            <div className="flex items-center gap-1.5 font-sans text-[13px] tracking-[0.15em] uppercase text-dn-orange mt-0.5">
              <OrderOfFireMedallion size={14} />
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

          {isAdmin ? (
            <label className="mt-2.5 flex items-center gap-2 font-sans text-[13px] text-dn-gray-light">
              Timezone
              <select
                value={profile.timezone ?? 'America/New_York'}
                onChange={handleTimezoneChange}
                disabled={savingTimezone}
                className="bg-white/[0.04] border border-white/[0.08] rounded-sm px-2 py-1 text-[13px] text-dn-white focus:outline-none focus:border-dn-orange/40 transition-colors disabled:opacity-50"
              >
                {TIMEZONE_OPTIONS.map(tz => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </label>
          ) : (
            profile.timezone && (
              <div className="mt-2 font-sans text-[13px] text-dn-gray-light">
                Timezone <span className="text-dn-white">{TIMEZONE_OPTIONS.find(tz => tz.value === profile.timezone)?.label ?? profile.timezone}</span>
              </div>
            )
          )}
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
