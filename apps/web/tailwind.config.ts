import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs: ['0.75rem', '1rem'],
        sm: ['0.875rem', '1.25rem'],
        base: ['1rem', '1.5rem'],
        lg: ['1.25rem', '1.75rem'],
      },
      colors: {
        background: '#0E1014',
        surface: '#171A21',
        border: '#2A2F3A',
        primary: {
          DEFAULT: '#F5C518',
          foreground: '#141414',
        },
        gold: '#F5C518',
        cream: '#2A2414',
        success: '#34D399',
        danger: '#F87171',
        info: '#60A5FA',
        muted: {
          DEFAULT: '#1F232B',
          foreground: '#9CA3AF',
        },
        foreground: '#F4F4F5',
      },
      boxShadow: {
        card: '0 12px 32px rgba(0, 0, 0, 0.35)',
        soft: '0 4px 16px rgba(0, 0, 0, 0.28)',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
      },
    },
  },
  plugins: [],
};

export default config;
