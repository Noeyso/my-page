/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#385f98',
        'primary-dark': '#2b4c7e',
        'navy-950': '#0b1230',
        'navy-900': '#101b3b',
        'navy-850': '#132247',
        'navy-800': '#1a2f5b',
        'navy-700': '#27457d',
        'text-ice': '#dbedff',
        'text-fog': '#a6bed8',
        'stroke-mid': '#3f5f88',
        'stroke-soft': '#5f7ca3',
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
    },
  },
  plugins: [],
};
