import { useEffect, useRef } from 'react'
import '../lib/topo-motion' // DN Creative live topo generator — sets window.TopoMotion

// The DN Creative live topographic background (the dncreative.studio header
// treatment): seeded contours that draw themselves in, keep evolving, swell
// around the cursor, and get a periodic scan sweep. Brand standard is
// intensity 1 — readability comes from the `overlay` gradient laid over it,
// not from fading the topo. `hostRef` is the element whose pointer movement
// drives the cursor warp (defaults to the canvas's parent).
export default function LiveTopo({ hostRef, overlay, className = '' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !window.TopoMotion) return
    const topo = window.TopoMotion.create(canvas, { host: hostRef?.current || canvas.parentElement })
    return () => topo.destroy()
  }, [hostRef])

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} aria-hidden="true">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
      {overlay && <div className="absolute inset-0" style={{ background: overlay }} />}
    </div>
  )
}
