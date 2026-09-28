import OrderOfFireMedallion from '../OrderOfFireMedallion'
import { lbsToKg, TIMEZONE_OPTIONS } from '../../lib/helpers'

export default function ProfilePanel({ profile, latestCheckin }) {
  if (!profile) return null

  const currentWeight = latestCheckin?.weight_lbs ?? profile.start_weight_lbs
  const currentKg     = lbsToKg(currentWeight)

  return (
    <div className="dn-card relative overflow-hidden p-4 sm:p-5">
      <div className="relative">
      <div className="font-sans text-caption uppercase tracking-label text-dn-gray-light mb-4">Profile</div>

      <div className="flex items-start gap-4">
        {/* Avatar placeholder */}
        <div className="w-14 h-14 rounded-sm bg-dn-fill-strong border border-dn-line flex items-center justify-center shrink-0">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover object-top rounded-sm" />
          ) : (
            <span className="font-display text-display-sm text-dn-gray-light tracking-display">
              {profile.name?.[0] ?? 'M'}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-display text-display-sm tracking-display text-dn-white leading-none">
            {profile.name}
          </div>
          {profile.affiliation && (
            <div className="flex items-center gap-1.5 font-sans text-caption tracking-label uppercase text-dn-orange mt-0.5">
              <OrderOfFireMedallion size={14} />
              {profile.affiliation}
            </div>
          )}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {profile.age && (
              <span className="font-sans text-body text-dn-gray-light">
                Age <span className="text-dn-white">{profile.age}</span>
              </span>
            )}
            {profile.height_cm && (
              <span className="font-sans text-body text-dn-gray-light">
                Height <span className="text-dn-white">5'10"</span>
              </span>
            )}
            <span className="font-sans text-body text-dn-gray-light">
              Weight <span className="font-display text-display-xs text-dn-white tabular">{currentWeight}</span>
              <span className="ml-0.5">lbs</span>
              <span className="text-dn-gray-light ml-1">({currentKg} kg)</span>
            </span>
          </div>

          {profile.timezone && (
            <div className="mt-2 font-sans text-body text-dn-gray-light">
              Timezone <span className="text-dn-white">{TIMEZONE_OPTIONS.find(tz => tz.value === profile.timezone)?.label ?? profile.timezone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Goals summary */}
      <div className="mt-4 pt-4 border-t border-dn-line grid grid-cols-2 gap-3">
        <div className="bg-dn-fill border border-dn-line rounded-sm px-3 py-2">
          <div className="font-sans text-caption uppercase tracking-label text-dn-gray-light">Phase I · 8 wks</div>
          <div className="font-display text-display-sm text-dn-orange tabular mt-0.5">Under 200 lbs</div>
        </div>
        <div className="bg-dn-fill border border-dn-line rounded-sm px-3 py-2">
          <div className="font-sans text-caption uppercase tracking-label text-dn-gray-light">Phase II · 16 wks</div>
          <div className="font-display text-display-sm text-dn-white tabular mt-0.5">Strike 190 lbs</div>
        </div>
      </div>
      </div>
    </div>
  )
}
