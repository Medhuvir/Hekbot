import { lbsToKg } from '../../lib/helpers'

export default function ProfilePanel({ profile, latestCheckin }) {
  if (!profile) return null

  const currentWeight = latestCheckin?.weight_lbs ?? profile.start_weight_lbs
  const currentKg     = lbsToKg(currentWeight)

  return (
    <div className="dn-card p-5">
      <div className="font-sans text-[10px] uppercase tracking-[0.2em] text-dn-graphite mb-4">Profile</div>

      <div className="flex items-start gap-4">
        {/* Avatar placeholder */}
        <div className="w-14 h-14 rounded-sm bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shrink-0">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover rounded-sm" />
          ) : (
            <span className="font-display text-[22px] text-dn-graphite tracking-wider">
              {profile.name?.[0] ?? 'M'}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-display text-[22px] tracking-[0.08em] text-dn-white leading-none">
            {profile.name}
          </div>
          {profile.affiliation && (
            <div className="font-sans text-[10px] tracking-[0.15em] uppercase text-dn-orange mt-0.5">
              {profile.affiliation}
            </div>
          )}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {profile.age && (
              <span className="font-sans text-[11px] text-dn-graphite">
                Age <span className="text-dn-white">{profile.age}</span>
              </span>
            )}
            {profile.height_cm && (
              <span className="font-sans text-[11px] text-dn-graphite">
                Height <span className="text-dn-white">5'10"</span>
              </span>
            )}
            <span className="font-sans text-[11px] text-dn-graphite">
              Weight <span className="font-display text-[16px] text-dn-white tabular">{currentWeight}</span>
              <span className="ml-0.5">lbs</span>
              <span className="text-dn-graphite/60 ml-1">({currentKg} kg)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Goals summary */}
      <div className="mt-4 pt-4 border-t border-white/[0.06] grid grid-cols-2 gap-3">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-sm px-3 py-2">
          <div className="font-sans text-[9px] uppercase tracking-[0.15em] text-dn-graphite">Phase I · 8 wks</div>
          <div className="font-display text-[20px] text-dn-orange tabular mt-0.5">Under 200 lbs</div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-sm px-3 py-2">
          <div className="font-sans text-[9px] uppercase tracking-[0.15em] text-dn-graphite">Phase II · 16 wks</div>
          <div className="font-display text-[20px] text-dn-white tabular mt-0.5">Strike 190 lbs</div>
        </div>
      </div>

      {/* Training schedule */}
      <div className="mt-4 pt-4 border-t border-white/[0.06]">
        <div className="font-sans text-[10px] uppercase tracking-[0.12em] text-dn-graphite mb-2">Weekly Training</div>
        <div className="grid grid-cols-7 gap-1">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
            const types = ['Resistance', 'Martial Arts', 'Resistance', 'Martial Arts', 'Resistance', 'Martial Arts', 'Rest']
            const colors = {
              'Resistance': 'bg-dn-orange/20 text-dn-orange',
              'Martial Arts': 'bg-white/[0.06] text-dn-white/70',
              'Rest': 'bg-transparent text-dn-graphite',
            }
            return (
              <div key={i} className={`text-center py-1.5 rounded-sm ${colors[types[i]]}`}>
                <div className="font-sans text-[9px] uppercase tracking-wide">{day}</div>
                <div className="font-sans text-[8px] mt-0.5 leading-tight hidden sm:block">
                  {types[i] === 'Rest' ? 'Rest' : types[i] === 'Resistance' ? 'RT' : 'MA'}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
