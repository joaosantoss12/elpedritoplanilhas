/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0F172A',
        surface: '#0F1C38',
        muted: '#101A34',
        card: '#132241',
        border: 'rgba(255,255,255,0.08)',
        primary: '#1E40AF',
        secondary: '#3B82F6',
        green: '#059669',
        greenSoft: 'rgba(5,150,105,0.14)',
        red: '#DC2626',
        redSoft: 'rgba(220,38,38,0.14)',
        pending: '#D97706',
        pendingSoft: 'rgba(217,119,6,0.14)',
        fg: '#FFFFFF',
        fgMuted: '#94A3B8',
        fgDim: '#64748B',
      },
      fontFamily: {
        sans: ['"Fira Sans"', 'system-ui', 'sans-serif'],
        mono: ['"Fira Code"', 'ui-monospace', 'monospace'],
      },
      borderRadius: { xl: '14px', '2xl': '18px' },
      boxShadow: {
        card: '0 1px 0 rgba(255,255,255,0.03) inset, 0 8px 24px rgba(0,0,0,0.35)',
      },
      spacing: { 4.5: '1.125rem' },
    },
  },
  plugins: [],
};
