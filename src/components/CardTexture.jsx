// Standard dashboard card background: a DN topo still + a dark gradient that
// fades from opaque at the top to transparent by 70% of the card height, so
// header content stays readable while the lower portion of the card (charts,
// data) sits against the topo.
//
// The stills in /images/topo come from the DN Creative topo generator
// (topo_still.py, 1400×1000 @1.5x, --transparent --no-crosses --no-scanlines),
// flattened onto the card surface (#1E1E1E) as WebP. Each card gets its own
// map; regenerate one with `topo_still.py --seed <seed>`:
//   card-1 850076611 · card-2 292787980 · card-3 3247352315
//   card-4 1386747089 · card-5 1595001321
export default function CardTexture({ variant = 1 }) {
  return (
    <>
      <img
        src={`/images/topo/card-${variant}.webp`}
        alt=""
        aria-hidden="true"
        decoding="async"
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(10,10,10,0.65) 0%, rgba(10,10,10,0.28) 40%, rgba(10,10,10,0) 70%)' }}
      />
    </>
  )
}
