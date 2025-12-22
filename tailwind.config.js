/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Comic Neue', 'sans-serif'],
        headline: ['Mouse Memoirs', 'cursive'],
        title: ['Sniglet', 'cursive'],
        paragraph: ['Comic Neue', 'sans-serif'],
        caption: ['Kalam', 'cursive'],
        banner: ['Chewy', 'cursive'],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      colors: {
        'brand-green-light': '#D6F2D5',
        'brand-green-dark': '#4CAF50',
        'brand-yellow': '#FFD700',
        'brand-pink': '#FFA7A7',
        'brand-blue': '#4A90E2',
        'brand-magenta': '#E83E8C',
        'brand-cream': '#FCFBF5',
      },
      backgroundImage: {
        'dotted-paper': 'radial-gradient(#CBD5E1 1.5px, transparent 1.5px)',
      },
      backgroundSize: {
        dots: '24px 24px',
      },
    },
  },
  plugins: [],
};
