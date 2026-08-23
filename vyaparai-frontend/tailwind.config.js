/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      },
      colors: {
        brand: {
          navy: '#0B1B4D',
          blue: '#1E5AF0',
          teal: '#12B0A0',
          green: '#2FD189',
        },
      },
    },
  },
  corePlugins: {
    preflight: true,
  },
  plugins: [],
}
