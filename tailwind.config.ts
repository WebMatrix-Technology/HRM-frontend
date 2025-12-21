import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f3e8ff',
          100: '#e9d5ff',
          200: '#d8b4fe',
          300: '#c084fc',
          400: '#a855f7',
          500: '#8A2BE2', // WebMatrix purple
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        cyan: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#00FFFF', // WebMatrix cyan
          600: '#06b6d4',
          700: '#0891b2',
          800: '#0e7490',
          900: '#155e75',
        },
        dark: {
          bg: '#0A0A1A', // WebMatrix dark navy
          surface: '#151525',
          border: '#1f1f35',
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #8A2BE2 0%, #00FFFF 100%)',
        'gradient-purple-cyan': 'linear-gradient(135deg, #8A2BE2 0%, #00FFFF 100%)',
      },
    },
  },
  plugins: [],
}
export default config

