import DotGridWave from '../DotGridWave'
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
        <div className="font-sans text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-dn-gray-light">{label}</div>
        <div className="font-sans text-[13px] sm:text-[14px] text-dn-white mt-0.5 truncate">{value}</div>
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
    <section className="relative overflow-hidden border-b border-white/[0.08]">
      <DotGridWave overallOpacity={0.12} />

      <div className="relative max-w-screen-xl mx-auto px-4 sm:px-6 py-5 sm:py-7">
        <div className="flex flex-col lg:flex-row lg:items-center gap-5 sm:gap-6">
          <div className="flex items-center gap-3.5 sm:gap-4 shrink-0">
            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-sm bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shrink-0">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover object-top rounded-sm" />
              ) : (
                <span className="font-display text-[18px] sm:text-[22px] text-dn-gray-light tracking-wider">
                  {profile.name?.[0] ?? 'M'}
                </span>
              )}
            </div>

            <div className="min-w-0">
              <div className="font-display text-[20px] sm:text-[26px] tracking-[0.08em] text-dn-white leading-none truncate">
                {profile.name}
              </div>
              {profile.affiliation && (
                <div className="inline-flex items-center gap-1.5 font-sans text-[11px] sm:text-[12px] tracking-[0.2em] uppercase text-dn-orange mt-1.5">
                  <OrderOfFireMedallion size={12} />
                  {profile.affiliation}
                </div>
              )}
              <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
                {profile.age && (
                  <span className="font-sans text-[12px] text-dn-gray-light">
                    Age <span className="text-dn-white">{profile.age}</span>
                  </span>
                )}
                {profile.height_cm && (
                  <span className="font-sans text-[12px] text-dn-gray-light">
                    Height <span className="text-dn-white">5'10"</span>
                  </span>
                )}
                <span className="font-sans text-[12px] text-dn-gray-light">
                  Weight <span className="text-dn-white">{currentWeight} lbs</span> ({currentKg} kg)
                </span>
                {profile.timezone && (
                  <span className="font-sans text-[12px] text-dn-gray-light">
                    Timezone <span className="text-dn-white">{TIMEZONE_LABELS[profile.timezone] ?? profile.timezone}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="hidden lg:block w-px h-10 bg-white/[0.08] shrink-0" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 flex-1 w-full lg:w-auto pt-5 lg:pt-0 border-t lg:border-t-0 border-white/[0.08]">
            {STATS.map(stat => <StatItem key={stat.label} {...stat} />)}
          </div>
        </div>

        {/* Goal phases */}
        <div className="mt-5 pt-5 border-t border-white/[0.08] grid grid-cols-2 gap-3 max-w-md">
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-sm px-3 py-2">
            <div className="font-sans text-[12px] uppercase tracking-[0.15em] text-dn-gray-light">Phase I · 8 wks</div>
            <div className="font-display text-[20px] text-dn-orange tabular mt-0.5">Under 200 lbs</div>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-sm px-3 py-2">
            <div className="font-sans text-[12px] uppercase tracking-[0.15em] text-dn-gray-light">Phase II · 16 wks</div>
            <div className="font-display text-[20px] text-dn-white tabular mt-0.5">Strike 190 lbs</div>
          </div>
        </div>
      </div>
    </section>
  )
}
