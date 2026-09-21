import TopoBackground from './TopoBackground'

// Standard dashboard card background: topo texture + a dark gradient that
// fades from opaque at the top to transparent by 70% of the card height,
// so header content stays readable while the lower portion of the card
// (charts, data) sits clean against the plain surface.
export default function CardTexture({ opacity = 0.1 }) {
  return (
    <>
      <TopoBackground opacity={opacity} />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(10,10,10,0.65) 0%, rgba(10,10,10,0.28) 40%, rgba(10,10,10,0) 70%)' }}
      />
    </>
  )
}
