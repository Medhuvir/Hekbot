/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        'dn-black':        '#0A0A0A',
        'dn-white':        '#F5F3EE',
        'dn-orange':       '#FF5E1A',
        'dn-orange-dark':  '#CC4C16',
        'dn-orange-light': '#FF8050',
        'dn-surface':      '#1E1E1E',
        'dn-surface-dark': '#141414',
        'dn-graphite':     '#6B6B6B',
        'dn-gray-light':   '#C8C6C0',
        'dn-gray-mid':     '#383838',
      },
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
        'topo-shift': 'topoShift 18s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
      keyframes: {
        topoShift: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%':      { transform: 'translate(-1%, 0.5%) scale(1.01)' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(28px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
