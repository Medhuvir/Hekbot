import OrderOfFireMedallion from '../OrderOfFireMedallion'
import { lbsToKg, TIMEZONE_OPTIONS } from '../../lib/helpers'

export default function ProfilePanel({ profile, latestCheckin }) {
  if (!profile) return null

  const currentWeight = latestCheckin?.weight_lbs ?? profile.start_weight_lbs
  const currentKg     = lbsToKg(currentWeight)

  return (
    <div className="dn-card relative overflow-hidden p-4 sm:p-5">
      <div className="relative">
      <div className="font-sans text-[15px] uppercase tracking-[0.2em] text-dn-gray-light mb-4">Profile</div>

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
            <div className="flex items-center gap-1.5 font-sans text-[15px] tracking-[0.15em] uppercase text-dn-orange mt-0.5">
              <OrderOfFireMedallion size={14} />
              {profile.affiliation}
            </div>
          )}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {profile.age && (
              <span className="font-sans text-[16px] text-dn-gray-light">
                Age <span className="text-dn-white">{profile.age}</span>
              </span>
            )}
            {profile.height_cm && (
              <span className="font-sans text-[16px] text-dn-gray-light">
                Height <span className="text-dn-white">5'10"</span>
              </span>
            )}
            <span className="font-sans text-[16px] text-dn-gray-light">
              Weight <span className="font-display text-[16px] text-dn-white tabular">{currentWeight}</span>
              <span className="ml-0.5">lbs</span>
              <span className="text-dn-gray-light/60 ml-1">({currentKg} kg)</span>
            </span>
          </div>

          {profile.timezone && (
            <div className="mt-2 font-sans text-[15px] text-dn-gray-light">
              Timezone <span className="text-dn-white">{TIMEZONE_OPTIONS.find(tz => tz.value === profile.timezone)?.label ?? profile.timezone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Goals summary */}
      <div className="mt-4 pt-4 border-t border-white/[0.06] grid grid-cols-2 gap-3">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-sm px-3 py-2">
          <div className="font-sans text-[14px] uppercase tracking-[0.15em] text-dn-gray-light">Phase I · 8 wks</div>
          <div className="font-display text-[20px] text-dn-orange tabular mt-0.5">Under 200 lbs</div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-sm px-3 py-2">
          <div className="font-sans text-[14px] uppercase tracking-[0.15em] text-dn-gray-light">Phase II · 16 wks</div>
          <div className="font-display text-[20px] text-dn-white tabular mt-0.5">Strike 190 lbs</div>
        </div>
      </div>
      </div>
    </div>
  )
}
