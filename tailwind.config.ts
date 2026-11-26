import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#0A0A0B',
        washi: '#F5F0E8',
        vermilion: '#C8553D',
        moss: '#6B8E5E',
        indigo: '#3A7CA5',
        inkLight: '#1A1A1D',
        washiDark: '#E8E0D0',
      },
      fontFamily: {
        sans: ['var(--font-plex-sans-jp)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-noto-serif-jp)', 'Georgia', 'serif'],
      },
      animation: {
        'brush-stroke': 'brushStroke 1.8s ease-out forwards',
        'seal-stamp': 'sealStamp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 1.2s forwards',
        'fade-in': 'fadeIn 0.5s ease-out 1.7s forwards',
      },
      keyframes: {
        brushStroke: {
          '0%': { strokeDashoffset: '1000', opacity: '0' },
          '10%': { opacity: '1' },
          '100%': { strokeDashoffset: '0', opacity: '1' },
        },
        sealStamp: {
          '0%': { transform: 'scale(0) rotate(-15deg)', opacity: '0' },
          '50%': { transform: 'scale(1.2) rotate(5deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
export default config