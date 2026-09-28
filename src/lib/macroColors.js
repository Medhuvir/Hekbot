import { COLORS } from './tokens'

// Macro colors. Brand rules allow one orange accent and no extra hues, so
// macros are told apart by tonal steps of the neutral palette, stepping down
// with nutrient priority (protein is the non-negotiable macro). Every step is
// also used as text, so each one clears WCAG AA (4.5:1) on the card surface.
export const MACRO_COLORS = {
  calories: COLORS.orange,
  protein:  COLORS.white,
  carbs:    COLORS.grayLight,
  fat:      'rgba(200,198,192,0.7)', // Gray Light at 70% ≈ 6:1 on the card surface
}

export const MACRO_CHIP_BG   = COLORS.fillStrong
export const CALORIE_CHIP_BG = COLORS.tint

// Functional status colors — the only non-brand hues, used only for meaning.
export const STATUS_COLORS = {
  onTrack: COLORS.success,
  partial: COLORS.warning,
  low:     COLORS.danger,
}
