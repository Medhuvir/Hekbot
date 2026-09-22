import DotGridWave from '../DotGridWave'
import Icon from '../Icon'
import OrderOfFireMedallion from '../OrderOfFireMedallion'

const STATS = [
  { icon: 'flag',           label: 'Goal',           value: '<200 lbs' },
  { icon: 'fitness_center', label: 'Training Block',  value: 'Hypertrophy + Martial Arts' },
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

// Small, branded header for the public dashboard — reuses the same animated
// dot-grid hero band as the signed-in HekBot panel, but scaled down to a
// compact identity row plus a full-width stat strip instead of a full chat
// surface.
export default function PublicProfileHero({ profile }) {
  if (!profile) return null

  return (
    <section className="relative overflow-hidden border-b border-white/[0.08]">
      <DotGridWave overallOpacity={0.12} />

      <div className="relative max-w-screen-xl mx-auto px-4 sm:px-6 py-5 sm:py-7">
        <div className="flex items-center gap-3.5 sm:gap-4">
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
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-white/[0.08]">
          {STATS.map(stat => <StatItem key={stat.label} {...stat} />)}
        </div>
      </div>
    </section>
  )
}
