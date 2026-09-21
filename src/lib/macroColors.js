// DN Creative brand-compliant macro color system.
// The brand system allows exactly one orange accent per surface and no colors
// outside its defined palette — so distinct macro colors come from tonal steps
// of Warm White rather than introducing new hues (blue/red/amber like a
// typical Material palette). Calories gets the ring's single orange accent;
// protein/carbs/fat step down in brightness, matching nutrient priority
// (protein is the non-negotiable macro per the nutrition targets).
export const MACRO_COLORS = {
  calories: '#FF5E1A',
  protein:  'rgba(245,243,238,0.92)',
  carbs:    'rgba(245,243,238,0.55)',
  fat:      'rgba(245,243,238,0.35)',
}

export const MACRO_CHIP_BG = 'rgba(245,243,238,0.06)'
export const CALORIE_CHIP_BG = 'rgba(255,94,26,0.10)'

// Functional adherence colors — not brand colors, the same semantic
// green/amber/red used elsewhere in the app (WeeklySummary trend badge,
// MacroBar thresholds) for on-track / partial / low status.
export const STATUS_COLORS = {
  onTrack: '#22C55E',
  partial: '#F59E0B',
  low:     '#EF4444',
}
