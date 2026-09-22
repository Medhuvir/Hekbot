import DotGridWave from '../DotGridWave'
import OrderOfFireMedallion from '../OrderOfFireMedallion'
import { getPhaseProgress } from '../../lib/helpers'

// Small, branded header for the public dashboard — reuses the same animated
// dot-grid hero band as the signed-in HekBot panel, but scaled down to a
// single compact row of basic profile info instead of a full chat surface.
export default function PublicProfileHero({ profile, currentWeight }) {
  if (!profile) return null

  const phase = getPhaseProgress(currentWeight)

  return (
    <section className="relative overflow-hidden border-b border-white/[0.08]">
      <DotGridWave overallOpacity={0.12} />

      <div className="relative max-w-screen-xl mx-auto px-4 sm:px-6 py-5 sm:py-7 flex items-center gap-3.5 sm:gap-4">
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
          <div className="flex items-center gap-x-2.5 gap-y-1 mt-1.5 flex-wrap">
            {profile.affiliation && (
              <span className="inline-flex items-center gap-1.5 font-sans text-[11px] sm:text-[12px] tracking-[0.2em] uppercase text-dn-orange">
                <OrderOfFireMedallion size={12} />
                {profile.affiliation}
              </span>
            )}
            <span className="font-sans text-[11px] sm:text-[12px] tracking-[0.2em] uppercase text-dn-gray-light">
              {phase.label}
            </span>
            <span className="hidden sm:inline font-sans text-[11px] sm:text-[12px] tracking-[0.2em] uppercase text-dn-gray-light/50">
              · Public Dashboard
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
