import { COLORS, FONT_SIZES, TRACKING } from './src/lib/tokens.js'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      // Built from src/lib/tokens.js — see docs/DESIGN_SYSTEM.md for the rules.
      colors: Object.fromEntries(
        Object.entries(COLORS).map(([k, v]) => [`dn-${k.replace(/[A-Z]/g, c => '-' + c.toLowerCase())}`, v]),
      ),
      fontSize: FONT_SIZES,
      letterSpacing: TRACKING,
      fontFamily: {
        sans:    ['"DM Sans"', 'sans-serif'],
        display: ['"Bebas Neue"', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '2px',
        sm: '2px',
        md: '4px',
      },
      transitionTimingFunction: {
        'dn': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(28px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
