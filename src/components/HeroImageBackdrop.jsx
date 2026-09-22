// Page-top backdrop: the topo banner photo at low opacity, fading to solid
// black by the bottom of the band. Spans a full viewport height so it bleeds
// past the Header's own box into whatever sits beneath it (the hero on the
// public dashboard, or the first admin cards) — Header/HekbotPanel render
// their own content on top of this with transparent backgrounds so it shows
// through underneath their existing dot-grid overlay.
export default function HeroImageBackdrop({ imageOpacity = 0.3 }) {
  return (
    <div className="absolute inset-x-0 top-0 h-screen pointer-events-none -z-10" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/images/topo-banner.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          opacity: imageOpacity,
        }}
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to bottom, transparent 0%, #0A0A0A 100%)' }}
      />
    </div>
  )
}
