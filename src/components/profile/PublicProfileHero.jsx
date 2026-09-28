import Icon from '../Icon'
import OrderOfFireMedallion from '../OrderOfFireMedallion'
import { lbsToKg } from '../../lib/helpers'

const TIMEZONE_LABELS = {
  'America/New_York':    'Eastern (New York)',
  'America/Chicago':     'Central (Chicago)',
  'America/Denver':      'Mountain (Denver)',
  'America/Los_Angeles': 'Pacific (Los Angeles)',
  'America/Anchorage':   'Alaska',
  'Pacific/Honolulu':    'Hawaii',
  'UTC':                 'UTC',
}

const STATS = [
  { icon: 'fitness_center', label: 'Training Block', value: 'Hypertrophy + Martial Arts' },
  { icon: 'bolt',           label: 'Priorities',      value: 'Fat Loss + Strength' },
]

function StatItem({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5 min-w-0">
      <Icon name={icon} size={18} className="text-dn-orange shrink-0 mt-0.5" />
      <div className="min-w-0">
        <div className="font-sans text-label tracking-label uppercase text-dn-gray-light">{label}</div>
        <div className="font-sans text-body text-dn-white mt-0.5 truncate">{value}</div>
      </div>
    </div>
  )
}

// Unified profile card for the public dashboard — identity, vitals, and
// goals live in one place instead of being split across a top hero band and
// a separate "Profile" section further down the page.
export default function PublicProfileHero({ profile, latestCheckin }) {
  if (!profile) return null

  const currentWeight = latestCheckin?.weight_lbs ?? profile.start_weight_lbs
  const currentKg     = lbsToKg(currentWeight)

  return (
    <section className="relative overflow-hidden border-b border-dn-line">
      <div className="relative max-w-screen-xl mx-auto px-4 sm:px-6 py-5 sm:py-7">
        <div className="flex flex-col lg:flex-row lg:items-center gap-5 sm:gap-6">
          <div className="flex items-center gap-3.5 sm:gap-4 shrink-0">
            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-sm bg-dn-fill-strong border border-dn-line flex items-center justify-center shrink-0">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover object-top rounded-sm" />
              ) : (
                <span className="font-display text-display-xs sm:text-display-sm text-dn-gray-light tracking-display">
                  {profile.name?.[0] ?? 'M'}
                </span>
              )}
            </div>

            <div className="min-w-0">
              <div className="font-display text-display-sm tracking-display text-dn-white leading-none truncate">
                {profile.name}
              </div>
              {profile.affiliation && (
                <div className="inline-flex items-center gap-1.5 font-sans text-label sm:text-caption tracking-label uppercase text-dn-orange mt-1.5">
                  <OrderOfFireMedallion size={12} />
                  {profile.affiliation}
                </div>
              )}
              <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
                {profile.age && (
                  <span className="font-sans text-caption text-dn-gray-light">
                    Age <span className="text-dn-white">{profile.age}</span>
                  </span>
                )}
                {profile.height_cm && (
                  <span className="font-sans text-caption text-dn-gray-light">
                    Height <span className="text-dn-white">5'10"</span>
                  </span>
                )}
                <span className="font-sans text-caption text-dn-gray-light">
                  Weight <span className="text-dn-white">{currentWeight} lbs</span> ({currentKg} kg)
                </span>
                {profile.timezone && (
                  <span className="font-sans text-caption text-dn-gray-light">
                    Timezone <span className="text-dn-white">{TIMEZONE_LABELS[profile.timezone] ?? profile.timezone}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="hidden lg:block w-px h-10 bg-dn-fill-strong shrink-0" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 flex-1 w-full lg:w-auto pt-5 lg:pt-0 border-t lg:border-t-0 border-dn-line">
            {STATS.map(stat => <StatItem key={stat.label} {...stat} />)}
          </div>
        </div>

        {/* Goal phases */}
        <div className="mt-5 pt-5 border-t border-dn-line grid grid-cols-2 gap-3 max-w-md">
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
    </section>
  )
}
