export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enforce class-based dark mode
  theme: {
    extend: {
      fontFamily: {
        serif: ['Cinzel', 'serif'],
        sans: ['Manrope', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      colors: {
        // Silver Ledger Palette
        obsidian: '#050505',
        charcoal: '#0F0F0F',
        silver: '#E5E5E5',
        marble: '#F4F4F6',
        chrome: '#E5E7EB', // Metallic accent

        // Semantic mappings
        'theme-bg': 'var(--bg-primary)',
        'theme-bg-secondary': 'var(--bg-secondary)',
        'theme-bg-tertiary': 'var(--bg-tertiary)',
        'theme-bg-hover': 'var(--bg-hover)',

        'theme-text': 'var(--text-primary)',
        'theme-text-secondary': 'var(--text-secondary)',
        'theme-text-tertiary': 'var(--text-tertiary)',

        'theme-border': 'var(--border-primary)',
        'theme-border-secondary': 'var(--border-secondary)',

        // Dark theme specific classes
        'dark-bg': '#050505',
        'dark-card': '#0A0A0A',
        'dark-hover': '#1A1A1A',
        'dark-text-primary': '#E5E5E5',
        'dark-text-secondary': '#A0A0A0',
        'dark-text-tertiary': '#606060',
        'dark-border': '#333333',

        // Light theme specific classes
        'light-bg': '#FAFBFC',
        'light-card': '#FFFFFF',
        'light-hover': '#F3F4F6',
        'light-text-primary': '#111827',
        'light-text-secondary': '#6B7280',
        'light-text-tertiary': '#9CA3AF',
        'light-border': '#E5E7EB',

        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
          900: '#14532d',
        },
        danger: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
          900: '#7f1d1d',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
          900: '#78350f',
        },
      },
      backgroundImage: {
        'gradient-metallic': 'linear-gradient(135deg, #E5E5E5 0%, #A0A0A0 100%)',
        'gradient-obsidian': 'linear-gradient(135deg, #111111 0%, #050505 100%)',
      },
      boxShadow: {
        'metallic': '0 4px 6px -1px rgba(255, 255, 255, 0.1), 0 2px 4px -1px rgba(255, 255, 255, 0.06)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.5s ease-out forwards',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'marquee': 'marquee 300s linear infinite',
        'marquee-slow': 'marquee-slow 180s linear infinite',
        'spin-slow': 'spin 12s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'glow': 'glow 3s ease-in-out infinite',
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
          '100%': { transform: 'translateX(-100%)' },
        },
        'marquee-slow': {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(2deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        glow: {
          '0%, 100%': { opacity: '0.5', filter: 'brightness(1)' },
          '50%': { opacity: '1', filter: 'brightness(1.2)' },
        },
      },
    },
  },
  plugins: [],
}