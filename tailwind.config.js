/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Cyberpunk theme colors
        neon: {
          pink: '#ff006e',
          cyan: '#00f5ff',
          purple: '#b537f2',
          green: '#39ff14',
          yellow: '#fffd38',
        },
        dark: {
          bg: '#0a0e27',
          surface: '#1a1f3a',
          border: '#2a3f5f',
        },
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      boxShadow: {
        neon: '0 0 10px rgba(255, 0, 110, 0.5)',
        'neon-cyan': '0 0 10px rgba(0, 245, 255, 0.5)',
        'neon-purple': '0 0 10px rgba(181, 55, 242, 0.5)',
      },
    },
  },
  plugins: [],
};
