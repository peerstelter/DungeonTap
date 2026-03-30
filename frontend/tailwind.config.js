/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        dungeon: {
          black: '#0a0a0f',
          dark: '#12121a',
          gray: '#1e1e2e',
          border: '#2a2a3e',
          gold: '#c9a227',
          'gold-light': '#f0c040',
          red: '#c0392b',
          green: '#27ae60',
          blue: '#2980b9',
          purple: '#8e44ad',
        },
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
        ui: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        shake: 'shake 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-8px)' },
          '75%': { transform: 'translateX(8px)' },
        },
        slideUp: {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
