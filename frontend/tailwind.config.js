/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Theme-aware colors using CSS variables
        'theme-bg': 'var(--bg-primary)',
        'theme-bg-secondary': 'var(--bg-secondary)',
        'theme-bg-tertiary': 'var(--bg-tertiary)',
        'theme-bg-hover': 'var(--bg-hover)',

        'theme-text': 'var(--text-primary)',
        'theme-text-secondary': 'var(--text-secondary)',
        'theme-text-tertiary': 'var(--text-tertiary)',

        'theme-border': 'var(--border-primary)',
        'theme-border-secondary': 'var(--border-secondary)',

        primary: {
          50: '#eefaff',
          100: '#dcf3ff',
          200: '#b7eaff',
          300: '#7edbff',
          400: '#3ecbff',
          500: '#0ea5e9',
          600: '#0081d1',
          700: '#0066b3',
          800: '#005391',
          900: '#004778',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        'dark-bg': '#000000',
        'dark-card': '#111111',
        'dark-hover': '#1F1F1F',
        'dark-border': '#2F2F2F',

        'dark-text-primary': '#F5F5F5',
        'dark-text-secondary': '#A0A0A0',
        'dark-text-tertiary': '#606060',

        'light-bg': '#FFFFFF',
        'light-card': '#F8F9FA',
        'light-hover': '#E9ECEF',
        'light-border': '#DEE2E6',

        'light-text-primary': '#212529',
        'light-text-secondary': '#6C757D',
        'light-text-tertiary': '#ADB5BD',

        'zinc-950': '#0A0A0A',
        'zinc-900': '#1A1A1A',
        'zinc-800': '#2A2A2A',
        'zinc-700': '#3A3A3A',
        'zinc-600': '#5A5A5A',
        'zinc-500': '#7A7A7A',
        'zinc-400': '#9A9A9A',
        'zinc-300': '#BABABA',
        'zinc-200': '#DADADA',
        'zinc-100': '#F0F0F0',
        'zinc-50': '#FAFAFA',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #0ea5e9 0%, #0081d1 100%)',
        'gradient-success': 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
        'gradient-danger': 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        'gradient-dark': 'linear-gradient(135deg, #111111 0%, #000000 100%)',
      },
      boxShadow: {
        'glow-primary': '0 0 25px rgba(14, 165, 233, 0.4)',
        'glow-success': '0 0 25px rgba(34, 197, 94, 0.4)',
        'glow-danger': '0 0 25px rgba(239, 68, 68, 0.4)',
        'glow-white': '0 0 20px rgba(255, 255, 255, 0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.5s ease-out forwards',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'marquee': 'marquee 25s linear infinite',
        'flash-green': 'flashGreen 1.2s ease-out',
        'flash-red': 'flashRed 1.2s ease-out',
        'background-pan': 'background-pan 15s ease infinite',
        'pulse-border-green': 'pulseBorderGreen 2s ease-in-out infinite',
        'pulse-border-red': 'pulseBorderRed 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        flashGreen: {
          '0%, 100%': { backgroundColor: 'transparent' },
          '20%, 60%': { backgroundColor: 'rgba(34, 197, 94, 0.3)' },
        },
        flashRed: {
          '0%, 100%': { backgroundColor: 'transparent' },
          '20%, 60%': { backgroundColor: 'rgba(239, 68, 68, 0.3)' },
        },
        'background-pan': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        pulseBorderGreen: {
          '0%, 100%': { borderColor: 'rgba(34, 197, 94, 0.4)' },
          '50%': { borderColor: 'rgba(74, 222, 128, 0.9)' },
        },
        pulseBorderRed: {
          '0%, 100%': { borderColor: 'rgba(239, 68, 68, 0.4)' },
          '50%': { borderColor: 'rgba(248, 113, 113, 0.9)' },
        }
      },
    },
  },
  plugins: [],
}