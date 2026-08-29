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
        background: '#F6F5F2',
        surface: '#FFFFFF',
        border: '#EDEAE3',
        primary: {
          DEFAULT: '#F5C518',
          foreground: '#1A1A1A',
        },
        gold: '#E0A800',
        cream: '#FFF6D6',
        success: '#16A34A',
        danger: '#DC2626',
        info: '#2563EB',
        muted: {
          DEFAULT: '#F3F1EC',
          foreground: '#6B7280',
        },
        foreground: '#1A1A1A',
      },
      boxShadow: {
        card: '0 10px 30px rgba(24, 24, 27, 0.05)',
        soft: '0 4px 16px rgba(24, 24, 27, 0.04)',
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
