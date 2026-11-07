import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        'bureau-black': '#0D0D0D',
        'bureau-dark': '#1A1A1A',
        // Document surfaces (parchment)
        'parchment-light': '#F5E6C8',
        'parchment': '#EDD9A3',
        'parchment-dark': '#E8D5A3',
        // Antique gold accents
        'gold-dark': '#B8960C',
        'gold': '#C9A227',
        'gold-light': '#D4AF37',
        // Forest green status
        'forest-dark': '#2D4A2D',
        'forest': '#345C34',
        'forest-light': '#3D6B3D',
        // Blood red alerts
        'blood-dark': '#8B1A1A',
        'blood': '#9B2020',
        'blood-light': '#A52A2A',
        // Text-safe tints for dark surfaces (WCAG AA >= 4.5:1 on bureau-black / bureau-dark).
        // The base forest-light / blood-light tokens are for fills and borders, not text on dark.
        'forest-text': '#5FA85F',
        'blood-text': '#E07070',
        // Text
        'off-white': '#E8E8E0',
        'near-black': '#1A1A1A',
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      // Semantic type steps. Consumed by the `.type-*` classes in src/index.css.
      fontSize: {
        'step-display': ['2.75rem', { lineHeight: '1.05', letterSpacing: '-0.01em' }],
        'step-title': ['1.5rem', { lineHeight: '1.2' }],
        'step-heading': ['1.125rem', { lineHeight: '1.3' }],
        'step-label': ['0.6875rem', { lineHeight: '1.4', letterSpacing: '0.2em' }],
        'step-meta': ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.05em' }],
        'step-body': ['0.9375rem', { lineHeight: '1.65' }],
        'step-body-sm': ['0.875rem', { lineHeight: '1.6' }],
      },
      animation: {
        none: 'none',
      },
      // Restrained, directional shadows (no glows): paper resting on a desk.
      boxShadow: {
        paper: '0 1px 2px rgba(0, 0, 0, 0.5), 0 2px 6px rgba(0, 0, 0, 0.35)',
        sheet: '0 8px 24px rgba(0, 0, 0, 0.55)',
      },
    },
  },
  plugins: [],
} satisfies Config
