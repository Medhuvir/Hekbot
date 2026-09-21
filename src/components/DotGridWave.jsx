import { useEffect, useRef } from 'react'

// Native dot-grid-wave background — a grid of DN-orange dots whose size and
// opacity ripple in a traveling sine wave. Brand-standard: low peak opacity,
// same understated-texture role TopoBackground plays elsewhere.
export default function DotGridWave({
  className = '',
  color = '#FF5E1A',
  spacing = 26,
  baseOpacity = 0.12,
  peakOpacity = 0.75,
  overallOpacity = 0.16,
}) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    let width = 0
    let height = 0
    let frame = null
    let t = reduceMotion ? 9999 : 0 // static frame if the user prefers reduced motion

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect()
      width  = rect.width
      height = rect.height
      canvas.width  = width  * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function draw() {
      ctx.clearRect(0, 0, width, height)
      const cols = Math.ceil(width  / spacing) + 1
      const rows = Math.ceil(height / spacing) + 1

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * spacing
          const y = row * spacing
          // Diagonal traveling wave — phase depends on position, amplitude on time.
          const phase = (x + y) * 0.02 - t * 0.03
          const wave  = (Math.sin(phase) + 1) / 2 // 0..1
          const alpha = baseOpacity + wave * (peakOpacity - baseOpacity)
          const radius = 1.2 + wave * 1.6

          ctx.beginPath()
          ctx.arc(x, y, radius, 0, Math.PI * 2)
          ctx.fillStyle = color
          ctx.globalAlpha = alpha
          ctx.fill()
        }
      }
    }

    function tick() {
      t += 1
      draw()
      if (!reduceMotion) frame = requestAnimationFrame(tick)
    }

    // Changing canvas.width/height (inside resize()) clears the buffer, so
    // every resize must be immediately followed by a redraw — including the
    // mandatory first callback ResizeObserver fires right after observe(),
    // which would otherwise leave a blank canvas whenever the RAF loop isn't
    // running (prefers-reduced-motion).
    function resizeAndDraw() {
      resize()
      draw()
    }

    resizeAndDraw()
    if (!reduceMotion) frame = requestAnimationFrame(tick)

    const ro = new ResizeObserver(resizeAndDraw)
    ro.observe(canvas.parentElement)

    return () => {
      if (frame) cancelAnimationFrame(frame)
      ro.disconnect()
    }
  }, [color, spacing, baseOpacity, peakOpacity])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ opacity: overallOpacity }}
      aria-hidden="true"
    />
  )
}
