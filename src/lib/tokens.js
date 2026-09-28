// HekBot design tokens — the single source of truth for color and type.
// tailwind.config.js builds its theme from these, and JS-drawn UI (charts,
// inline styles) imports them directly, so nothing hardcodes a hex value.
// The rules for using them live in docs/DESIGN_SYSTEM.md.

// DN Creative palette, plus the only non-brand colors allowed: three
// functional status colors, each used for meaning (never decoration).
export const COLORS = {
  black:        '#0A0A0A', // page background, text on orange
  white:        '#F5F3EE', // primary text
  grayLight:    '#C8C6C0', // secondary text
  graphite:     '#6B6B6B', // placeholders and non-text strokes only (fails AA as text)
  grayMid:      '#383838', // neutral fills (chat bubbles)
  surface:      '#1E1E1E', // card base
  surfaceDark:  '#141414', // card top / nested surface
  orange:       '#FF5E1A', // the accent: one focal point per surface
  orangeLight:  '#FF8050', // accent hover
  orangeDark:   '#CC4C16', // accent on light backgrounds

  line:         'rgba(245,243,238,0.08)', // default borders and dividers
  lineStrong:   'rgba(245,243,238,0.16)', // dashed add-buttons, rules that must read
  fill:         'rgba(245,243,238,0.04)', // inputs, inset panels
  fillStrong:   'rgba(245,243,238,0.08)', // progress tracks, chips, hover fills
  tint:         'rgba(255,94,26,0.12)',   // orange tag / highlight / hover wash

  success:      '#4ADE80',
  warning:      '#FBBF24',
  danger:       '#F87171',
}

// Pitch Black overlays that keep copy readable over the live topo (brand rule:
// darken behind the copy instead of lowering the topo's intensity).
export const OVERLAYS = {
  header: 'linear-gradient(to bottom, rgba(10,10,10,0.3) 0%, rgba(10,10,10,0.55) 55%, rgba(10,10,10,0.95) 100%)',
  form:   'radial-gradient(ellipse at center, rgba(10,10,10,0.88) 0%, rgba(10,10,10,0.6) 45%, rgba(10,10,10,0.1) 100%)',
}

// Type scale. DM Sans for everything readable, Bebas Neue for display only.
// [size, lineHeight]
export const FONT_SIZES = {
  label:        ['13px', '1.35'], // uppercase + tracking-label; the smallest size allowed
  caption:      ['14px', '1.45'],
  body:         ['16px', '1.55'],
  'display-xs': ['18px', '1.1'],
  'display-sm': ['24px', '1.05'],
  'display-md': ['32px', '1'],
  'display-lg': ['48px', '0.95'],
  hero:         ['clamp(36px, 5.5vw, 52px)', '1'],
}

export const TRACKING = {
  label:   '0.15em', // uppercase DM Sans labels
  button:  '0.08em', // uppercase DM Sans buttons
  display: '0.06em', // Bebas Neue display sizes
  hero:    '0.02em', // Bebas Neue hero
}

// Recharts renders its own text: chart ticks and labels use the label size.
export const CHART_FONT = { fontFamily: 'DM Sans', fontSize: 13 }
